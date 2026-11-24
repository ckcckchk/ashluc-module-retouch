import { describe, expect, it } from 'vitest';
import type { FaceRegions, Point, RetouchParams } from './types';
import { NEUTRAL_PARAMS } from './types';
import { applyGeometry, buildWarpField, buildWarpOps, sampleField, warpAt } from './warp';
import { applySkin, blurRadius, edgeKeep, skinMaskAt, whitenLut } from './skin';

// vitest runs in node: no canvas, no ImageData. This stand-in is enough for the geometry pass, which
// only needs the constructor; the skin blur guards on `document` and degrades on its own.
if (typeof globalThis.ImageData === 'undefined') {
  class FakeImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }
  globalThis.ImageData = FakeImageData as unknown as typeof ImageData;
}

const ring = (cx: number, cy: number, rx: number, ry: number, n: number): Point[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });

/** A symmetric front-on face, `s` times the default size about the frame centre. */
function face(s = 1): FaceRegions {
  const at = (x: number, y: number): Point => ({ x: 0.5 + (x - 0.5) * s, y: 0.5 + (y - 0.5) * s });
  const r = (cx: number, cy: number, rx: number, ry: number, n = 16) =>
    ring(cx, cy, rx, ry, n).map((q) => at(q.x, q.y));
  const oval = r(0.5, 0.47, 0.11, 0.15, 24);
  return {
    oval,
    jawLeft: oval.filter((q) => q.x <= 0.5),
    jawRight: oval.filter((q) => q.x >= 0.5),
    chin: at(0.5, 0.62),
    foreheadTop: at(0.5, 0.32),
    foreheadCenter: at(0.5, 0.37),
    cheekLeft: at(0.4, 0.48),
    cheekRight: at(0.6, 0.48),
    eyeLeft: r(0.4395, 0.44, 0.0275, 0.008, 12),
    eyeRight: r(0.5605, 0.44, 0.0275, 0.008, 12),
    eyeLeftCenter: at(0.4395, 0.44),
    eyeRightCenter: at(0.5605, 0.44),
    eyeLeftInner: at(0.467, 0.44),
    eyeLeftOuter: at(0.412, 0.44),
    eyeRightInner: at(0.533, 0.44),
    eyeRightOuter: at(0.588, 0.44),
    browLeft: r(0.4395, 0.405, 0.032, 0.007, 10),
    browRight: r(0.5605, 0.405, 0.032, 0.007, 10),
    underEyeLeft: at(0.4395, 0.462),
    underEyeRight: at(0.5605, 0.462),
    noseTip: at(0.5, 0.51),
    noseWingLeft: at(0.472, 0.518),
    noseWingRight: at(0.528, 0.518),
    noseBridgeTop: at(0.5, 0.445),
    noseBridgeBottom: at(0.5, 0.498),
    lipOuter: r(0.5, 0.555, 0.045, 0.018, 16),
    lipInner: r(0.5, 0.555, 0.034, 0.009, 12),
    mouthLeft: at(0.455, 0.555),
    mouthRight: at(0.545, 0.555),
    teeth: r(0.5, 0.5525, 0.026, 0.005, 8),
  };
}

const p = (over: Partial<RetouchParams> = {}): RetouchParams => ({ ...NEUTRAL_PARAMS, ...over });

const GEOMETRY = [
  'slim',
  'vshape',
  'forehead',
  'cheek',
  'facelength',
  'eyesize',
  'eyespace',
  'eyetilt',
  'eyeopen',
  'nosewidth',
  'noselength',
  'nosetip',
  'mouthwidth',
  'lipfull',
  'smile',
] as const;

/** Displacement of one slider at one normalised point of the default face. */
const at = (over: Partial<RetouchParams>, x: number, y: number) =>
  warpAt(buildWarpOps(face(), p(over)), x, y);

describe('geometry ops', () => {
  it('a neutral params set builds nothing and returns the source untouched', () => {
    const src = new ImageData(new Uint8ClampedArray(16 * 16 * 4), 16, 16);
    expect(buildWarpOps(face(), NEUTRAL_PARAMS)).toHaveLength(0);
    expect(applyGeometry(src, face(), NEUTRAL_PARAMS)).toBe(src);
  });

  it('drives every geometry slider, and none of them reaches the frame corner', () => {
    for (const id of GEOMETRY) {
      for (const value of [60, -60]) {
        const ops = buildWarpOps(face(), { ...NEUTRAL_PARAMS, [id]: value } as RetouchParams);
        expect(ops.length, id).toBeGreaterThan(0);
        const corner = warpAt(ops, 0.02, 0.02);
        expect(Math.abs(corner.dx) + Math.abs(corner.dy), `${id}@${value}`).toBe(0);
      }
    }
  });

  it('slim pulls both jaw sides inward and leaves the midline exactly put', () => {
    const left = at({ slim: 100 }, 0.42, 0.52);
    const right = at({ slim: 100 }, 0.58, 0.52);
    expect(left.dx).toBeGreaterThan(0);
    expect(right.dx).toBeLessThan(0);
    expect(left.dx).toBeCloseTo(-right.dx, 10);
    expect(Math.abs(at({ slim: 100 }, 0.5, 0.52).dx)).toBeLessThan(1e-9);
    // and it reverses
    expect(at({ slim: -100 }, 0.42, 0.52).dx).toBeLessThan(0);
  });

  it('scales with the slider, never past the face', () => {
    const peak = (v: number) => Math.abs(at({ slim: v }, 0.42, 0.52).dx);
    expect(peak(100)).toBeGreaterThan(peak(50));
    expect(peak(50)).toBeGreaterThan(0);
    expect(peak(0)).toBe(0);
    expect(peak(100)).toBeLessThan(0.22 * 0.08); // < 8% of the face width
  });

  it('opens the eye upward about a pivot under the lid', () => {
    expect(at({ eyeopen: 100 }, 0.4395, 0.434).dy).toBeLessThan(0);
    // the pivot is at the lower lid: nothing moves there, and less rises below the upper lid
    expect(Math.abs(at({ eyeopen: 100 }, 0.4395, 0.44 + 0.055 * 0.45).dy)).toBeLessThan(1e-9);
    expect(at({ eyeopen: 100 }, 0.4395, 0.455).dy).toBeGreaterThan(at({ eyeopen: 100 }, 0.4395, 0.434).dy);
  });

  it('tilts the outer corner up, mirrored on the other eye', () => {
    const l = at({ eyetilt: 100 }, 0.412, 0.44);
    const r = at({ eyetilt: 100 }, 0.588, 0.44);
    expect(l.dy).toBeLessThan(0);
    expect(r.dy).toBeLessThan(0);
    expect(l.dy).toBeCloseTo(r.dy, 10);
    expect(at({ eyetilt: 100 }, 0.4395, 0.44).dy).toBeCloseTo(0, 10);
  });

  it('enlarges the eye outward from its centre', () => {
    expect(at({ eyesize: 100 }, 0.40, 0.44).dx).toBeLessThan(0);
    expect(at({ eyesize: 100 }, 0.48, 0.44).dx).toBeGreaterThan(0);
    expect(at({ eyesize: -100 }, 0.40, 0.44).dx).toBeGreaterThan(0);
  });

  it('spaces the eyes apart, symmetric about the midline', () => {
    expect(at({ eyespace: 100 }, 0.4395, 0.44).dx).toBeLessThan(0);
    expect(at({ eyespace: 100 }, 0.5605, 0.44).dx).toBeGreaterThan(0);
  });

  it('narrows the nose wings inward', () => {
    expect(at({ nosewidth: 100 }, 0.472, 0.518).dx).toBeGreaterThan(0);
    expect(at({ nosewidth: 100 }, 0.528, 0.518).dx).toBeLessThan(0);
  });

  it('shortens the nose from the tip and shrinks the tip', () => {
    expect(at({ noselength: 100 }, 0.5, 0.505).dy).toBeLessThan(0);
    expect(at({ nosetip: 100 }, 0.51, 0.51).dx).toBeLessThan(0);
  });

  it('widens the mouth, lifts the corners for a smile, and puffs the lips', () => {
    expect(at({ mouthwidth: 100 }, 0.455, 0.555).dx).toBeLessThan(0);
    expect(at({ smile: 100 }, 0.455, 0.555).dy).toBeLessThan(0);
    expect(at({ smile: 100 }, 0.545, 0.555).dy).toBeLessThan(0);
    expect(at({ lipfull: 100 }, 0.5, 0.545).dy).toBeLessThan(0);
    expect(at({ lipfull: 100 }, 0.5, 0.565).dy).toBeGreaterThan(0);
  });

  it('lifts the hairline for a bigger forehead and the chin for a longer face', () => {
    expect(at({ forehead: 100 }, 0.5, 0.32).dy).toBeLessThan(0);
    expect(at({ facelength: 100 }, 0.5, 0.62).dy).toBeGreaterThan(0);
    expect(at({ facelength: -100 }, 0.5, 0.62).dy).toBeLessThan(0);
  });
});

describe('warp field', () => {
  it('bilinear sampling is exact on the nodes and linear between them', () => {
    const ops = buildWarpOps(face(), p({ slim: 80, eyetilt: 40 }));
    const field = buildWarpField(ops, 9, 9);
    const node = (cx: number, cy: number) => warpAt(ops, cx / 8, cy / 8);
    const n = node(3, 5);
    const s = sampleField(field, 3 / 8, 5 / 8);
    expect(s.dx).toBeCloseTo(n.dx, 10);
    expect(s.dy).toBeCloseTo(n.dy, 10);
    const mid = sampleField(field, 3.5 / 8, 5 / 8);
    expect(mid.dx).toBeCloseTo((n.dx + node(4, 5).dx) / 2, 10);
  });

  it('clamps reads outside 0..1 to the edge of the field', () => {
    const field = buildWarpField(buildWarpOps(face(), p({ slim: 80 })), 5, 5);
    expect(sampleField(field, -1, -1).dx).toBe(0);
    expect(sampleField(field, 2, 2).dx).toBe(0);
  });
});

describe('geometry render', () => {
  /** 256 px white frame with a hard dark bar on the left jaw. */
  function barFrame(): ImageData {
    const size = 256;
    const img = new ImageData(new Uint8ClampedArray(size * size * 4), size, size);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    img.data.fill(255, 0, img.data.length);
    for (let y = 130; y < 185; y++) {
      for (let x = 103; x < 108; x++) {
        const i = (y * size + x) * 4;
        img.data[i] = 0;
        img.data[i + 1] = 0;
        img.data[i + 2] = 0;
      }
    }
    return img;
  }

  const darkestColumn = (img: ImageData, y: number) => {
    let best = -1;
    let bestLum = 255;
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const lum = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
      if (lum < bestLum) {
        bestLum = lum;
        best = x;
      }
    }
    return best;
  };

  it('a flat frame stays flat at the extremes of every slider at once', () => {
    // a constant image is invariant to any warp that samples inside the frame, so any black or
    // opaque pixel here means the field blew up (NaN, a kernel seam) instead of moving content
    const size = 96;
    const src = new ImageData(new Uint8ClampedArray(size * size * 4), size, size);
    for (let i = 0; i < src.data.length; i += 4) {
      src.data[i] = 240;
      src.data[i + 1] = 235;
      src.data[i + 2] = 230;
      src.data[i + 3] = 255;
    }
    for (const value of [100, -100]) {
      const extreme = Object.fromEntries(GEOMETRY.map((id) => [id, value])) as Partial<RetouchParams>;
      const out = applyGeometry(src, face(2.2), p(extreme));
      expect(out.data[0]).toBe(240);
      expect(out.data[1]).toBe(235);
      expect(out.data[2]).toBe(230);
      expect(out.data[3]).toBe(255);
      expect(out.data[out.data.length - 1]).toBe(255);
      expect(Math.min(...out.data.slice(0, 400))).toBeGreaterThan(200);
    }
  });

  it('moves the jaw content inward, and leaves a neutral frame byte-identical', () => {
    const src = barFrame();
    const whole = face(2.2);
    const unchanged = applyGeometry(src, whole, NEUTRAL_PARAMS);
    expect(unchanged).toBe(src);

    const warped = applyGeometry(src, whole, p({ slim: 100 }));
    expect(warped.width).toBe(src.width);
    expect(warped.data.length).toBe(src.data.length);
    const before = darkestColumn(src, 156);
    const after = darkestColumn(warped, 156);
    expect(after - before).toBeGreaterThanOrEqual(2);
    // the far side of the frame is outside every kernel and must not have moved
    expect(warped.data[(10 * 256 + 200) * 4]).toBe(255);
  });
});

describe('skin mask', () => {
  it('covers the cheek and nothing off the face', () => {
    const r = face();
    expect(skinMaskAt(r, 0.44, 0.5)).toBeCloseTo(1, 6);
    expect(skinMaskAt(r, 0.5, 0.38)).toBeCloseTo(1, 6); // forehead
    expect(skinMaskAt(r, 0.05, 0.05)).toBe(0);
    expect(skinMaskAt(r, 0.5, 0.9)).toBe(0); // chin and below
  });

  it('cuts out the eyes, brows and lips', () => {
    const r = face();
    expect(skinMaskAt(r, 0.4395, 0.44)).toBe(0);
    expect(skinMaskAt(r, 0.5605, 0.44)).toBe(0);
    expect(skinMaskAt(r, 0.4395, 0.405)).toBe(0);
    expect(skinMaskAt(r, 0.5, 0.555)).toBe(0);
    expect(skinMaskAt(r, 0.5, 0.62)).toBeLessThan(0.5); // feathered jaw edge
  });

  it('fades at the face rim, never a hard cutout', () => {
    const r = face();
    const mid = skinMaskAt(r, 0.41, 0.47);
    const edge = skinMaskAt(r, 0.395, 0.47);
    expect(edge).toBeLessThan(mid);
    expect(edge).toBeGreaterThanOrEqual(0);
  });
});

describe('skin tone maths', () => {
  it('whitenLut is the identity at zero and a lift above it', () => {
    const none = whitenLut(0);
    for (let v = 0; v < 256; v++) expect(none[v]).toBe(v);
    const lift = whitenLut(1);
    expect(lift[0]).toBe(0);
    expect(lift[255]).toBe(255);
    expect(lift[128]).toBeGreaterThan(128);
    for (let v = 1; v < 256; v++) expect(lift[v]).toBeGreaterThanOrEqual(lift[v - 1]);
  });

  it('blur radius tracks the frame size and the amount', () => {
    expect(blurRadius(900, 900, 0)).toBe(1);
    expect(blurRadius(900, 900, 1)).toBeGreaterThan(blurRadius(900, 900, 0.4));
    expect(blurRadius(2048, 2048, 1)).toBeGreaterThan(blurRadius(900, 900, 1));
  });

  it('edgeKeep keeps flat skin and rejects a hard edge', () => {
    expect(edgeKeep(0)).toBe(1);
    expect(edgeKeep(20)).toBeGreaterThan(0);
    expect(edgeKeep(200)).toBe(0);
  });
});

describe('skin render', () => {
  it('returns the source untouched when every skin slider is zero', () => {
    const src = new ImageData(new Uint8ClampedArray(8 * 8 * 4), 8, 8);
    expect(applySkin(src, face(), NEUTRAL_PARAMS)).toBe(src);
  });

  it('whitens inside the mask only, and keeps alpha', () => {
    const size = 32;
    const src = new ImageData(new Uint8ClampedArray(size * size * 4), size, size);
    for (let i = 0; i < src.data.length; i += 4) {
      src.data[i] = 200;
      src.data[i + 1] = 170;
      src.data[i + 2] = 160;
      src.data[i + 3] = 255;
    }
    const out = applySkin(src, face(), p({ whiten: 100 }));
    const cheek = (16 * size + 14) * 4;
    const corner = 0;
    expect(out.data[cheek]).toBeGreaterThan(200 + 5);
    expect(out.data[corner]).toBe(200);
    expect(out.data[corner + 1]).toBe(170);
    expect(out.data[corner + 3]).toBe(255);
    expect(out.data[cheek + 3]).toBe(255);
  });
});
