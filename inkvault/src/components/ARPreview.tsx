import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, Image, Download, Layers } from 'lucide-react';
import type { Design } from '../types';

// ─────────────────────────────────────────────
// AR PREVIEW — camera/body photo + tattoo overlay
// ─────────────────────────────────────────────

interface TattooTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TouchState {
  lastX: number;
  lastY: number;
  lastDist: number;
  lastAngle: number;
  touchCount: number;
}

interface ARPreviewProps {
  design: Design | null;
  designs: Design[];
  onClose: () => void;
  onBookDesign?: (design: Design) => void;
}

function getDistance(t1: React.Touch, t2: React.Touch): number {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(t1: React.Touch, t2: React.Touch): number {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
}

export default function ARPreview({ design: initialDesign, designs, onClose, onBookDesign }: ARPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [tattooImage, setTattooImage] = useState<HTMLImageElement | null>(null);
  const [activeDesign, setActiveDesign] = useState<Design | null>(initialDesign);
  const [transform, setTransform] = useState<TattooTransform>({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });
  const [opacity, setOpacity] = useState(0.85);
  const [stencilMode, setStencilMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [liveCamera, setLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const touchStateRef = useRef<TouchState>({ lastX: 0, lastY: 0, lastDist: 0, lastAngle: 0, touchCount: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // ── Load tattoo image when design changes ──
  useEffect(() => {
    if (!activeDesign) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setTattooImage(img);
    img.src = activeDesign.image;
  }, [activeDesign]);

  // ── Draw canvas ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw background (photo or video frame)
    const bg = liveCamera ? videoRef.current : bgImage;
    if (bg) {
      ctx.save();
      const srcW = liveCamera ? (videoRef.current?.videoWidth ?? W) : (bgImage?.naturalWidth ?? W);
      const srcH = liveCamera ? (videoRef.current?.videoHeight ?? H) : (bgImage?.naturalHeight ?? H);
      const scale = Math.max(W / srcW, H / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(bg as CanvasImageSource, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📸  Tap Camera to take a photo', W / 2, H / 2);
    }

    // Draw tattoo overlay
    if (tattooImage) {
      const t = transformRef.current;
      const cx = t.x * W;
      const cy = t.y * H;
      const baseSize = W * 0.3 * t.scale;
      const aspect = tattooImage.naturalHeight / tattooImage.naturalWidth;
      const tw = baseSize;
      const th = baseSize * aspect;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t.rotation);
      ctx.globalAlpha = opacity;
      if (stencilMode) {
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.drawImage(tattooImage, -tw / 2, -th / 2, tw, th);

      // Bounding box handle
      ctx.globalAlpha = 0.6;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-tw / 2 - 6, -th / 2 - 6, tw + 12, th + 12);
      ctx.setLineDash([]);

      // Corner dots
      const corners = [[-tw / 2 - 6, -th / 2 - 6], [tw / 2 + 6, -th / 2 - 6], [-tw / 2 - 6, th / 2 + 6], [tw / 2 + 6, th / 2 + 6]];
      corners.forEach(([cx2, cy2]) => {
        ctx.beginPath();
        ctx.arc(cx2, cy2, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();
    }
  }, [bgImage, tattooImage, opacity, stencilMode, liveCamera]);

  // ── Animation loop for live camera ──
  useEffect(() => {
    if (!liveCamera) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [liveCamera, draw]);

  // ── Redraw on static changes ──
  useEffect(() => {
    if (!liveCamera) draw();
  }, [bgImage, tattooImage, transform, opacity, stencilMode, liveCamera, draw]);

  // ── Canvas resize ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  // ── Cleanup camera stream on unmount ──
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── Handlers ──

  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveCamera(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLiveCamera(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
      fileInputRef.current?.click();
    }
  }, []);

  const captureFromCamera = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    // Capture current frame as static bg
    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = offscreen.toDataURL('image/jpeg', 0.9);
    }
    stopCamera();
  }, [stopCamera]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    const link = document.createElement('a');
    link.download = `inkvault-ar-${activeDesign?.id ?? 'preview'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  }, [draw, activeDesign]);

  // ── Touch handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ts = touchStateRef.current;
    ts.touchCount = e.touches.length;
    if (e.touches.length === 1) {
      ts.lastX = e.touches[0].clientX;
      ts.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      ts.lastDist = getDistance(e.touches[0], e.touches[1]);
      ts.lastAngle = getAngle(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ts = touchStateRef.current;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    if (e.touches.length === 1 && ts.touchCount === 1) {
      const dx = (e.touches[0].clientX - ts.lastX) / W;
      const dy = (e.touches[0].clientY - ts.lastY) / H;
      ts.lastX = e.touches[0].clientX;
      ts.lastY = e.touches[0].clientY;
      setTransform(prev => ({
        ...prev,
        x: Math.max(0, Math.min(1, prev.x + dx)),
        y: Math.max(0, Math.min(1, prev.y + dy)),
      }));
    } else if (e.touches.length === 2) {
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const newAngle = getAngle(e.touches[0], e.touches[1]);
      const scaleDelta = newDist / ts.lastDist;
      const angleDelta = newAngle - ts.lastAngle;
      ts.lastDist = newDist;
      ts.lastAngle = newAngle;
      setTransform(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(10, prev.scale * scaleDelta)),
        rotation: prev.rotation + angleDelta,
      }));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    touchStateRef.current.touchCount = e.touches.length;
  }, []);

  // ── Design picker ──
  const selectDesign = useCallback((d: Design) => {
    setActiveDesign(d);
    setShowPicker(false);
    setTransform({ x: 0.5, y: 0.5, scale: 1, rotation: 0 });
  }, []);

  return (
    <div className="ar-overlay">
      {/* Hidden video for live camera */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        style={{ display: 'none' }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="ar-canvas"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Header */}
      <div className="ar-header">
        <span className="ar-title">AR PREVIEW{activeDesign ? ` — ${activeDesign.title}` : ''}</span>
        <button className="ar-close-btn" onClick={onClose}><X size={20} /></button>
      </div>

      {/* Toolbar */}
      <div className="ar-toolbar">
        {liveCamera ? (
          <button className="ar-btn" onClick={captureFromCamera} title="Capture frame">
            <Camera size={20} />
            <span>Capture</span>
          </button>
        ) : (
          <button className="ar-btn" onClick={startCamera} title="Open camera">
            <Camera size={20} />
            <span>{cameraError ? 'Upload' : 'Camera'}</span>
          </button>
        )}

        <button className="ar-btn" onClick={() => fileInputRef.current?.click()} title="Upload photo">
          <Image size={20} />
          <span>Photo</span>
        </button>

        <button className="ar-btn" onClick={() => setShowPicker(true)} title="Choose design">
          <Layers size={20} />
          <span>Design</span>
        </button>

        <button className="ar-btn" onClick={handleSave} title="Save image">
          <Download size={20} />
          <span>Save</span>
        </button>

        {onBookDesign && activeDesign && (
          <button className="ar-btn" onClick={() => onBookDesign(activeDesign)} title="Book this design">
            <span style={{ fontSize: 20 }}>📅</span>
            <span>Book</span>
          </button>
        )}

        <div className="ar-controls">
          <div className="ar-control-row">
            <label>Opacity</label>
            <input
              type="range" min="0.3" max="1" step="0.05"
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              className="ar-slider"
            />
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <button
            className={`ar-mode-btn ${stencilMode ? 'active' : ''}`}
            onClick={() => setStencilMode(m => !m)}
          >
            {stencilMode ? '◈ STENCIL' : '◉ COLOR'}
          </button>
        </div>
      </div>

      {/* Design Picker Modal */}
      {showPicker && (
        <div className="ar-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="ar-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-picker-header">
              <h3>CHOOSE DESIGN</h3>
              <button onClick={() => setShowPicker(false)}><X size={18} /></button>
            </div>
            <div className="ar-picker-grid">
              {designs.map(d => (
                <button
                  key={d.id}
                  className={`ar-picker-item ${activeDesign?.id === d.id ? 'active' : ''}`}
                  onClick={() => selectDesign(d)}
                >
                  <img src={d.image} alt={d.title} />
                  <span>{d.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
