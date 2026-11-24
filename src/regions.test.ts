/**
 * Region and detector invariants, on a procedurally laid out face — no photo, no model download.
 *
 * The canonical index rings are copied here on purpose: a wrong index in `regions.ts` then reads a
 * point the fixture never placed (the face centre), and the ring assertions break.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Point } from './types';

const INDEX = {
  oval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  eyeLeft: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  eyeRight: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  browLeft: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  browRight: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  lipOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
  lipInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191],
};

/** A face in the middle of a square frame: crown 0.27, chin 0.77, eyes on 0.44, mouth on 0.63. */
function face(count: number): Point[] {
  const out: Point[] = Array.from({ length: count }, () => ({ x: 0.5, y: 0.55 }));
  const put = (index: number, x: number, y: number) => {
    out[index] = { x, y };
  };
  const ring = (indexes: number[], cx: number, cy: number, rx: number, ry: number, start = Math.PI) =>
    indexes.forEach((index, k) => {
      const a = start + (2 * Math.PI * k) / indexes.length;
      put(index, cx + rx * Math.cos(a), cy + ry * Math.sin(a));
    });

  // the oval starts at the crown, so its angle runs from the top: 18 lands on the chin
  INDEX.oval.forEach((index, k) => {
    const a = (2 * Math.PI * k) / INDEX.oval.length;
    put(index, 0.5 + 0.17 * Math.sin(a), 0.52 - 0.25 * Math.cos(a));
  });
  // each eye ring starts on its outer corner: the left one on the left, the right one on the right
  ring(INDEX.eyeLeft, 0.43, 0.44, 0.045, 0.02, Math.PI);
  ring(INDEX.eyeRight, 0.57, 0.44, 0.045, 0.02, 0);
  INDEX.browLeft.forEach((index, k) => put(index, 0.365 + 0.11 * (k / 9), 0.395 - 0.005 * (k / 9)));
  INDEX.browRight.forEach((index, k) => put(index, 0.635 - 0.11 * (k / 9), 0.395 - 0.005 * (k / 9)));
  ring(INDEX.lipOuter, 0.5, 0.63, 0.055, 0.03);
  ring(INDEX.lipInner, 0.5, 0.63, 0.04, 0.018);

  put(1, 0.5, 0.575); // nose tip
  put(2, 0.5, 0.562); // nose base
  put(129, 0.472, 0.568); // nose wings
  put(358, 0.528, 0.568);
  put(168, 0.5, 0.465); // bridge top
  put(46, 0.465, 0.39); // inner brow ends
  put(276, 0.535, 0.39);
  put(50, 0.4, 0.51); // cheek apples
  put(280, 0.6, 0.51);
  put(468, 0.43, 0.44); // iris centres
  put(473, 0.57, 0.44);
  put(152, 0.5, 0.77); // chin
  return out;
}

const inside = (poly: readonly Point[], p: Point): boolean => {
  const onEdge = poly.some((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    return (
      Math.abs(cross) < 1e-9 &&
      p.x >= Math.min(a.x, b.x) &&
      p.x <= Math.max(a.x, b.x) &&
      p.y >= Math.min(a.y, b.y) &&
      p.y <= Math.max(a.y, b.y)
    );
  });
  if (onEdge) return true;
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

const mean = (list: readonly Point[], key: 'x' | 'y') =>
  list.reduce((sum, p) => sum + p[key], 0) / list.length;

const { buildRegions } = await import('./regions');

describe('buildRegions', () => {
  const r = buildRegions(face(478));

  it('keeps every region point inside the source frame', () => {
    const all = Object.values(r).flatMap((value) => (Array.isArray(value) ? value : [value]));
    expect(all).toHaveLength(36 + 19 + 19 + 16 + 16 + 10 + 10 + 20 + 20 + 11 + 20);
    expect(all.every((p) => [p.x, p.y].every((v) => Number.isFinite(v) && v >= 0 && v <= 1))).toBe(true);
  });

  it('closes the oval from the crown to the chin', () => {
    expect(r.oval).toHaveLength(36);
    expect(r.chin.y).toBeCloseTo(Math.max(...r.oval.map((p) => p.y)), 6);
    expect(r.foreheadTop.y).toBeLessThan(0.27);
    expect(r.foreheadTop.y).toBeLessThan(r.chin.y);
  });

  it('splits the oval into a left and a right jaw ending on the chin', () => {
    expect(r.jawLeft).toHaveLength(19);
    expect(r.jawRight).toHaveLength(19);
    expect(mean(r.jawLeft, 'x')).toBeLessThan(0.5);
    expect(mean(r.jawRight, 'x')).toBeGreaterThan(0.5);
    expect(r.jawLeft[r.jawLeft.length - 1]).toEqual(r.chin);
    expect(r.jawRight[r.jawRight.length - 1]).toEqual(r.chin);
  });

  it('reads each eye on its own side with the outer corner away from the nose', () => {
    expect(r.eyeLeft.every((p) => p.x < 0.5)).toBe(true);
    expect(r.eyeRight.every((p) => p.x > 0.5)).toBe(true);
    expect(r.eyeLeftOuter.x).toBeLessThan(r.eyeLeftInner.x);
    expect(r.eyeRightOuter.x).toBeGreaterThan(r.eyeRightInner.x);
    expect(r.eyeLeftCenter.x).toBeLessThan(r.eyeRightCenter.x);
    expect(r.underEyeLeft.y).toBeGreaterThan(Math.max(...r.eyeLeft.map((p) => p.y)));
    expect(mean(r.browLeft, 'y')).toBeLessThan(mean(r.eyeLeft, 'y'));
  });

  it('keeps the teeth ring inside the inner lip, above the mouth line', () => {
    expect(r.teeth).toHaveLength(11);
    expect(r.teeth.every((p) => inside(r.lipInner, p))).toBe(true);
    expect(mean(r.teeth, 'y')).toBeLessThan(mean(r.lipInner, 'y'));
  });

  it('falls back to the lid centroid when the mesh has no iris', () => {
    const flat = buildRegions(face(468));
    expect(flat.eyeLeftCenter.y).toBeCloseTo(0.44, 6);
    expect(flat.eyeRightCenter.x).toBeCloseTo(0.57, 6);
  });

  it('refuses a landmark list shorter than the mesh', () => {
    expect(() => buildRegions(face(478).slice(0, 400))).toThrow(/468/);
  });
});

const mp = vi.hoisted(() => ({
  faces: [] as Point[][],
  failCreate: null as null | 'gpu' | 'always',
  loseGpuOnDetect: false,
  creates: [] as string[],
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: async () => ({}) },
  FaceLandmarker: {
    createFromOptions: async (_fileset: unknown, options: { baseOptions: { delegate: string } }) => {
      mp.creates.push(options.baseOptions.delegate);
      if (mp.failCreate === 'always' || (mp.failCreate === 'gpu' && options.baseOptions.delegate === 'GPU')) {
        throw new Error('no runtime');
      }
      return {
        detect: () => {
          if (mp.loseGpuOnDetect) {
            mp.loseGpuOnDetect = false;
            throw new Error('webgl context lost');
          }
          return { faceLandmarks: mp.faces };
        },
        close: () => {},
      };
    },
  },
}));

const { detectLandmarks, resetLandmarker } = await import('./landmarks');

const SOURCE = { width: 1120, height: 1400 } as unknown as HTMLCanvasElement;

describe('detectLandmarks', () => {
  beforeEach(() => {
    mp.faces = [];
    mp.failCreate = null;
    mp.loseGpuOnDetect = false;
    mp.creates = [];
    resetLandmarker();
  });

  it('rejects an empty source as load, without touching the model', async () => {
    await expect(detectLandmarks({ width: 0, height: 0 } as unknown as HTMLCanvasElement)).rejects.toMatchObject({ code: 'load' });
    expect(mp.creates).toEqual([]);
  });

  it('rejects with none when the model finds no face', async () => {
    await expect(detectLandmarks(SOURCE)).rejects.toMatchObject({ code: 'none' });
  });

  it('rejects with none when the mesh comes back short', async () => {
    mp.faces = [face(478).slice(0, 100)];
    await expect(detectLandmarks(SOURCE)).rejects.toMatchObject({ code: 'none' });
  });

  it('returns the 478 points in source space', async () => {
    mp.faces = [face(478)];
    const points = await detectLandmarks(SOURCE);
    expect(points).toHaveLength(478);
    expect(points[10]).toEqual({ x: 0.5, y: 0.27 });
  });

  it('loads once and reuses the detector until reset', async () => {
    mp.faces = [face(478)];
    await detectLandmarks(SOURCE);
    await detectLandmarks(SOURCE);
    expect(mp.creates).toEqual(['GPU']);
    resetLandmarker();
    await detectLandmarks(SOURCE);
    expect(mp.creates).toEqual(['GPU', 'GPU']);
  });

  it('falls back to CPU when the GPU delegate will not create', async () => {
    mp.faces = [face(478)];
    mp.failCreate = 'gpu';
    await expect(detectLandmarks(SOURCE)).resolves.toHaveLength(478);
    expect(mp.creates).toEqual(['GPU', 'CPU']);
  });

  it('retries on CPU when the GPU detector dies mid-detect', async () => {
    mp.faces = [face(478)];
    mp.loseGpuOnDetect = true;
    await expect(detectLandmarks(SOURCE)).resolves.toHaveLength(478);
    expect(mp.creates).toEqual(['GPU', 'CPU']);
  });

  it('rejects with load when no delegate can be created', async () => {
    mp.failCreate = 'always';
    await expect(detectLandmarks(SOURCE)).rejects.toMatchObject({ code: 'load' });
    expect(mp.creates).toEqual(['GPU', 'CPU']);
  });
});
