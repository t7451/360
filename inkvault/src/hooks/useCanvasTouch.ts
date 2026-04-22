import { RefObject, useEffect } from 'react';

function getDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function getAngle(t1: Touch, t2: Touch): number {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
}

export function useCanvasTouch(
  canvasRef: RefObject<HTMLCanvasElement>,
  onDrag: (dx: number, dy: number) => void,
  onPinch: (scaleDelta: number, angleDelta: number, cx: number, cy: number) => void
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Touch state ──────────────────────────────────────────────────────────
    let lastSingleTouch: { x: number; y: number } | null = null;
    let lastPinchDist = 0;
    let lastPinchAngle = 0;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastSingleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        lastSingleTouch = null;
        lastPinchDist = getDistance(e.touches[0], e.touches[1]);
        lastPinchAngle = getAngle(e.touches[0], e.touches[1]);
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 1 && lastSingleTouch) {
        const dx = e.touches[0].clientX - lastSingleTouch.x;
        const dy = e.touches[0].clientY - lastSingleTouch.y;
        lastSingleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        onDrag(dx, dy);
      } else if (e.touches.length === 2) {
        const dist = getDistance(e.touches[0], e.touches[1]);
        const angle = getAngle(e.touches[0], e.touches[1]);
        const scaleDelta = lastPinchDist > 0 ? dist / lastPinchDist : 1;
        const angleDelta = angle - lastPinchAngle;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        lastPinchDist = dist;
        lastPinchAngle = angle;
        onPinch(scaleDelta, angleDelta, cx, cy);
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        lastSingleTouch = null;
      } else if (e.touches.length === 1) {
        // One finger remains — resume drag from current position
        lastSingleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }

    // ── Mouse state ───────────────────────────────────────────────────────────
    let mouseDown = false;
    let lastMouse: { x: number; y: number } | null = null;

    function onMouseDown(e: MouseEvent) {
      mouseDown = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e: MouseEvent) {
      if (!mouseDown || !lastMouse) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      lastMouse = { x: e.clientX, y: e.clientY };
      onDrag(dx, dy);
    }

    function onMouseUp() {
      mouseDown = false;
      lastMouse = null;
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
  }, [canvasRef, onDrag, onPinch]);
}
