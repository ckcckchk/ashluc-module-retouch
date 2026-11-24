/**
 * Local pass — eye brighten, under-eye bags, teeth whitening — and the heal brush.
 *
 * The three sliders reuse the makeup paint rules: a feathered wash clipped to a landmark ring, in a
 * blend mode that leaves the skin's own light alone. The heal brush works per pixel instead, because
 * it must replace a blemish with the colour of the skin *around* it, not with a flat wash.
 */
import {
  anyActive,
  type FaceRegions,
  type HealStroke,
  type Point,
  type RetouchParams,
  type SliderId,
} from './types';
import {
  alphaFor,
  boxOf,
  clipRing,
  mixPoint,
  paintCanvas,
  px,
  scaledRing,
  scleraDabs,
  softWash,
  traceRing,
  type Rgb,
} from './makeup';

const LOCAL_IDS: readonly SliderId[] = ['eyebright', 'eyebag', 'teeth'];

/** Screen on the sclera only: the dab centres sit off the iris, so the eye colour stays put. */
function paintEyeBright(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  const eyes = [
    [regions.eyeLeft, regions.eyeLeftCenter, regions.eyeLeftInner, regions.eyeLeftOuter],
    [regions.eyeRight, regions.eyeRightCenter, regions.eyeRightInner, regions.eyeRightOuter],
  ] as const;
  for (const [ring, centre, inner, outer] of eyes) {
    ctx.save();
    if (clipRing(ctx, ring, width, height)) {
      for (const dab of scleraDabs(centre, inner, outer, width, height)) {
        softWash(ctx, dab, '#ffffff', alpha, 'screen');
      }
    }
    ctx.restore();
  }
}

/** A warm lift under the eye: enough to read as less shadow, not enough to flatten the socket. */
function paintEyeBag(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  const r = Math.max(3, boxOf(regions.oval).w * width * 0.16);
  ctx.save();
  if (!clipRing(ctx, regions.oval, width, height)) {
    ctx.restore();
    return;
  }
  for (const under of [regions.underEyeLeft, regions.underEyeRight]) {
    softWash(ctx, { ...px(under, width, height), r }, '#ffd9c8', alpha, 'soft-light');
  }
  ctx.restore();
}

/** Screen with a cool white: lifts the enamel and cancels the yellow in one composite. */
function paintTeeth(
  ctx: CanvasRenderingContext2D,
  regions: FaceRegions,
  width: number,
  height: number,
  alpha: number,
): void {
  ctx.save();
  if (traceRing(ctx, scaledRing(regions.teeth, width, height))) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#eef4ff';
    ctx.fill();
  }
  ctx.restore();
}

export function applyLocal(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData {
  if (!anyActive(params, LOCAL_IDS)) return src;

  const bright = alphaFor(params.eyebright, 0.34);
  const bag = alphaFor(params.eyebag, 0.5);
  const teeth = alphaFor(params.teeth, 0.42);

  return paintCanvas(src, (ctx, width, height) => {
    if (bright > 0) paintEyeBright(ctx, regions, width, height, bright);
    if (bag > 0) paintEyeBag(ctx, regions, width, height, bag);
    if (teeth > 0) paintTeeth(ctx, regions, width, height, teeth);
  });
}

/** 1 at the centre, 0 at the rim, smoothstep between — a dab cannot leave a visible ring. */
export const feather = (distance: number, radius: number): number => {
  if (radius <= 0) return 0;
  const t = Math.min(1, Math.max(0, distance / radius));
  return 1 - t * t * (3 - 2 * t);
};

/** Dabs every `step` along a polyline, so a fast stroke still covers every pixel it crossed. */
export function dabPath(points: readonly Point[], step: number): Point[] {
  if (points.length === 0) return [];
  const gap = Math.max(0.5, step);
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    if (span === 0) continue;
    const count = Math.floor(span / gap);
    for (let k = 1; k <= count; k += 1) out.push(mixPoint(a, b, (k * gap) / span));
    if (count * gap < span - 0.5) out.push(b);
  }
  return out;
}

/**
 * Mean colour of the annulus just outside a dab — what the heal brush puts back in place of a
 * blemish. Sampling the ring, not the dab, is the whole trick: the spot itself is left out.
 */
export function ringMean(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  samples = 24,
): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(angle) * radius * 1.3);
    const y = Math.round(cy + Math.sin(angle) * radius * 1.3);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const offset = (y * width + x) * 4;
    r += data[offset];
    g += data[offset + 1];
    b += data[offset + 2];
    count += 1;
  }
  if (count > 0) return [r / count, g / count, b / count];
  // fully outside the frame: nothing sane to sample, keep the pixel as it is
  const x = Math.min(width - 1, Math.max(0, Math.round(cx)));
  const y = Math.min(height - 1, Math.max(0, Math.round(cy)));
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

/**
 * Blend one feathered dab toward the ring mean. `source` stays the untouched frame so overlapping
 * dabs never smear each other; `out` accumulates.
 *
 * shortcut: a spot is replaced by the ring's average colour, so its own grain goes too — for a
 * blemish of a brush radius or less that is invisible, but do not use it to thin out a large area.
 */
function healDab(
  out: Uint8ClampedArray,
  source: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
): void {
  const [r, g, b] = ringMean(source, width, height, x, y, radius);
  const x0 = Math.max(0, Math.floor(x - radius));
  const x1 = Math.min(width - 1, Math.ceil(x + radius));
  const y0 = Math.max(0, Math.floor(y - radius));
  const y1 = Math.min(height - 1, Math.ceil(y + radius));
  for (let py = y0; py <= y1; py += 1) {
    for (let pxx = x0; pxx <= x1; pxx += 1) {
      const distance = Math.hypot(pxx - x, py - y);
      if (distance >= radius) continue;
      const t = feather(distance, radius) * 0.92;
      const offset = (py * width + pxx) * 4;
      out[offset] += (r - out[offset]) * t;
      out[offset + 1] += (g - out[offset + 1]) * t;
      out[offset + 2] += (b - out[offset + 2]) * t;
    }
  }
}

export function applyHeal(src: ImageData, strokes: readonly HealStroke[]): ImageData {
  if (strokes.length === 0) return src;

  const { width, height } = src;
  const out = new Uint8ClampedArray(src.data);
  const shortEdge = Math.min(width, height);
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    const radius = Math.min(0.12, Math.max(0.01, stroke.radius)) * shortEdge;
    const path = dabPath(scaledRing(stroke.points, width, height), radius * 0.5);
    for (const dab of path) healDab(out, src.data, width, height, dab.x, dab.y, radius);
  }
  return new ImageData(out, width, height);
}
