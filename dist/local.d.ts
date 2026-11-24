/**
 * Local pass — eye brighten, under-eye bags, teeth whitening — and the heal brush.
 *
 * The three sliders reuse the makeup paint rules: a feathered wash clipped to a landmark ring, in a
 * blend mode that leaves the skin's own light alone. The heal brush works per pixel instead, because
 * it must replace a blemish with the colour of the skin *around* it, not with a flat wash.
 */
import { type FaceRegions, type HealStroke, type Point, type RetouchParams } from './types';
import { type Rgb } from './makeup';
export declare function applyLocal(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData;
/** 1 at the centre, 0 at the rim, smoothstep between — a dab cannot leave a visible ring. */
export declare const feather: (distance: number, radius: number) => number;
/** Dabs every `step` along a polyline, so a fast stroke still covers every pixel it crossed. */
export declare function dabPath(points: readonly Point[], step: number): Point[];
/**
 * Mean colour of the annulus just outside a dab — what the heal brush puts back in place of a
 * blemish. Sampling the ring, not the dab, is the whole trick: the spot itself is left out.
 */
export declare function ringMean(data: Uint8ClampedArray, width: number, height: number, cx: number, cy: number, radius: number, samples?: number): Rgb;
export declare function applyHeal(src: ImageData, strokes: readonly HealStroke[]): ImageData;
