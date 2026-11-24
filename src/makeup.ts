/**
 * Makeup pass — blush, lip colour + shade, brow, eye shadow and contour.
 *
 * Every effect is a soft radial or linear wash clipped to a landmark ring and composited in the
 * blend mode a retoucher paints with (`soft-light` for colour, `multiply` for pigment and shadow),
 * so the skin's own light survives instead of being replaced. Alphas are a fraction of a low ceiling
 * on purpose: the usual source is a flat-lit studio portrait and an over-painted wash reads as fake
 * at a glance. Nothing is drawn outside a ring from `FaceRegions`.
 *
 * The paint helpers here are shared with `local.ts`; the pure ones are exported for the node tests.
 */
import {
  anyActive,
  lipShadeHex,
  type FaceRegions,
  type Point,
  type RetouchParams,
  type SliderId,
} from './types';

const MAKEUP_IDS: readonly SliderId[] = ['blush', 'lipcolor', 'brow', 'eyeshadow', 'contour'];

/** Axis-aligned bounds of a ring, in whatever unit the ring came in. */
export interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** A round paint dab in pixels. */
export interface Dab {
  x: number;
  y: number;
  r: number;
}

export type Rgb = readonly [number, number, number];

/** `#rrggbb` → channels. Anything else is black; the shade table is the only source, so it cannot slip. */
export const hexToRgb = (hex: string): Rgb => {
  const digits = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(digits)) return [0, 0, 0];
  const value = Number.parseInt(digits, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
};

/** A colour plus its own alpha, for the gradient stops that do the feathering. */
export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
};

/** Slider → paint alpha. A colour wash has no negative, so the magnitude is the strength. */
export const alphaFor = (value: number, ceiling: number): number =>
  (Number.isFinite(value) ? Math.min(1, Math.abs(value) / 100) : 0) * ceiling;

export const boxOf = (points: readonly Point[]): Box => {
  if (points.length === 0) return { cx: 0.5, cy: 0.5, w: 0, h: 0 };
  let minX = points[0].x;
  let maxX = minX;
  let minY = points[0].y;
  let maxY = minY;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
};

export const mixPoint = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Normalised point → pixels of this frame. */
export const px = (point: Point, width: number, height: number): Point => ({
  x: point.x * width,
  y: point.y * height,
});

export const scaledRing = (points: readonly Point[], width: number, height: number): Point[] =>
  points.map((point) => px(point, width, height));

/** Append a closed subpath to the current path. False when the ring cannot hold an area. */
export const addRing = (ctx: CanvasRenderingContext2D, ring: readonly Point[]): boolean => {
  if (ring.length < 3) return false;
  ctx.moveTo(ring[0].x, ring[0].y);
  for (let i = 1; i < ring.length; i += 1) ctx.lineTo(ring[i].x, ring[i].y);
  ctx.closePath();
  return true;
};

export const traceRing = (ctx: CanvasRenderingContext2D, ring: readonly Point[]): boolean => {
  ctx.beginPath();
  return addRing(ctx, ring);
};

/** Clip to a normalised ring. Call inside `save()`/`restore()`. */
export const clipRing = (
  ctx: CanvasRenderingContext2D,
  ring: readonly Point[],
  width: number,
  height: number,
): boolean => {
  if (!traceRing(ctx, scaledRing(ring, width, height))) return false;
  ctx.clip();
  return true;
};

/** One feathered dab: opaque-ish core, gone at the rim, so no shape edge is ever visible. */
export const softWash = (
  ctx: CanvasRenderingContext2D,
  dab: Dab,
  colour: string,
  alpha: number,
  mode: GlobalCompositeOperation,
): void => {
  if (alpha <= 0 || dab.r <= 0) return;
  const gradient = ctx.createRadialGradient(dab.x, dab.y, 0, dab.x, dab.y, dab.r);
  gradient.addColorStop(0, rgba(colour, 0.9));
  gradient.addColorStop(0.5, rgba(colour, 0.45));
  gradient.addColorStop(1, rgba(colour, 0));
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(dab.x, dab.y, dab.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

/** The image in, a new image out, painted through an offscreen canvas. The page DOM is never touched. */
export const paintCanvas = (
  src: ImageData,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.putImageData(src, 0, 0);
  draw(ctx, src.width, src.height);
  return ctx.getImageData(0, 0, src.width, src.height);
};

/** Blush sits on the cheekbones, sized by the face's own width so it scales with the frame. */
export function blushDabs(regions: FaceRegions, width: number, height: number): Dab[] {
  const r = Math.max(3, boxOf(regions.oval).w * width * 0.26);
  return [regions.cheekLeft, regions.cheekRight].map((cheek) => ({ ...px(cheek, width, height), r }));
}

/** Contour is the hollow under the cheekbone: the cheek dab pulled a little toward the chin. */
export function contourDabs(regions: FaceRegions, width: number, height: number): Dab[] {
  const r = Math.max(3, boxOf(regions.oval).w * width * 0.2);
  return [regions.cheekLeft, regions.cheekRight].map((cheek) => ({
    ...px(mixPoint(cheek, regions.chin, 0.42), width, height),
    r,
  }));
}

/** The two bright spots either side of the iris — the sclera, not the eye colour. */
export function scleraDabs(
  centre: Point,
  inner: Point,
  outer: Point,
  width: number,
  height: number,
): Dab[] {
  const span = Math.hypot((inner.x - outer.x) * width, (inner.y - outer.y) * height);
  const r = Math.max(1, span * 0.16);
  return [inner, outer].map((edge) => ({ ...px(mixPoint(centre, edge, 0.4), width, height), r }));
}

function paintBlush(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  ctx.save();
  if (!clipRing(ctx, regions.oval, width, height)) {
    ctx.restore();
    return;
  }
  for (const dab of blushDabs(regions, width, height)) softWash(ctx, dab, '#e0787d', alpha, 'soft-light');
  ctx.restore();
}

/** Pigment at the lip border only: the inner ring is cut out with even-odd, so the shade never fills the mouth. */
function paintLip(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
  shade: string,
): void {
  const outer = scaledRing(regions.lipOuter, width, height);
  const inner = scaledRing(regions.lipInner, width, height);
  if (outer.length < 3) return;
  ctx.save();
  ctx.beginPath();
  addRing(ctx, outer);
  addRing(ctx, inner);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = rgba(shade, 1);
  ctx.fill('evenodd');
  ctx.restore();
}

function paintBrow(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#6a4a3a';
  for (const brow of [regions.browLeft, regions.browRight]) {
    if (traceRing(ctx, scaledRing(brow, width, height))) ctx.fill();
  }
  ctx.restore();
}

/** Shadow concentrated at the lid margin and fading before it reaches the eye — no iris tint. */
function paintShadow(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  const colour = '#8a5f58';
  for (const eye of [regions.eyeLeft, regions.eyeRight]) {
    const ring = scaledRing(eye, width, height);
    const box = boxOf(ring);
    if (box.h <= 0) continue;
    ctx.save();
    if (!traceRing(ctx, ring)) {
      ctx.restore();
      continue;
    }
    ctx.clip();
    const gradient = ctx.createLinearGradient(box.cx, box.cy - box.h / 2, box.cx, box.cy + box.h / 2);
    gradient.addColorStop(0, rgba(colour, 0.95));
    gradient.addColorStop(0.55, rgba(colour, 0.45));
    gradient.addColorStop(0.78, rgba(colour, 0));
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(box.cx - box.w / 2, box.cy - box.h / 2, box.w, box.h);
    ctx.restore();
  }
}

function paintContour(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  ctx.save();
  if (!clipRing(ctx, regions.oval, width, height)) {
    ctx.restore();
    return;
  }
  for (const dab of contourDabs(regions, width, height)) softWash(ctx, dab, '#7a5148', alpha, 'multiply');
  ctx.restore();
}

export function applyMakeup(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData {
  if (!anyActive(params, MAKEUP_IDS)) return src;

  const blush = alphaFor(params.blush, 0.26);
  const lip = alphaFor(params.lipcolor, 0.45);
  const brow = alphaFor(params.brow, 0.28);
  const shadow = alphaFor(params.eyeshadow, 0.34);
  const contour = alphaFor(params.contour, 0.22);
  const shade = lipShadeHex(params.lipShade);

  return paintCanvas(src, (ctx, width, height) => {
    if (contour > 0) paintContour(ctx, regions, width, height, contour);
    if (blush > 0) paintBlush(ctx, regions, width, height, blush);
    if (shadow > 0) paintShadow(ctx, regions, width, height, shadow);
    if (brow > 0) paintBrow(ctx, regions, width, height, brow);
    // lip last: the one edge that should stay crisp wins over anything underneath
    if (lip > 0) paintLip(ctx, regions, width, height, lip, shade);
  });
}
