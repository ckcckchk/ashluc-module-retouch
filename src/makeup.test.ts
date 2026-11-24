/**
 * The makeup/local passes paint through a canvas, which node does not have, so the tests cover the
 * pure half — hex parsing, alpha ceilings, region → paint-point maths, the heal ring mean and the
 * heal brush itself (which needs no canvas, only an `ImageData` stand-in).
 */
import { describe, expect, it } from 'vitest';
import { NEUTRAL_PARAMS, type FaceRegions, type HealStroke, type Point } from './types';
import {
  alphaFor,
  blushDabs,
  boxOf,
  contourDabs,
  hexToRgb,
  mixPoint,
  px,
  rgba,
  scaledRing,
  scleraDabs,
} from './makeup';
import { applyHeal, applyLocal, dabPath, feather, ringMean } from './local';
import { applyMakeup } from './makeup';

// node has no ImageData; the heal brush only needs the shape, so a stub is enough to run it here
const globals = globalThis as unknown as {
  ImageData?: new (data: Uint8ClampedArray, width: number, height: number) => ImageData;
};
globals.ImageData ??= class {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
} as unknown as new (data: Uint8ClampedArray, width: number, height: number) => ImageData;

const fake = (parts: Partial<FaceRegions>): FaceRegions => parts as FaceRegions;

const square: Point[] = [
  { x: 0.2, y: 0.3 },
  { x: 0.6, y: 0.3 },
  { x: 0.6, y: 0.7 },
  { x: 0.2, y: 0.7 },
];

const frame = (width: number, height: number, rgb: readonly [number, number, number]): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
    data[i + 3] = 255;
  }
  return new globals.ImageData!(data, width, height);
};

const pixel = (image: ImageData, x: number, y: number) => {
  const o = (y * image.width + x) * 4;
  return [image.data[o], image.data[o + 1], image.data[o + 2]];
};

describe('hexToRgb / rgba', () => {
  it('parses the shade table hexes, with or without the hash', () => {
    expect(hexToRgb('#c0555f')).toEqual([192, 85, 95]);
    expect(hexToRgb('#D0714A')).toEqual([208, 113, 74]);
    expect(hexToRgb('8e3a58')).toEqual([142, 58, 88]);
  });

  it('falls back to black on anything that is not rrggbb', () => {
    expect(hexToRgb('red')).toEqual([0, 0, 0]);
    expect(hexToRgb('#fff')).toEqual([0, 0, 0]);
  });

  it('writes a css colour with the alpha clamped', () => {
    expect(rgba('#c0555f', 0.5)).toBe('rgba(192, 85, 95, 0.5)');
    expect(rgba('#c0555f', 3)).toBe('rgba(192, 85, 95, 1)');
    expect(rgba('#c0555f', -1)).toBe('rgba(192, 85, 95, 0)');
  });
});

describe('alphaFor', () => {
  it('is the slider magnitude under a ceiling', () => {
    expect(alphaFor(0, 0.4)).toBe(0);
    expect(alphaFor(50, 0.4)).toBeCloseTo(0.2);
    expect(alphaFor(-50, 0.4)).toBeCloseTo(0.2);
    expect(alphaFor(100, 0.4)).toBeCloseTo(0.4);
  });

  it('clamps past the ends and ignores a broken value', () => {
    expect(alphaFor(250, 0.4)).toBeCloseTo(0.4);
    expect(alphaFor(Number.NaN, 0.4)).toBe(0);
  });
});

describe('geometry', () => {
  it('boxes a ring in its own units', () => {
    const box = boxOf(square);
    expect(box.cx).toBeCloseTo(0.4);
    expect(box.cy).toBeCloseTo(0.5);
    expect(box.w).toBeCloseTo(0.4);
    expect(box.h).toBeCloseTo(0.4);
    expect(boxOf([])).toEqual({ cx: 0.5, cy: 0.5, w: 0, h: 0 });
  });

  it('scales normalised points to frame pixels', () => {
    expect(px({ x: 0.25, y: 0.5 }, 1000, 500)).toEqual({ x: 250, y: 250 });
    const ring = scaledRing(square, 1000, 500);
    expect(ring).toHaveLength(4);
    expect(ring[2]).toEqual({ x: 600, y: 350 });
  });

  it('mixes two points', () => {
    expect(mixPoint({ x: 0, y: 10 }, { x: 10, y: 0 }, 0.42)).toEqual({ x: 4.2, y: 5.8 });
  });
});

describe('dab placement', () => {
  const regions = fake({
    oval: square,
    chin: { x: 0.5, y: 0.85 },
    cheekLeft: { x: 0.3, y: 0.55 },
    cheekRight: { x: 0.7, y: 0.55 },
  });

  it('puts blush on both cheekbones, sized by the face width', () => {
    const dabs = blushDabs(regions, 1000, 1000);
    expect(dabs).toHaveLength(2);
    expect(dabs[0].x).toBeCloseTo(300);
    expect(dabs[0].y).toBeCloseTo(550);
    expect(dabs[0].r).toBeCloseTo(0.4 * 1000 * 0.26);
  });

  it('pulls contour toward the chin and keeps it inside the cheek', () => {
    const [left] = contourDabs(regions, 1000, 1000);
    expect(left.x).toBeCloseTo(384);
    expect(left.y).toBeCloseTo(676);
    expect(left.y).toBeLessThan(regions.chin.y * 1000);
  });

  it('puts the eye brighten on the sclera, either side of the iris', () => {
    const [first, second] = scleraDabs(
      { x: 0.4, y: 0.5 },
      { x: 0.3, y: 0.5 },
      { x: 0.55, y: 0.5 },
      1000,
      1000,
    );
    expect(first.x).toBeCloseTo(360);
    expect(second.x).toBeCloseTo(460);
    expect(first.r).toBeCloseTo(0.25 * 1000 * 0.16);
    expect(first.r).toBe(second.r);
  });
});

describe('feather', () => {
  it('is full in the middle and gone at the rim', () => {
    expect(feather(0, 10)).toBe(1);
    expect(feather(5, 10)).toBeCloseTo(0.5);
    expect(feather(10, 10)).toBe(0);
    expect(feather(20, 10)).toBe(0);
  });

  it('never rises and never divides by zero', () => {
    expect(feather(2, 10)).toBeGreaterThan(feather(6, 10));
    expect(feather(1, 0)).toBe(0);
  });
});

describe('dabPath', () => {
  it('steps a stroke at the brush spacing', () => {
    const path = dabPath([{ x: 0, y: 0 }, { x: 30, y: 0 }], 10);
    expect(path.map((p) => p.x)).toEqual([0, 10, 20, 30]);
  });

  it('keeps a tap as one dab and covers a ragged end', () => {
    expect(dabPath([{ x: 4, y: 4 }], 10)).toEqual([{ x: 4, y: 4 }]);
    expect(dabPath([{ x: 0, y: 0 }, { x: 25, y: 0 }], 10)).toHaveLength(4);
  });

  it('does not spin on a zero step', () => {
    const path = dabPath([{ x: 0, y: 0 }, { x: 2, y: 0 }], 0);
    expect(path.length).toBeGreaterThan(1);
    expect(path.length).toBeLessThan(20);
  });
});

describe('ringMean', () => {
  it('reads the skin around a dab, not the dab itself', () => {
    const width = 21;
    const image = frame(width, width, [200, 160, 150]);
    // a 5x5 bright spot at the centre: the annulus at 1.3r never touches it
    for (let y = 8; y <= 12; y += 1) {
      for (let x = 8; x <= 12; x += 1) {
        const o = (y * width + x) * 4;
        image.data[o] = 255;
        image.data[o + 1] = 255;
        image.data[o + 2] = 255;
      }
    }
    const [r, g, b] = ringMean(image.data, width, width, 10, 10, 3);
    expect(r).toBeCloseTo(200);
    expect(g).toBeCloseTo(160);
    expect(b).toBeCloseTo(150);
  });

  it('falls back to the centre pixel when the ring is off the frame', () => {
    const image = frame(8, 8, [12, 34, 56]);
    expect(ringMean(image.data, 8, 8, 7, 7, 40)).toEqual([12, 34, 56]);
  });
});

describe('applyHeal', () => {
  const blemish = () => {
    const image = frame(101, 101, [200, 160, 150]);
    for (let y = 49; y <= 51; y += 1) {
      for (let x = 49; x <= 51; x += 1) {
        const o = (y * 101 + x) * 4;
        image.data[o] = 80;
        image.data[o + 1] = 60;
        image.data[o + 2] = 55;
      }
    }
    return image;
  };

  const tap = (x: number, y: number, radius = 0.06): HealStroke => ({
    points: [{ x: x / 101, y: y / 101 }],
    radius,
  });

  it('returns the source untouched when there are no strokes', () => {
    const src = blemish();
    expect(applyHeal(src, [])).toBe(src);
  });

  it('replaces a blemish with the surrounding skin and leaves the source alone', () => {
    const src = blemish();
    const out = applyHeal(src, [tap(50, 50)]);
    expect(out).not.toBe(src);
    const healed = pixel(out, 50, 50);
    // moved ~92% of the way from the blemish to the ring's skin colour
    expect(healed[0]).toBeGreaterThan(185);
    expect(healed[1]).toBeGreaterThan(148);
    expect(healed[2]).toBeGreaterThan(138);
    expect(healed[2]).toBeLessThanOrEqual(150);
    expect(pixel(src, 50, 50)).toEqual([80, 60, 55]);
    expect(pixel(out, 5, 5)).toEqual([200, 160, 150]);
  });

  it('heals every dab of a dragged stroke and nothing off it', () => {
    const image = frame(101, 101, [200, 160, 150]);
    for (let x = 30; x <= 70; x += 1) {
      const o = (50 * 101 + x) * 4;
      image.data[o] = 60;
      image.data[o + 1] = 45;
      image.data[o + 2] = 40;
    }
    const out = applyHeal(image, [
      { points: [{ x: 30 / 101, y: 50 / 101 }, { x: 70 / 101, y: 50 / 101 }], radius: 0.05 },
    ]);
    expect(pixel(out, 35, 50)[0]).toBeGreaterThan(180);
    expect(pixel(out, 65, 50)[0]).toBeGreaterThan(180);
    expect(pixel(out, 35, 20)).toEqual([200, 160, 150]);
  });
});

describe('pass early-outs', () => {
  it('keeps the source object when no makeup or local slider is off zero', () => {
    const src = frame(4, 4, [120, 100, 90]);
    const regions = fake({});
    expect(applyMakeup(src, regions, NEUTRAL_PARAMS)).toBe(src);
    expect(applyLocal(src, regions, NEUTRAL_PARAMS)).toBe(src);
  });
});
