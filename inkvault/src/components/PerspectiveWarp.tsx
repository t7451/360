import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WarpPoint { x: number; y: number; }

export interface WarpQuad {
  tl: WarpPoint;
  tr: WarpPoint;
  br: WarpPoint;
  bl: WarpPoint;
}

export interface PerspectiveWarpProps {
  bodyPhoto: string;
  tattooSrc: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

// ─── Utilities (exported for reuse in TattooOverlay) ──────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Horizontal-slice warp: maps an image onto an arbitrary quad using Canvas 2D.
 * More slices = smoother curve at the cost of performance.
 */
export function drawWarpedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  quad: WarpQuad,
  slices = 64,
) {
  const { tl, tr, br, bl } = quad;
  const imgW = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
  const imgH = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;
  if (imgW === 0 || imgH === 0) return;

  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;

    // Interpolate left and right edges at t0 / t1
    const x0l = lerp(tl.x, bl.x, t0), y0l = lerp(tl.y, bl.y, t0);
    const x1l = lerp(tl.x, bl.x, t1), y1l = lerp(tl.y, bl.y, t1);
    const x0r = lerp(tr.x, br.x, t0), y0r = lerp(tr.y, br.y, t0);
    const x1r = lerp(tr.x, br.x, t1), y1r = lerp(tr.y, br.y, t1);

    // Source slice in image space
    const srcY = t0 * imgH;
    const srcH = imgH / slices;

    ctx.save();

    // Clip to this strip's parallelogram
    ctx.beginPath();
    ctx.moveTo(x0l, y0l);
    ctx.lineTo(x0r, y0r);
    ctx.lineTo(x1r, y1r);
    ctx.lineTo(x1l, y1l);
    ctx.closePath();
    ctx.clip();

    // Destination strip geometry
    const dstW = Math.max(
      Math.hypot(x0r - x0l, y0r - y0l),
      Math.hypot(x1r - x1l, y1r - y1l),
    );
    const scaleX = dstW / imgW;
    const scaleY = Math.hypot(x1l - x0l, y1l - y0l) / srcH;
    const angle = Math.atan2(y0r - y0l, x0r - x0l);

    ctx.translate(x0l, y0l);
    ctx.rotate(angle);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(img, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

    ctx.restore();
  }
}

/** Draw a perspective grid over the quad. */
export function drawWarpGrid(
  ctx: CanvasRenderingContext2D,
  quad: WarpQuad,
  rows = 5,
  cols = 5,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const lx = lerp(quad.tl.x, quad.bl.x, t), ly = lerp(quad.tl.y, quad.bl.y, t);
    const rx = lerp(quad.tr.x, quad.br.x, t), ry = lerp(quad.tr.y, quad.br.y, t);
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
  }

  for (let c = 0; c <= cols; c++) {
    const t = c / cols;
    const tx = lerp(quad.tl.x, quad.tr.x, t), ty = lerp(quad.tl.y, quad.tr.y, t);
    const bx = lerp(quad.bl.x, quad.br.x, t), by = lerp(quad.bl.y, quad.br.y, t);
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx, by); ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

/** Draw draggable corner handles for the warp quad. */
export function drawWarpHandles(
  ctx: CanvasRenderingContext2D,
  quad: WarpQuad,
  activeHandle: keyof WarpQuad | null,
) {
  const corners: Array<[keyof WarpQuad, WarpPoint]> = [
    ['tl', quad.tl],
    ['tr', quad.tr],
    ['br', quad.br],
    ['bl', quad.bl],
  ];

  for (const [key, pt] of corners) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = activeHandle === key ? '#c4b5fd' : '#a78bfa';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.toUpperCase(), pt.x, pt.y);
  }
}

/** Return which quad corner is nearest to (x, y) within the threshold, or null. */
export function nearestWarpHandle(
  x: number,
  y: number,
  quad: WarpQuad,
  threshold = 40,
): keyof WarpQuad | null {
  const corners: Array<[keyof WarpQuad, WarpPoint]> = [
    ['tl', quad.tl], ['tr', quad.tr], ['br', quad.br], ['bl', quad.bl],
  ];
  let best: keyof WarpQuad | null = null;
  let bestDist = threshold;
  for (const [key, pt] of corners) {
    const d = Math.hypot(x - pt.x, y - pt.y);
    if (d < bestDist) { bestDist = d; best = key; }
  }
  return best;
}

/** Build a default rectangular quad matching the tattoo's current transform. */
export function defaultQuadFromTransform(
  cx: number,
  cy: number,
  scale: number,
  rotation: number,
  imgW: number,
  imgH: number,
): WarpQuad {
  const hw = (imgW * scale) / 2;
  const hh = (imgH * scale) / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  function rot(px: number, py: number): WarpPoint {
    return { x: cx + px * cos - py * sin, y: cy + px * sin + py * cos };
  }

  return { tl: rot(-hw, -hh), tr: rot(hw, -hh), br: rot(hw, hh), bl: rot(-hw, hh) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coverFit(
  img: HTMLImageElement,
  cw: number,
  ch: number,
): [number, number, number, number] {
  const scale = Math.max(cw / img.width, ch / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return [(cw - w) / 2, (ch - h) / 2, w, h];
}

/** Translate all four corners of a quad by (dx, dy). */
function translateQuad(q: WarpQuad, dx: number, dy: number): WarpQuad {
  return {
    tl: { x: q.tl.x + dx, y: q.tl.y + dy },
    tr: { x: q.tr.x + dx, y: q.tr.y + dy },
    br: { x: q.br.x + dx, y: q.br.y + dy },
    bl: { x: q.bl.x + dx, y: q.bl.y + dy },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const INITIAL_SCALE = 0.4;
const INITIAL_OPACITY = 0.9;

export function PerspectiveWarp({ bodyPhoto, tattooSrc, onSave, onClose }: PerspectiveWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyImgRef = useRef<HTMLImageElement | null>(null);
  const tattooImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  const quadRef = useRef<WarpQuad | null>(null);
  const activeHandleRef = useRef<keyof WarpQuad | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownRef = useRef(false);
  const slicesRef = useRef(64);

  const [quad, setQuad] = useState<WarpQuad | null>(null);
  const [slices, setSlices] = useState(64);
  const [opacity, setOpacity] = useState(INITIAL_OPACITY);
  const [imagesReady, setImagesReady] = useState(false);

  // Keep refs in sync
  useEffect(() => { if (quad) quadRef.current = quad; }, [quad]);
  useEffect(() => { slicesRef.current = slices; }, [slices]);

  // ── Load images ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setImagesReady(false);
    setQuad(null);

    const body = new Image();
    body.crossOrigin = 'anonymous';
    const tattoo = new Image();
    tattoo.crossOrigin = 'anonymous';

    let bodyLoaded = false;
    let tattooLoaded = false;

    function checkReady() {
      if (!mounted || !bodyLoaded || !tattooLoaded) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const q = defaultQuadFromTransform(cx, cy, INITIAL_SCALE, 0, tattoo.width, tattoo.height);
      quadRef.current = q;
      bodyImgRef.current = body;
      tattooImgRef.current = tattoo;
      setQuad(q);
      setImagesReady(true);
    }

    body.onload = () => { bodyLoaded = true; checkReady(); };
    tattoo.onload = () => { tattooLoaded = true; checkReady(); };
    body.src = bodyPhoto;
    tattoo.src = tattooSrc;

    return () => { mounted = false; };
  }, [bodyPhoto, tattooSrc]);

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
      // Re-centre quad on resize
      if (tattooImgRef.current) {
        const q = defaultQuadFromTransform(
          rect.width / 2, rect.height / 2, INITIAL_SCALE, 0,
          tattooImgRef.current.width, tattooImgRef.current.height,
        );
        quadRef.current = q;
        setQuad(q);
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // ── Render loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imagesReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bodyImg = bodyImgRef.current!;
    const tattooImg = tattooImgRef.current!;

    function render() {
      const q = quadRef.current;
      const W = canvas!.width;
      const H = canvas!.height;

      ctx!.clearRect(0, 0, W, H);

      // Body photo
      ctx!.drawImage(bodyImg, ...coverFit(bodyImg, W, H));

      if (q) {
        // Warped tattoo
        ctx!.save();
        ctx!.globalAlpha = opacity;
        ctx!.globalCompositeOperation = 'multiply';
        drawWarpedImage(ctx!, tattooImg, q, slicesRef.current);
        ctx!.restore();

        ctx!.globalAlpha = 1;
        ctx!.globalCompositeOperation = 'source-over';

        // Grid overlay
        drawWarpGrid(ctx!, q);

        // Handle overlay
        drawWarpHandles(ctx!, q, activeHandleRef.current);
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [imagesReady, opacity]);

  // ── Pointer/touch interaction ─────────────────────────────────────────────────
  const clientToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  function applyWarpMove(x: number, y: number) {
    const last = lastPointerRef.current;
    if (!last) return;
    const dx = x - last.x;
    const dy = y - last.y;
    lastPointerRef.current = { x, y };

    const handle = activeHandleRef.current;
    setQuad((prev) => {
      if (!prev) return prev;
      let next: WarpQuad;
      if (handle) {
        next = { ...prev, [handle]: { x: prev[handle].x + dx, y: prev[handle].y + dy } };
      } else {
        next = translateQuad(prev, dx, dy);
      }
      quadRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length !== 1 || !quadRef.current) return;
      const { x, y } = clientToCanvas(e.touches[0].clientX, e.touches[0].clientY);
      activeHandleRef.current = nearestWarpHandle(x, y, quadRef.current);
      lastPointerRef.current = { x, y };
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length !== 1 || !lastPointerRef.current) return;
      const { x, y } = clientToCanvas(e.touches[0].clientX, e.touches[0].clientY);
      applyWarpMove(x, y);
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 0) {
        activeHandleRef.current = null;
        lastPointerRef.current = null;
      }
    }

    function onMouseDown(e: MouseEvent) {
      if (!quadRef.current) return;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      activeHandleRef.current = nearestWarpHandle(x, y, quadRef.current);
      lastPointerRef.current = { x, y };
      mouseDownRef.current = true;
    }

    function onMouseMove(e: MouseEvent) {
      if (!mouseDownRef.current || !lastPointerRef.current) return;
      const { x, y } = clientToCanvas(e.clientX, e.clientY);
      applyWarpMove(x, y);
    }

    function onMouseUp() {
      mouseDownRef.current = false;
      activeHandleRef.current = null;
      lastPointerRef.current = null;
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [clientToCanvas]);

  // ── Warp presets & controls ────────────────────────────────────────────────────
  function handleResetWarp() {
    const canvas = canvasRef.current;
    const tattoo = tattooImgRef.current;
    if (!canvas || !tattoo) return;
    const q = defaultQuadFromTransform(
      canvas.width / 2, canvas.height / 2, INITIAL_SCALE, 0, tattoo.width, tattoo.height,
    );
    quadRef.current = q;
    setQuad(q);
  }

  function handleCurveIn() {
    setQuad((prev) => {
      if (!prev) return prev;
      const bow = Math.abs(prev.tr.x - prev.tl.x) * 0.15;
      const next: WarpQuad = {
        tl: { x: prev.tl.x + bow, y: prev.tl.y },
        tr: { x: prev.tr.x - bow, y: prev.tr.y },
        br: { x: prev.br.x + bow, y: prev.br.y },
        bl: { x: prev.bl.x - bow, y: prev.bl.y },
      };
      quadRef.current = next;
      return next;
    });
  }

  function handleCurveOut() {
    setQuad((prev) => {
      if (!prev) return prev;
      const bow = Math.abs(prev.tr.x - prev.tl.x) * 0.15;
      const next: WarpQuad = {
        tl: { x: prev.tl.x - bow, y: prev.tl.y },
        tr: { x: prev.tr.x + bow, y: prev.tr.y },
        br: { x: prev.br.x - bow, y: prev.br.y },
        bl: { x: prev.bl.x + bow, y: prev.bl.y },
      };
      quadRef.current = next;
      return next;
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────────
  function handleSave() {
    const canvas = canvasRef.current;
    const bodyImg = bodyImgRef.current;
    const tattooImg = tattooImgRef.current;
    const q = quadRef.current;
    if (!canvas || !bodyImg || !tattooImg || !q) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(rafRef.current);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bodyImg, ...coverFit(bodyImg, canvas.width, canvas.height));
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'multiply';
    drawWarpedImage(ctx, tattooImg, q, slices);
    ctx.restore();

    onSave(canvas.toDataURL('image/jpeg', 0.92));
  }

  // ─── Render ────────────────────────────────────────────────────────────────────
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
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!imagesReady && (
          <div
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14,
            }}
          >
            Loading…
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
        />
      </div>

      {/* Controls */}
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
        <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>⬡ 3D Warp</span>

        {/* Opacity */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Opacity</span>
          <input
            type="range" min={0.1} max={1.0} step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ width: 80 }}
          />
          <span style={{ minWidth: 32, textAlign: 'right' }}>{Math.round(opacity * 100)}%</span>
        </label>

        {/* Slices */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Quality</span>
          <input
            type="range" min={32} max={128} step={8}
            value={slices}
            onChange={(e) => setSlices(parseInt(e.target.value))}
            style={{ width: 80 }}
          />
          <span style={{ minWidth: 24 }}>{slices}</span>
        </label>

        {/* Presets */}
        <button onClick={handleResetWarp} style={btnStyle('#444')}>Reset Warp</button>
        <button onClick={handleCurveIn} style={btnStyle('#5b21b6')}>Curve In</button>
        <button onClick={handleCurveOut} style={btnStyle('#7c3aed')}>Curve Out</button>

        {/* Save / Close */}
        <button onClick={handleSave} style={btnStyle('#1a7a4a')}>Save</button>
        <button onClick={onClose} style={{ ...btnStyle('#7a1a1a'), marginLeft: 'auto' }}>
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
