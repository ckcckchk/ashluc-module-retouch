/**
 * Geometric warp — the 形體 / 眼睛 / 鼻子 / 嘴巴 sliders, as one inverse-mapped field.
 *
 * Each slider expands into a few local ops placed from the landmark regions: a smooth kernel
 * centred on a feature that shifts a patch, scales it about a pivot, or shears it. The sum of the
 * ops is sampled on a coarse grid and bilinearly interpolated on the way out, so a full-face warp
 * costs a few thousand kernel evaluations instead of one per pixel and leaves no mesh seams.
 *
 * Sign convention (0 neutral): the positive side is the beautified one — slim / vshape / cheek /
 * nosewidth / nosetip narrow, forehead / facelength grow, eyesize / eyespace / lipfull / mouthwidth
 * grow, eyetilt lifts the outer corner, eyeopen raises the lid, noselength shortens, smile lifts
 * the corners. `copy.ts` labels the sliders, so keep the sign in step with it.
 *
 * All lengths are fractions of the face, never of the frame, so a 900 px preview and a 2048 px
 * apply move the same proportion of the face.
 */
import type { FaceRegions, Point, RetouchParams } from './types';

/**
 * One local deformation.
 *  shift — `ax`/`ay` are the peak displacement
 *  scale — `ax`/`ay` are the fractional scale about (x, y): displacement is k·(p − centre)
 *  shear — `ax` is the slope: dy = ax·(p.x − centre.x)
 */
export interface WarpOp {
  kind: 'shift' | 'scale' | 'shear';
  x: number;
  y: number;
  rx: number;
  ry: number;
  ax: number;
  ay: number;
}

/** Displacements on a regular grid of normalised frame coordinates. */
export interface WarpField {
  cols: number;
  rows: number;
  dx: Float32Array;
  dy: Float32Array;
}

/** Slider → -1..1. Tolerates a stale record instead of painting NaN. */
const S = (v: number) => Math.max(-1, Math.min(1, (Number.isFinite(v) ? v : 0) / 100));

const SIDES = [-1, 1] as const;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

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

/** The displacement of every op summed at one point. */
export function warpAt(ops: readonly WarpOp[], x: number, y: number): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  for (const op of ops) {
    const qx = (x - op.x) / op.rx;
    const qy = (y - op.y) / op.ry;
    const q = qx * qx + qy * qy;
    if (q >= 1) continue;
    const w = (1 - q) * (1 - q); // C1 at the centre and at the rim: no seam where the kernel ends
    if (op.kind === 'shift') {
      dx += op.ax * w;
      dy += op.ay * w;
    } else if (op.kind === 'scale') {
      dx += op.ax * (x - op.x) * w;
      dy += op.ay * (y - op.y) * w;
    } else {
      dy += op.ax * (x - op.x) * w;
    }
  }
  return { dx, dy };
}

/** The ops a params set implies. Empty means nothing to warp, which is also the early-out. */
export function buildWarpOps(r: FaceRegions, p: RetouchParams): WarpOp[] {
  const oval = span(r.oval);
  const W = Math.max(1e-3, oval.maxX - oval.minX);
  const H = Math.max(1e-3, oval.maxY - oval.minY);
  const cx = (oval.minX + oval.maxX) / 2;
  const jawY = (r.cheekLeft.y + r.cheekRight.y + 2 * r.chin.y) / 4;
  const noseW = Math.max(1e-3, dist(r.noseWingLeft, r.noseWingRight));
  const lip = span(r.lipOuter);
  const lipW = Math.max(1e-3, lip.maxX - lip.minX);
  const lipH = Math.max(1e-3, lip.maxY - lip.minY);
  const lipX = (lip.minX + lip.maxX) / 2;
  const lipY = (lip.minY + lip.maxY) / 2;
  const ops: WarpOp[] = [];

  // 形體 — a patch on each side of the jaw pushed along x. The mirrors cancel on the midline, so
  // the nose and mouth stay put while the outline narrows.
  const slim = S(p.slim);
  const vshape = S(p.vshape);
  for (const side of SIDES) {
    if (slim) {
      const edge = side < 0 ? oval.minX : oval.maxX;
      ops.push({ kind: 'shift', x: edge, y: jawY, rx: W * 0.7, ry: H * 0.22, ax: -side * W * 0.055 * slim, ay: 0 });
    }
    if (vshape) {
      const x = cx + side * W * 0.28;
      const y = r.chin.y - H * 0.08;
      ops.push({ kind: 'shift', x, y, rx: W * 0.5, ry: H * 0.18, ax: -side * W * 0.05 * vshape, ay: 0 });
    }
  }

  const cheek = S(p.cheek);
  if (cheek) {
    ops.push({ kind: 'shift', x: r.cheekLeft.x, y: r.cheekLeft.y, rx: W * 0.32, ry: H * 0.18, ax: W * 0.035 * cheek, ay: 0 });
    ops.push({ kind: 'shift', x: r.cheekRight.x, y: r.cheekRight.y, rx: W * 0.32, ry: H * 0.18, ax: -W * 0.035 * cheek, ay: 0 });
  }

  const forehead = S(p.forehead);
  if (forehead) {
    const x = r.foreheadTop.x;
    const y = r.foreheadTop.y;
    ops.push({ kind: 'shift', x, y, rx: W * 0.5, ry: H * 0.2, ax: 0, ay: -H * 0.05 * forehead });
  }

  const facelength = S(p.facelength);
  if (facelength) {
    ops.push({ kind: 'shift', x: cx, y: oval.minY, rx: W * 0.6, ry: H * 0.22, ax: 0, ay: -H * 0.045 * facelength });
    ops.push({ kind: 'shift', x: r.chin.x, y: r.chin.y, rx: W * 0.45, ry: H * 0.16, ax: 0, ay: H * 0.05 * facelength });
  }

  // 眼睛 — the window is wider than the eye so the lid and the socket stretch with it; scaling
  // exactly on the eye corner would do nothing there, the kernel is zero at its rim.
  const eyesize = S(p.eyesize);
  const eyespace = S(p.eyespace);
  const eyetilt = S(p.eyetilt);
  const eyeopen = S(p.eyeopen);
  const eyes = [
    { c: r.eyeLeftCenter, i: r.eyeLeftInner, o: r.eyeLeftOuter },
    { c: r.eyeRightCenter, i: r.eyeRightInner, o: r.eyeRightOuter },
  ];
  for (const e of eyes) {
    const len = Math.max(1e-3, dist(e.i, e.o));
    const outerDir = Math.sign(e.o.x - e.c.x) || 1;
    const sideDir = Math.sign(e.c.x - cx) || 1;
    if (eyesize) {
      ops.push({ kind: 'scale', x: e.c.x, y: e.c.y, rx: len * 1.4, ry: len * 0.8, ax: 0.3 * eyesize, ay: 0.3 * eyesize });
    }
    if (eyespace) {
      ops.push({ kind: 'shift', x: e.c.x, y: e.c.y, rx: len * 2, ry: len * 1.2, ax: sideDir * W * 0.025 * eyespace, ay: 0 });
    }
    if (eyetilt) {
      ops.push({ kind: 'shear', x: e.c.x, y: e.c.y, rx: len * 1.6, ry: len, ax: -0.7 * eyetilt * outerDir, ay: 0 });
    }
    if (eyeopen) {
      // pivot below the eye: the whole lid rises instead of the lower lid dropping
      ops.push({ kind: 'scale', x: e.c.x, y: e.c.y + len * 0.45, rx: len * 1.4, ry: len * 0.9, ax: 0.06 * eyeopen, ay: 0.3 * eyeopen });
    }
  }

  // 鼻子
  const nosewidth = S(p.nosewidth);
  if (nosewidth) {
    const half = noseW / 2;
    ops.push({ kind: 'shift', x: r.noseWingLeft.x, y: r.noseWingLeft.y, rx: half * 1.15, ry: half * 0.95, ax: half * 0.3 * nosewidth, ay: 0 });
    ops.push({ kind: 'shift', x: r.noseWingRight.x, y: r.noseWingRight.y, rx: half * 1.15, ry: half * 0.95, ax: -half * 0.3 * nosewidth, ay: 0 });
  }
  const noselength = S(p.noselength);
  if (noselength) {
    const x = r.noseTip.x;
    const y = (r.noseTip.y + r.noseBridgeBottom.y) / 2;
    ops.push({ kind: 'shift', x, y, rx: noseW * 0.85, ry: H * 0.1, ax: 0, ay: -H * 0.025 * noselength });
  }
  const nosetip = S(p.nosetip);
  if (nosetip) {
    ops.push({ kind: 'scale', x: r.noseTip.x, y: r.noseTip.y, rx: noseW * 0.62, ry: noseW * 0.62, ax: -0.22 * nosetip, ay: -0.18 * nosetip });
  }

  // 嘴巴
  const mouthwidth = S(p.mouthwidth);
  if (mouthwidth) {
    ops.push({ kind: 'shift', x: r.mouthLeft.x, y: r.mouthLeft.y, rx: lipW * 0.32, ry: lipH * 1.1, ax: -lipW * 0.15 * mouthwidth, ay: 0 });
    ops.push({ kind: 'shift', x: r.mouthRight.x, y: r.mouthRight.y, rx: lipW * 0.32, ry: lipH * 1.1, ax: lipW * 0.15 * mouthwidth, ay: 0 });
  }
  const lipfull = S(p.lipfull);
  if (lipfull) {
    ops.push({ kind: 'scale', x: lipX, y: lipY, rx: lipW * 0.72, ry: lipH * 1.2, ax: 0.08 * lipfull, ay: 0.32 * lipfull });
  }
  const smile = S(p.smile);
  if (smile) {
    ops.push({ kind: 'shift', x: r.mouthLeft.x, y: r.mouthLeft.y, rx: lipW * 0.3, ry: lipH * 1.1, ax: -lipW * 0.04 * smile, ay: -lipH * 0.35 * smile });
    ops.push({ kind: 'shift', x: r.mouthRight.x, y: r.mouthRight.y, rx: lipW * 0.3, ry: lipH * 1.1, ax: lipW * 0.04 * smile, ay: -lipH * 0.35 * smile });
  }

  return ops;
}

export function buildWarpField(ops: readonly WarpOp[], cols: number, rows: number): WarpField {
  const c = Math.max(2, cols);
  const rw = Math.max(2, rows);
  const dx = new Float32Array(c * rw);
  const dy = new Float32Array(c * rw);
  for (let j = 0; j < rw; j++) {
    const y = j / (rw - 1);
    for (let i = 0; i < c; i++) {
      const d = warpAt(ops, i / (c - 1), y);
      dx[j * c + i] = d.dx;
      dy[j * c + i] = d.dy;
    }
  }
  return { cols: c, rows: rw, dx, dy };
}

/** Bilinear read of the field at normalised (u, v). Pass `into` in a loop to skip the allocation. */
export function sampleField(f: WarpField, u: number, v: number, into = { dx: 0, dy: 0 }) {
  const gx = Math.min(f.cols - 1, Math.max(0, u * (f.cols - 1)));
  const gy = Math.min(f.rows - 1, Math.max(0, v * (f.rows - 1)));
  const x0 = Math.min(f.cols - 2, Math.floor(gx));
  const y0 = Math.min(f.rows - 2, Math.floor(gy));
  const fx = gx - x0;
  const fy = gy - y0;
  const i00 = y0 * f.cols + x0;
  const i10 = i00 + 1;
  const i01 = i00 + f.cols;
  const i11 = i01 + 1;
  const topX = f.dx[i00] + (f.dx[i10] - f.dx[i00]) * fx;
  const botX = f.dx[i01] + (f.dx[i11] - f.dx[i01]) * fx;
  const topY = f.dy[i00] + (f.dy[i10] - f.dy[i00]) * fx;
  const botY = f.dy[i01] + (f.dy[i11] - f.dy[i01]) * fx;
  into.dx = topX + (botX - topX) * fy;
  into.dy = topY + (botY - topY) * fy;
  return into;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Sample `src` backwards through the warp: destination pixel (u, v) reads source (u − dx, v − dy),
 * bilinearly. Offsets past the frame clamp to the edge pixel, which is what the canvas does.
 */
export function applyGeometry(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData {
  const ops = buildWarpOps(regions, params);
  if (ops.length === 0) return src;
  const { width: w, height: h, data } = src;
  if (w < 2 || h < 2) return src;

  const out = new ImageData(new Uint8ClampedArray(data.length), w, h);
  const o = out.data;
  const cell = Math.max(4, Math.round(Math.min(w, h) / 160));
  const field = buildWarpField(ops, Math.ceil(w / cell) + 1, Math.ceil(h / cell) + 1);
  const d = { dx: 0, dy: 0 };

  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      sampleField(field, (x + 0.5) / w, v, d);
      if (d.dx === 0 && d.dy === 0) {
        o[p] = data[p];
        o[p + 1] = data[p + 1];
        o[p + 2] = data[p + 2];
        o[p + 3] = data[p + 3];
        continue;
      }
      const sx = ((x + 0.5) / w - d.dx) * w - 0.5;
      const sy = (v - d.dy) * h - 0.5;
      const x0 = clamp(Math.floor(sx), 0, w - 1);
      const y0 = clamp(Math.floor(sy), 0, h - 1);
      const x1 = Math.min(w - 1, x0 + 1);
      const y1 = Math.min(h - 1, y0 + 1);
      const fx = clamp(sx - x0, 0, 1);
      const fy = clamp(sy - y0, 0, 1);
      const i00 = (y0 * w + x0) * 4;
      const i10 = (y0 * w + x1) * 4;
      const i01 = (y1 * w + x0) * 4;
      const i11 = (y1 * w + x1) * 4;
      for (let c = 0; c < 4; c++) {
        const top = data[i00 + c] + (data[i10 + c] - data[i00 + c]) * fx;
        const bot = data[i01 + c] + (data[i11 + c] - data[i01 + c]) * fx;
        o[p + c] = top + (bot - top) * fy;
      }
    }
  }
  return out;
}
