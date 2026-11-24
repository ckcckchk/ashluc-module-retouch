/**
 * Skin pass — 磨皮 / 美白 / 勻膚.
 *
 * All three work inside one mask: the face oval, feathered at the rim and cut out over the eyes,
 * brows and lips. Smooth and evenTone blend a canvas-blurred copy over the sharp one, gated by the
 * local luminance gradient so a hard edge keeps its pixels; whiten is a gamma lift through a 256
 * entry table, mixed in by the same mask so the background never lifts.
 *
 * The mask is built on a quarter-resolution grid and bilinearly read: it is smooth by construction,
 * so the coarse grid costs nothing visible and keeps a 2048 px apply cheap.
 */
import type { FaceRegions, Point, RetouchParams } from './types';

/** 1 inside `inner`, smoothstep to 0 at q = 1, nothing past the rim. */
export function ellipseWeight(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  inner = 0.7,
): number {
  const q = Math.hypot((x - cx) / Math.max(1e-6, rx), (y - cy) / Math.max(1e-6, ry));
  if (q >= 1) return 0;
  if (q <= inner) return 1;
  const t = (q - inner) / (1 - inner);
  return 1 - t * t * (3 - 2 * t);
}

function span(pts: readonly Point[]) {
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** How much of the pass lands on this point: 0..1. Pure, so the shape can be tested without canvas. */
export function skinMaskAt(r: FaceRegions, x: number, y: number): number {
  const b = span(r.oval);
  const rx = Math.max(1e-3, (b.maxX - b.minX) / 2);
  const ry = Math.max(1e-3, (b.maxY - b.minY) / 2);
  let m = ellipseWeight(x, y, (b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, rx, ry, 0.74);
  if (m <= 0) return 0;
  // holes: the eye and brow rings scaled out to cover lashes and brow hair, then the lips
  for (const ring of [r.eyeLeft, r.eyeRight, r.browLeft, r.browRight]) {
    const e = span(ring);
    const cx = (e.minX + e.maxX) / 2;
    const cy = (e.minY + e.maxY) / 2;
    m *= 1 - ellipseWeight(x, y, cx, cy, ((e.maxX - e.minX) / 2) * 1.1, ((e.maxY - e.minY) / 2) * 1.7, 0.5);
    if (m <= 0) return 0;
  }
  const lip = span(r.lipOuter);
  m *= 1 - ellipseWeight(x, y, (lip.minX + lip.maxX) / 2, (lip.minY + lip.maxY) / 2, ((lip.maxX - lip.minX) / 2) * 0.95, (lip.maxY - lip.minY) / 2, 0.5);
  return m > 0 ? m : 0;
}

interface Mask {
  cols: number;
  rows: number;
  data: Float32Array;
}

function buildMask(r: FaceRegions, w: number, h: number, step: number): Mask {
  const cols = Math.ceil(w / step) + 1;
  const rows = Math.ceil(h / step) + 1;
  const data = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const y = (j * step + 0.5) / h;
    for (let i = 0; i < cols; i++) data[j * cols + i] = skinMaskAt(r, (i * step + 0.5) / w, y);
  }
  return { cols, rows, data };
}

function sampleMask(m: Mask, gx: number, gy: number): number {
  const x = Math.min(m.cols - 1, Math.max(0, gx));
  const y = Math.min(m.rows - 1, Math.max(0, gy));
  const x0 = Math.min(m.cols - 2, Math.floor(x));
  const y0 = Math.min(m.rows - 2, Math.floor(y));
  const fx = x - x0;
  const fy = y - y0;
  const i00 = y0 * m.cols + x0;
  const top = m.data[i00] + (m.data[i00 + 1] - m.data[i00]) * fx;
  const bot = m.data[i00 + m.cols] + (m.data[i00 + m.cols + 1] - m.data[i00 + m.cols]) * fx;
  return top + (bot - top) * fy;
}

/** Brightness curve per amount. `whitenLut(0)` is the identity, so a neutral slider cannot shift a channel. */
export function whitenLut(amount: number): Uint8Array {
  const a = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0));
  const p = 1 - 0.42 * a;
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, p));
  return lut;
}

/**
 * Blur radius in px, tied to the frame so the preview and the applied edge look the same.
 * Kept near pore scale (1% of the short edge at max): a big radius erases structure, which is what
 * makes a 磨皮 look plastic, so the amount buys blend strength rather than a wider blur.
 */
export function blurRadius(w: number, h: number, amount: number): number {
  const a = Math.max(0, Math.min(1, Math.abs(amount)));
  return Math.max(1, Math.round(Math.min(w, h) * 0.01 * a));
}

/** 1 on flat skin, falling to 0 across a hard edge: lashes, brows and the nose line stay sharp. */
export function edgeKeep(gradient: number): number {
  return 1 - Math.min(1, Math.abs(gradient) / 48);
}

/** A blurred copy via the canvas filter — the one place this pass needs the DOM. */
function blurredCopy(src: ImageData, radius: number): ImageData | null {
  if (typeof document === 'undefined') return null;
  const { width: w, height: h } = src;
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const blur = document.createElement('canvas');
  blur.width = w;
  blur.height = h;
  const bctx = base.getContext('2d');
  const fctx = blur.getContext('2d');
  if (!bctx || !fctx) return null;
  bctx.putImageData(src, 0, 0);
  fctx.filter = `blur(${radius}px)`;
  // an engine without canvas filters leaves the value as 'none', and a sharp copy would be a no-op
  if (fctx.filter === 'none') return null;
  fctx.drawImage(base, 0, 0);
  return fctx.getImageData(0, 0, w, h);
}

/**
 * shortcut: the blur sees transparent black past the frame edge, so skin inside one blur radius of
 * the border darkens slightly. Pad the canvas and crop back if a host crops faces to the frame edge.
 */
export function applySkin(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData {
  const smooth = Math.max(0, Math.min(100, params.smooth)) / 100;
  const whiten = Math.max(0, Math.min(100, params.whiten)) / 100;
  const even = Math.max(0, Math.min(100, params.eventone)) / 100;
  if (smooth === 0 && whiten === 0 && even === 0) return src;
  const { width: w, height: h, data } = src;
  if (w < 2 || h < 2) return src;

  const out = new ImageData(new Uint8ClampedArray(data), w, h);
  const o = out.data;
  const step = Math.max(2, Math.round(Math.min(w, h) / 220));
  const mask = buildMask(regions, w, h, step);
  const blur = smooth > 0 || even > 0 ? blurredCopy(src, blurRadius(w, h, Math.max(smooth, even))) : null;
  const bd = blur?.data ?? null;
  const lut = whiten > 0 ? whitenLut(whiten) : null;
  const soft = smooth * 0.88; // never fully flatten: a little pore texture has to survive max
  const rowPx = w * 4;

  for (let y = 0; y < h; y++) {
    const gy = y / step;
    for (let x = 0; x < w; x++) {
      const m = sampleMask(mask, x / step, gy);
      if (m <= 0.002) continue;
      const p = (y * w + x) * 4;
      let r = data[p];
      let g = data[p + 1];
      let b = data[p + 2];
      if (bd) {
        if (soft > 0) {
          // neighbours clamped, so the last row and column never read past the buffer
          const xr = x < w - 1 ? p + 4 : p - 4;
          const xl = x > 0 ? p - 4 : p + 4;
          const yd = y < h - 1 ? p + rowPx : p - rowPx;
          const yu = y > 0 ? p - rowPx : p + rowPx;
          const lum = (i: number) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const keep = edgeKeep(lum(xr) - lum(xl)) * edgeKeep(lum(yd) - lum(yu));
          const k = m * soft * keep;
          r += (bd[p] - r) * k;
          g += (bd[p + 1] - g) * k;
          b += (bd[p + 2] - b) * k;
        }
        if (even > 0) {
          // blotchiness lives in red, so red is pulled hardest towards its blurred self
          const k = m * even * 0.85;
          r += (bd[p] - r) * k;
          g += (bd[p + 1] - g) * k * 0.45;
          b += (bd[p + 2] - b) * k * 0.35;
        }
      }
      if (lut) {
        const k = m * whiten;
        r += (lut[(r + 0.5) | 0] - r) * k;
        g += (lut[(g + 0.5) | 0] - g) * k;
        b += (lut[(b + 0.5) | 0] - b) * k;
      }
      o[p] = r;
      o[p + 1] = g;
      o[p + 2] = b;
    }
  }
  return out;
}
