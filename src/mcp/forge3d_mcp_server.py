"""
FORGE3D Blender MCP Bridge Server
==================================
HTTP server that receives Blender Python scripts from the FORGE3D API,
executes them in headless Blender, and returns results.

Also exposes MCP-compatible tool endpoints for direct AI agent interaction.

Usage:
    python forge3d_mcp_server.py

Environment:
    BLENDER_PATH  - Path to Blender binary (default: /usr/bin/blender)
    MCP_PORT      - Server port (default: 8765)
    OUTPUT_DIR    - Render output directory (default: ./output)
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# --- Config ---
BLENDER_PATH = os.getenv("BLENDER_PATH", "/usr/bin/blender")
MCP_PORT = int(os.getenv("MCP_PORT", "8765"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("forge3d-mcp")

# --- App ---
app = FastAPI(title="FORGE3D Blender MCP Bridge", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Track active scenes for multi-step workflows
active_scenes: dict[str, Path] = {}


# --- Models ---
class ExecuteRequest(BaseModel):
    script: str = Field(..., description="Blender Python script to execute")
    order_id: str = Field(..., description="Associated order ID for tracking")
    timeout: int = Field(default=120, ge=10, le=600, description="Max execution time in seconds")


class ExportRequest(BaseModel):
    scene_id: str = Field(..., description="Scene ID from a previous execute call")
    format: str = Field(..., description="Output format: png, jpg, exr, stl, 3mf, step, obj, fbx, glb")
    render_engine: str = Field(default="cycles", description="cycles or eevee")
    samples: int | None = Field(default=None, description="Render samples (Cycles only)")
    resolution: dict[str, int] | None = Field(default=None, description="{'x': 2048, 'y': 2048}")


class ExecuteResponse(BaseModel):
    scene_id: str
    stdout: str
    stderr: str
    success: bool
    output_files: list[str]


class ExportResponse(BaseModel):
    file_path: str
    format: str
    success: bool


# --- Blender Execution ---
async def run_blender(script_path: str, blend_file: str | None = None, timeout: int = 120) -> dict[str, Any]:
    """Execute a Python script in headless Blender."""
    cmd = [BLENDER_PATH, "--background"]

    if blend_file and Path(blend_file).exists():
        cmd.append(blend_file)

    cmd.extend(["--python", script_path])

    logger.info(f"Executing: {' '.join(cmd)}")

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)

        return {
            "returncode": proc.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
        }
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(status_code=408, detail=f"Blender execution timed out after {timeout}s")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Blender not found at {BLENDER_PATH}")


# --- Routes ---
@app.get("/health")
async def health():
    """Health check — also verifies Blender is accessible."""
    blender_ok = Path(BLENDER_PATH).exists()
    return {
        "status": "healthy" if blender_ok else "degraded",
        "blender_path": BLENDER_PATH,
        "blender_available": blender_ok,
        "active_scenes": len(active_scenes),
    }


@app.post("/execute", response_model=ExecuteResponse)
async def execute_script(req: ExecuteRequest):
    """
    Execute a Blender Python script and save the resulting .blend scene.
    Returns a scene_id for subsequent export operations.
    """
    scene_id = str(uuid.uuid4())
    scene_dir = OUTPUT_DIR / scene_id
    scene_dir.mkdir(parents=True)

    blend_output = scene_dir / "scene.blend"

    # Append save command to the script
    save_script = f"""
{req.script}

# --- FORGE3D: Auto-save scene ---
import bpy
bpy.ops.wm.save_as_mainfile(filepath=r"{blend_output}")
print("FORGE3D_SCENE_SAVED: {scene_id}")
"""

    # Write script to temp file
    script_path = scene_dir / "render_script.py"
    script_path.write_text(save_script, encoding="utf-8")

    # Execute in Blender
    result = await run_blender(str(script_path), timeout=req.timeout)

    if result["returncode"] != 0:
        logger.error(f"Blender execution failed for order {req.order_id}: {result['stderr']}")
        raise HTTPException(
            status_code=500,
            detail=f"Blender script execution failed: {result['stderr'][:500]}",
        )

    # Track scene for future exports
    active_scenes[scene_id] = blend_output

    # Collect any output files the script created
    output_files = [str(f) for f in scene_dir.iterdir() if f.suffix != ".py"]

    logger.info(f"Scene {scene_id} created for order {req.order_id}")

    return ExecuteResponse(
        scene_id=scene_id,
        stdout=result["stdout"],
        stderr=result["stderr"],
        success=True,
        output_files=output_files,
    )


@app.post("/export", response_model=ExportResponse)
async def export_scene(req: ExportRequest):
    """
    Export a previously created scene in the requested format.
    Supports: png, jpg, exr (renders), stl, 3mf, obj, fbx, glb (geometry), step (CAD).
    """
    blend_file = active_scenes.get(req.scene_id)
    if not blend_file or not blend_file.exists():
        raise HTTPException(status_code=404, detail=f"Scene {req.scene_id} not found")

    scene_dir = blend_file.parent
    output_filename = f"output.{req.format}"
    output_path = scene_dir / output_filename

    # Build export script based on format
    if req.format in ("png", "jpg", "exr"):
        export_script = _build_render_script(req, str(output_path))
    elif req.format in ("stl", "obj", "fbx", "glb", "3mf"):
        export_script = _build_geometry_export_script(req.format, str(output_path))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {req.format}")

    script_path = scene_dir / f"export_{req.format}.py"
    script_path.write_text(export_script, encoding="utf-8")

    result = await run_blender(str(script_path), str(blend_file), timeout=300)

    if result["returncode"] != 0 or not output_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Export failed for format {req.format}: {result['stderr'][:500]}",
        )

    logger.info(f"Exported {req.format} for scene {req.scene_id}: {output_path}")

    return ExportResponse(file_path=str(output_path), format=req.format, success=True)


# --- Script Builders ---
def _build_render_script(req: ExportRequest, output_path: str) -> str:
    """Generate Blender Python script for image renders."""
    res_x = req.resolution.get("x", 2048) if req.resolution else 2048
    res_y = req.resolution.get("y", 2048) if req.resolution else 2048
    samples = req.samples or (256 if req.render_engine == "cycles" else 64)

    fmt_map = {"png": "PNG", "jpg": "JPEG", "exr": "OPEN_EXR"}
    blender_fmt = fmt_map.get(req.format, "PNG")

    return f"""
import bpy

scene = bpy.context.scene

# Render settings
scene.render.engine = '{"CYCLES" if req.render_engine == "cycles" else "BLENDER_EEVEE_NEXT"}'
scene.render.resolution_x = {res_x}
scene.render.resolution_y = {res_y}
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = '{blender_fmt}'
scene.render.filepath = r'{output_path}'

{"scene.cycles.samples = " + str(samples) if req.render_engine == "cycles" else ""}
{"scene.cycles.use_denoising = True" if req.render_engine == "cycles" else ""}

# Prefer GPU if available
if scene.render.engine == 'CYCLES':
    prefs = bpy.context.preferences.addons.get('cycles')
    if prefs:
        prefs.preferences.compute_device_type = 'CUDA'
        bpy.context.preferences.addons['cycles'].preferences.get_devices()
        for device in bpy.context.preferences.addons['cycles'].preferences.devices:
            device.use = True
        scene.cycles.device = 'GPU'

bpy.ops.render.render(write_still=True)
print("FORGE3D_RENDER_COMPLETE: {req.format}")
"""


def _build_geometry_export_script(fmt: str, output_path: str) -> str:
    """Generate Blender Python script for geometry exports."""
    exporters = {
        "stl": f"bpy.ops.wm.stl_export(filepath=r'{output_path}')",
        "obj": f"bpy.ops.wm.obj_export(filepath=r'{output_path}')",
        "fbx": f"bpy.ops.export_scene.fbx(filepath=r'{output_path}')",
        "glb": f"bpy.ops.export_scene.gltf(filepath=r'{output_path}', export_format='GLB')",
        "3mf": f"bpy.ops.export_mesh.threemf(filepath=r'{output_path}')",
    }

    export_cmd = exporters.get(fmt)
    if not export_cmd:
        raise HTTPException(status_code=400, detail=f"No exporter for format: {fmt}")

    return f"""
import bpy

# Select all mesh objects for export
bpy.ops.object.select_all(action='SELECT')
{export_cmd}
print("FORGE3D_EXPORT_COMPLETE: {fmt}")
"""


# --- Cleanup ---
@app.delete("/scenes/{scene_id}")
async def delete_scene(scene_id: str):
    """Clean up a scene and its output files."""
    if scene_id in active_scenes:
        scene_dir = active_scenes[scene_id].parent
        import shutil
        shutil.rmtree(scene_dir, ignore_errors=True)
        del active_scenes[scene_id]
        return {"deleted": True, "scene_id": scene_id}
    raise HTTPException(status_code=404, detail="Scene not found")


# --- Entry ---
if __name__ == "__main__":
    logger.info(f"Starting FORGE3D MCP Bridge on port {MCP_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=MCP_PORT, log_level="info")
