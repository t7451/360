import { useRef, useEffect, useState, useCallback } from 'react';
import { Undo2, Redo2, Trash2, Save } from 'lucide-react';

type DrawingTool = 'pen' | 'marker' | 'eraser';
type BrushSize = 'fine' | 'medium' | 'thick';

const BRUSH_PX: Record<BrushSize, number> = { fine: 2, medium: 5, thick: 12 };
const PRESET_COLORS = ['#000000', '#ef4444', '#ffffff'];
const MAX_HISTORY = 20;

interface DrawingCanvasProps {
  backgroundImage: string;
  width: number;
  height: number;
}

export function DrawingCanvas({ backgroundImage, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<DrawingTool>('pen');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');
  const [color, setColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // mutable refs so event handlers don't need to re-register on every state change
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const toolRef = useRef<DrawingTool>('pen');
  const brushSizeRef = useRef<BrushSize>('medium');
  const colorRef = useRef('#000000');

  toolRef.current = tool;
  brushSizeRef.current = brushSize;
  colorRef.current = color;

  // ─── canvas sizing ─────────────────────────────────────────────────────────
  const [displaySize, setDisplaySize] = useState({ w: width, h: height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const w = container.clientWidth || width;
      const ratio = height / width;
      setDisplaySize({ w, h: Math.round(w * ratio) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [width, height]);

  // ─── canvas init / bg image ────────────────────────────────────────────────
  const bgLoaded = useRef(false);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backgroundImage;
    img.onload = () => {
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      bgLoaded.current = true;
    };
  }, [backgroundImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = displaySize;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    bgLoaded.current = false;
    drawBackground(ctx, w, h);
  }, [displaySize, drawBackground]);

  // ─── drawing helpers ────────────────────────────────────────────────────────
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const applyToolSettings = (ctx: CanvasRenderingContext2D) => {
    const t = toolRef.current;
    const px = BRUSH_PX[brushSizeRef.current];
    ctx.lineWidth = px;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (t === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else if (t === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = colorRef.current;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colorRef.current;
    }
  };

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current = [...undoStack.current.slice(-MAX_HISTORY + 1), snap];
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const coordsFromClient = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = (canvas.width / (window.devicePixelRatio || 1)) / rect.width;
    const scaleY = (canvas.height / (window.devicePixelRatio || 1)) / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    saveSnapshot();
    applyToolSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
    setIsDrawing(true);
  };

  const continueDraw = (x: number, y: number) => {
    if (!drawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    applyToolSettings(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    const ctx = getCtx();
    if (ctx) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    drawingRef.current = false;
    setIsDrawing(false);
  };

  // ─── mouse events ───────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = coordsFromClient(e.clientX, e.clientY);
    startDraw(x, y);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const { x, y } = coordsFromClient(e.clientX, e.clientY);
    continueDraw(x, y);
  };

  const onMouseUp = () => endDraw();

  // ─── touch events (registered via useEffect for passive:false) ─────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = coordsFromClient(touch.clientX, touch.clientY);
      startDraw(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = coordsFromClient(touch.clientX, touch.clientY);
      continueDraw(x, y);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endDraw();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displaySize]);

  // ─── keyboard undo/redo ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── undo / redo / clear / save ────────────────────────────────────────────
  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || undoStack.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStack.current = [...redoStack.current, current];
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    ctx.putImageData(prev, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || redoStack.current.length === 0) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current = [...undoStack.current, current];
    const next = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    ctx.putImageData(next, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    saveSnapshot();
    const { w, h } = displaySize;
    drawBackground(ctx, w, h);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inkvault-annotation.png';
    a.click();
  };

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="drawing-canvas-wrapper" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          touchAction: 'none',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          display: 'block',
          maxWidth: '100%',
        }}
      />

      {/* ── Toolbar ── */}
      <div className="drawing-toolbar">
        {/* tools */}
        <div className="drawing-toolbar-group">
          {(['pen', 'marker', 'eraser'] as DrawingTool[]).map((t) => (
            <button
              key={t}
              className={`drawing-tool-btn${tool === t ? ' active' : ''}`}
              onClick={() => setTool(t)}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'pen' && '✏️'}
              {t === 'marker' && '🖊'}
              {t === 'eraser' && '◻️'}
            </button>
          ))}
        </div>

        {/* brush sizes */}
        <div className="drawing-toolbar-group">
          {(['fine', 'medium', 'thick'] as BrushSize[]).map((s) => (
            <button
              key={s}
              className={`drawing-tool-btn${brushSize === s ? ' active' : ''}`}
              onClick={() => setBrushSize(s)}
              title={`${s} (${BRUSH_PX[s]}px)`}
            >
              <span
                className="brush-size-dot"
                style={{ width: BRUSH_PX[s] * 2 + 8, height: BRUSH_PX[s] * 2 + 8, background: color }}
              />
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="drawing-toolbar-group">
          <button
            className="drawing-tool-btn"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            className="drawing-tool-btn"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
          <button className="drawing-tool-btn" onClick={handleClear} title="Clear">
            <Trash2 size={18} />
          </button>
          <button className="drawing-tool-btn" onClick={handleSave} title="Save PNG">
            <Save size={18} />
          </button>
        </div>

        {/* colors */}
        <div className="drawing-toolbar-group">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`drawing-tool-btn color-swatch-btn${color === c ? ' active' : ''}`}
              onClick={() => setColor(c)}
              title={c}
              style={{ background: c, border: color === c ? '2px solid #a78bfa' : '2px solid #444' }}
            />
          ))}
          <label className="drawing-tool-btn color-picker-label" title="Custom color">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            />
            🎨
          </label>
        </div>
      </div>

      {isDrawing && (
        <div className="drawing-status">
          {tool} · {brushSize} · {color}
        </div>
      )}
    </div>
  );
}
