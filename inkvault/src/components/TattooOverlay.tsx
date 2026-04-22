import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasTouch } from '../hooks/useCanvasTouch';
import {
  type WarpQuad,
  drawWarpedImage,
  drawWarpGrid,
  drawWarpHandles,
  nearestWarpHandle,
  defaultQuadFromTransform,
} from './PerspectiveWarp';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface TattooOverlayProps {
  bodyPhoto: string;
  tattooSrc: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface OverlayTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function coverFit(
  img: HTMLImageElement,
  cw: number,
  ch: number
): [number, number, number, number] {
  const scale = Math.max(cw / img.width, ch / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return [(cw - w) / 2, (ch - h) / 2, w, h];
}

function drawHandles(
  ctx: CanvasRenderingContext2D,
  transform: OverlayTransform,
  img: HTMLImageElement
) {
  const w = img.width * transform.scale;
  const h = img.height * transform.scale;

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate(transform.rotation);

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  const corners: [number, number][] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * Convert an image to a high-contrast grayscale stencil on an offscreen canvas.
 */
function buildStencilCanvas(src: HTMLImageElement): HTMLCanvasElement {
  const oc = document.createElement('canvas');
  oc.width = src.width;
  oc.height = src.height;
  const octx = oc.getContext('2d')!;
  octx.drawImage(src, 0, 0);
  const imageData = octx.getImageData(0, 0, oc.width, oc.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // High-contrast threshold
    const val = gray < 128 ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = val;
    // Preserve original alpha
  }
  octx.putImageData(imageData, 0, 0);
  return oc;
}

// ─── Default transform ─────────────────────────────────────────────────────────

const DEFAULT_TRANSFORM: OverlayTransform = {
  x: 0,
  y: 0,
  scale: 0.4,
  rotation: 0,
  opacity: 0.9,
  blendMode: 'multiply',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function TattooOverlay({ bodyPhoto, tattooSrc, onSave, onClose }: TattooOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyImgRef = useRef<HTMLImageElement | null>(null);
  const tattooImgRef = useRef<HTMLImageElement | null>(null);
  const stencilCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const transformRef = useRef<OverlayTransform>({ ...DEFAULT_TRANSFORM });

  const [transform, setTransform] = useState<OverlayTransform>({ ...DEFAULT_TRANSFORM });
  const [isSelected, setIsSelected] = useState(true);
  const [stencil, setStencil] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

  // ── Warp state ────────────────────────────────────────────────────────────────
  const [warpMode, setWarpMode] = useState(false);
  const [warpQuad, setWarpQuad] = useState<WarpQuad | null>(null);
  const [warpSlices, setWarpSlices] = useState(64);

  const warpModeRef = useRef(false);
  const warpQuadRef = useRef<WarpQuad | null>(null);
  const warpSlicesRef = useRef(64);
  const activeWarpHandleRef = useRef<keyof WarpQuad | null>(null);
  const lastWarpPointerRef = useRef<{ x: number; y: number } | null>(null);
  const warpMouseDownRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => { warpModeRef.current = warpMode; }, [warpMode]);
  useEffect(() => { warpQuadRef.current = warpQuad; }, [warpQuad]);
  useEffect(() => { warpSlicesRef.current = warpSlices; }, [warpSlices]);

  // ── Load images ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setImagesReady(false);

    const body = new Image();
    body.crossOrigin = 'anonymous';
    const tattoo = new Image();
    tattoo.crossOrigin = 'anonymous';

    let bodyLoaded = false;
    let tattooLoaded = false;

    function checkReady() {
      if (!mounted || !bodyLoaded || !tattooLoaded) return;

      // Centre the tattoo on load
      const canvas = canvasRef.current;
      if (canvas) {
        setTransform((prev) => ({
          ...prev,
          x: canvas.width / 2,
          y: canvas.height / 2,
        }));
        transformRef.current = {
          ...transformRef.current,
          x: canvas.width / 2,
          y: canvas.height / 2,
        };
      }

      stencilCanvasRef.current = buildStencilCanvas(tattoo);
      bodyImgRef.current = body;
      tattooImgRef.current = tattoo;
      setImagesReady(true);
    }

    body.onload = () => {
      bodyLoaded = true;
      checkReady();
    };
    tattoo.onload = () => {
      tattooLoaded = true;
      checkReady();
    };

    body.src = bodyPhoto;
    tattoo.src = tattooSrc;

    return () => {
      mounted = false;
    };
  }, [bodyPhoto, tattooSrc]);

  // ── Render loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imagesReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bodyImg = bodyImgRef.current!;
    const tattooImg = tattooImgRef.current!;

    function render() {
      const t = transformRef.current;
      const W = canvas!.width;
      const H = canvas!.height;

      ctx!.clearRect(0, 0, W, H);

      // 1. Body photo — cover-fit
      ctx!.drawImage(bodyImg, ...coverFit(bodyImg, W, H));

      const drawSrc: CanvasImageSource = stencilCanvasRef.current && stencil
        ? stencilCanvasRef.current
        : tattooImg;

      if (warpModeRef.current) {
        // 2a. Warp mode: render via quad
        const q = warpQuadRef.current;
        if (q) {
          ctx!.save();
          ctx!.globalAlpha = t.opacity;
          ctx!.globalCompositeOperation = t.blendMode;
          drawWarpedImage(ctx!, drawSrc as HTMLImageElement | HTMLCanvasElement, q, warpSlicesRef.current);
          ctx!.restore();

          ctx!.globalAlpha = 1;
          ctx!.globalCompositeOperation = 'source-over';
          drawWarpGrid(ctx!, q);
          drawWarpHandles(ctx!, q, activeWarpHandleRef.current);
        }
      } else {
        // 2b. Normal mode: simple transform
        ctx!.save();
        ctx!.globalAlpha = t.opacity;
        ctx!.globalCompositeOperation = t.blendMode;
        ctx!.translate(t.x, t.y);
        ctx!.rotate(t.rotation);
        ctx!.scale(t.scale, t.scale);
        ctx!.drawImage(drawSrc, -tattooImg.width / 2, -tattooImg.height / 2);
        ctx!.restore();

        // 3. Selection handles
        if (isSelected) {
          ctx!.globalAlpha = 1;
          ctx!.globalCompositeOperation = 'source-over';
          drawHandles(ctx!, t, tattooImg);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [imagesReady, isSelected, stencil]);

  // ── Interaction callbacks ─────────────────────────────────────────────────────
  const handleDrag = useCallback((dx: number, dy: number) => {
    if (warpModeRef.current) return;
    setTransform((prev) => {
      const next = { ...prev, x: prev.x + dx, y: prev.y + dy };
      transformRef.current = next;
      return next;
    });
    setIsSelected(true);
  }, []);

  const handlePinch = useCallback(
    (scaleDelta: number, angleDelta: number, _cx: number, _cy: number) => {
      if (warpModeRef.current) return;
      setTransform((prev) => {
        const next = {
          ...prev,
          scale: Math.max(0.05, Math.min(10, prev.scale * scaleDelta)),
          rotation: prev.rotation + angleDelta,
        };
        transformRef.current = next;
        return next;
      });
      setIsSelected(true);
    },
    []
  );

  useCanvasTouch(canvasRef, handleDrag, handlePinch);

  // ── Warp pointer events (capture phase to take priority over useCanvasTouch) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !warpMode) return;

    function toCanvas(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas!.width / rect.width),
        y: (clientY - rect.top) * (canvas!.height / rect.height),
      };
    }

    function applyMove(x: number, y: number) {
      const last = lastWarpPointerRef.current;
      if (!last) return;
      const dx = x - last.x;
      const dy = y - last.y;
      lastWarpPointerRef.current = { x, y };
      const handle = activeWarpHandleRef.current;
      setWarpQuad((prev) => {
        if (!prev) return prev;
        const next: WarpQuad = handle
          ? { ...prev, [handle]: { x: prev[handle].x + dx, y: prev[handle].y + dy } }
          : {
              tl: { x: prev.tl.x + dx, y: prev.tl.y + dy },
              tr: { x: prev.tr.x + dx, y: prev.tr.y + dy },
              br: { x: prev.br.x + dx, y: prev.br.y + dy },
              bl: { x: prev.bl.x + dx, y: prev.bl.y + dy },
            };
        warpQuadRef.current = next;
        return next;
      });
    }

    function onTouchStart(e: TouchEvent) {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (e.touches.length !== 1 || !warpQuadRef.current) return;
      const { x, y } = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      activeWarpHandleRef.current = nearestWarpHandle(x, y, warpQuadRef.current);
      lastWarpPointerRef.current = { x, y };
    }

    function onTouchMove(e: TouchEvent) {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (e.touches.length !== 1 || !lastWarpPointerRef.current) return;
      const { x, y } = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      applyMove(x, y);
    }

    function onTouchEnd(e: TouchEvent) {
      e.stopImmediatePropagation();
      if (e.touches.length === 0) {
        activeWarpHandleRef.current = null;
        lastWarpPointerRef.current = null;
      }
    }

    function onMouseDown(e: MouseEvent) {
      e.stopImmediatePropagation();
      if (!warpQuadRef.current) return;
      const { x, y } = toCanvas(e.clientX, e.clientY);
      activeWarpHandleRef.current = nearestWarpHandle(x, y, warpQuadRef.current);
      lastWarpPointerRef.current = { x, y };
      warpMouseDownRef.current = true;
    }

    function onMouseMove(e: MouseEvent) {
      if (!warpMouseDownRef.current || !lastWarpPointerRef.current) return;
      const { x, y } = toCanvas(e.clientX, e.clientY);
      applyMove(x, y);
    }

    function onMouseUp() {
      warpMouseDownRef.current = false;
      activeWarpHandleRef.current = null;
      lastWarpPointerRef.current = null;
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    canvas.addEventListener('mousedown', onMouseDown, { capture: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart, { capture: true });
      canvas.removeEventListener('touchmove', onTouchMove, { capture: true });
      canvas.removeEventListener('touchend', onTouchEnd, { capture: true });
      canvas.removeEventListener('mousedown', onMouseDown, { capture: true });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [warpMode]);

  // ── Canvas sizing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const container = canvas!.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      canvas!.width = rect.width;
      canvas!.height = rect.height;

      // Re-centre on resize
      setTransform((prev) => ({
        ...prev,
        x: rect.width / 2,
        y: rect.height / 2,
      }));
    }

    resize();
    const observer = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────────
  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bodyImg = bodyImgRef.current;
    const tattooImg = tattooImgRef.current;
    if (!bodyImg || !tattooImg) return;

    const t = transformRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bodyImg, ...coverFit(bodyImg, canvas.width, canvas.height));

    const drawSrc: CanvasImageSource = stencilCanvasRef.current && stencil
      ? stencilCanvasRef.current
      : tattooImg;

    ctx.save();
    ctx.globalAlpha = t.opacity;
    ctx.globalCompositeOperation = t.blendMode;

    if (warpMode && warpQuadRef.current) {
      drawWarpedImage(ctx, drawSrc as HTMLImageElement | HTMLCanvasElement, warpQuadRef.current, warpSlices);
    } else {
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);
      ctx.scale(t.scale, t.scale);
      ctx.drawImage(drawSrc, -tattooImg.width / 2, -tattooImg.height / 2);
    }
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.92));
  }

  function handleReset() {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 0;
    const cy = canvas ? canvas.height / 2 : 0;
    const reset: OverlayTransform = { ...DEFAULT_TRANSFORM, x: cx, y: cy };
    setTransform(reset);
    transformRef.current = reset;
  }

  function handleToggleWarp() {
    if (!warpMode) {
      // Initialize quad from current tattoo transform when first entering warp mode
      const canvas = canvasRef.current;
      const tattooImg = tattooImgRef.current;
      if (canvas && tattooImg) {
        const t = transformRef.current;
        const q = defaultQuadFromTransform(t.x, t.y, t.scale, t.rotation, tattooImg.width, tattooImg.height);
        warpQuadRef.current = q;
        setWarpQuad(q);
      }
    }
    setWarpMode((m) => !m);
  }

  function handleResetWarp() {
    const canvas = canvasRef.current;
    const tattooImg = tattooImgRef.current;
    if (!canvas || !tattooImg) return;
    const t = transformRef.current;
    const q = defaultQuadFromTransform(t.x, t.y, t.scale, t.rotation, tattooImg.width, tattooImg.height);
    warpQuadRef.current = q;
    setWarpQuad(q);
  }

  function handleCurveIn() {
    setWarpQuad((prev) => {
      if (!prev) return prev;
      const bow = Math.abs(prev.tr.x - prev.tl.x) * 0.15;
      const next: WarpQuad = {
        tl: { x: prev.tl.x + bow, y: prev.tl.y },
        tr: { x: prev.tr.x - bow, y: prev.tr.y },
        br: { x: prev.br.x + bow, y: prev.br.y },
        bl: { x: prev.bl.x - bow, y: prev.bl.y },
      };
      warpQuadRef.current = next;
      return next;
    });
  }

  function handleCurveOut() {
    setWarpQuad((prev) => {
      if (!prev) return prev;
      const bow = Math.abs(prev.tr.x - prev.tl.x) * 0.15;
      const next: WarpQuad = {
        tl: { x: prev.tl.x - bow, y: prev.tl.y },
        tr: { x: prev.tr.x + bow, y: prev.tr.y },
        br: { x: prev.br.x - bow, y: prev.br.y },
        bl: { x: prev.bl.x + bow, y: prev.bl.y },
      };
      warpQuadRef.current = next;
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!imagesReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
            }}
          >
            Loading…
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
          onClick={() => setIsSelected((s) => !s)}
        />
      </div>

      {/* Controls toolbar */}
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          color: '#fff',
          fontSize: 13,
        }}
      >
        {/* 3D Warp toggle */}
        <button
          onClick={handleToggleWarp}
          style={btnStyle(warpMode ? '#5b21b6' : '#3b3b3b')}
        >
          {warpMode ? '⬡ 3D Warp ON' : '⬡ 3D Warp'}
        </button>

        {/* Warp-mode controls (shown only when active) */}
        {warpMode && (
          <>
            <button onClick={handleResetWarp} style={btnStyle('#444')}>Reset Warp</button>
            <button onClick={handleCurveIn} style={btnStyle('#5b21b6')}>Curve In</button>
            <button onClick={handleCurveOut} style={btnStyle('#7c3aed')}>Curve Out</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Quality</span>
              <input
                type="range" min={32} max={128} step={8}
                value={warpSlices}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setWarpSlices(v);
                  warpSlicesRef.current = v;
                }}
                style={{ width: 70 }}
              />
              <span>{warpSlices}</span>
            </label>
          </>
        )}

        {/* Opacity — hidden in warp mode to save toolbar space */}
        {!warpMode && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Opacity</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={transform.opacity}
              onChange={(e) => {
                const opacity = parseFloat(e.target.value);
                setTransform((prev) => {
                  const next = { ...prev, opacity };
                  transformRef.current = next;
                  return next;
                });
              }}
              style={{ width: 90 }}
            />
            <span style={{ minWidth: 32, textAlign: 'right' }}>
              {Math.round(transform.opacity * 100)}%
            </span>
          </label>
        )}

        {/* Blend mode */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Blend</span>
          <select
            value={transform.blendMode}
            onChange={(e) => {
              const blendMode = e.target.value as GlobalCompositeOperation;
              setTransform((prev) => {
                const next = { ...prev, blendMode };
                transformRef.current = next;
                return next;
              });
            }}
            style={{
              background: '#222',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            <option value="source-over">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="overlay">Overlay</option>
          </select>
        </label>

        {/* Stencil toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={stencil}
            onChange={(e) => setStencil(e.target.checked)}
          />
          <span>Stencil</span>
        </label>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={btnStyle('#444')}
        >
          Reset
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          style={btnStyle('#1a7a4a')}
        >
          Save
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ ...btnStyle('#7a1a1a'), marginLeft: 'auto' }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
  };
}
