/**
 * The heal brush's surface: a transparent canvas over the preview that records strokes.
 *
 * Strokes are handed over in source-frame coordinates, because the pipeline heals before it warps.
 * The preview can be turned or mirrored, so a point picked on screen is run back through the same
 * rotate/flip the pipeline will apply, in reverse.
 */
import { useEffect, useRef, type PointerEvent } from 'react';
import type { HealStroke, Point, RetouchParams } from '../types';

interface HealLayerProps {
  active: boolean;
  /** Brush radius as a fraction of the frame's short edge. */
  radius: number;
  rotate: RetouchParams['rotate'];
  flip: boolean;
  onStroke: (stroke: HealStroke) => void;
}

/** Screen-normalised point back to source-normalised, undoing flip then rotate. */
function toSource(point: Point, rotate: RetouchParams['rotate'], flip: boolean): Point {
  const u = flip ? 1 - point.x : point.x;
  const v = point.y;
  switch (rotate) {
    case 90:
      return { x: v, y: 1 - u };
    case 180:
      return { x: 1 - u, y: 1 - v };
    case 270:
      return { x: 1 - v, y: u };
    default:
      return { x: u, y: v };
  }
}

export function HealLayer({ active, radius, rotate, flip, onStroke }: HealLayerProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const cursor = useRef<Point | null>(null);
  const path = useRef<Point[]>([]);
  const drawing = useRef(false);

  const draw = () => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!active) return;

    const w = canvas.width;
    const h = canvas.height;
    const r = Math.max(3, radius * Math.min(w, h));
    const ink = getComputedStyle(canvas).getPropertyValue('--rt-accent').trim() || '#7F5410';

    if (path.current.length > 1) {
      ctx.beginPath();
      path.current.forEach((point, index) => {
        const x = point.x * w;
        const y = point.y * h;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = r * 2;
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = ink;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const hover = cursor.current;
    if (hover) {
      ctx.beginPath();
      ctx.arc(hover.x * w, hover.y * h, r, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, w / 400);
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!active) {
      path.current = [];
      cursor.current = null;
      drawing.current = false;
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [active, radius]);

  const pick = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  return (
    <canvas
      ref={ref}
      className="rt-heal-layer"
      data-on={active ? '' : undefined}
      aria-hidden="true"
      onPointerDown={(event) => {
        if (!active) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = pick(event);
        drawing.current = true;
        path.current = [point];
        cursor.current = point;
        draw();
      }}
      onPointerMove={(event) => {
        if (!active) return;
        const point = pick(event);
        cursor.current = point;
        if (drawing.current) {
          const last = path.current[path.current.length - 1];
          if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 0.004) path.current.push(point);
        }
        draw();
      }}
      onPointerUp={() => {
        if (!drawing.current) return;
        drawing.current = false;
        const screen = path.current;
        path.current = [];
        if (screen.length > 0) {
          onStroke({ points: screen.map((point) => toSource(point, rotate, flip)), radius });
        }
        draw();
      }}
      onPointerCancel={() => {
        drawing.current = false;
        path.current = [];
        draw();
      }}
      onPointerLeave={() => {
        cursor.current = null;
        draw();
      }}
    />
  );
}
