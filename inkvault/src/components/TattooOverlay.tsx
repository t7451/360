import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasTouch } from '../hooks/useCanvasTouch';

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

  // Keep ref in sync with state for use inside rAF / event handlers
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

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

      // 2. Tattoo (or stencil) with transform
      const drawSrc: CanvasImageSource = stencilCanvasRef.current && stencil
        ? stencilCanvasRef.current
        : tattooImg;

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

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [imagesReady, isSelected, stencil]);

  // ── Interaction callbacks ─────────────────────────────────────────────────────
  const handleDrag = useCallback((dx: number, dy: number) => {
    setTransform((prev) => {
      const next = { ...prev, x: prev.x + dx, y: prev.y + dy };
      transformRef.current = next;
      return next;
    });
    setIsSelected(true);
  }, []);

  const handlePinch = useCallback(
    (scaleDelta: number, angleDelta: number, _cx: number, _cy: number) => {
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
    // Render final frame without handles
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
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation);
    ctx.scale(t.scale, t.scale);
    ctx.drawImage(drawSrc, -tattooImg.width / 2, -tattooImg.height / 2);
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
        {/* Opacity */}
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
