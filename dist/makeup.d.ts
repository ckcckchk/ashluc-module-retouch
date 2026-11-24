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
import { type FaceRegions, type Point, type RetouchParams } from './types';
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
export declare const hexToRgb: (hex: string) => Rgb;
/** A colour plus its own alpha, for the gradient stops that do the feathering. */
export declare const rgba: (hex: string, alpha: number) => string;
/** Slider → paint alpha. A colour wash has no negative, so the magnitude is the strength. */
export declare const alphaFor: (value: number, ceiling: number) => number;
export declare const boxOf: (points: readonly Point[]) => Box;
export declare const mixPoint: (a: Point, b: Point, t: number) => Point;
/** Normalised point → pixels of this frame. */
export declare const px: (point: Point, width: number, height: number) => Point;
export declare const scaledRing: (points: readonly Point[], width: number, height: number) => Point[];
/** Append a closed subpath to the current path. False when the ring cannot hold an area. */
export declare const addRing: (ctx: CanvasRenderingContext2D, ring: readonly Point[]) => boolean;
export declare const traceRing: (ctx: CanvasRenderingContext2D, ring: readonly Point[]) => boolean;
/** Clip to a normalised ring. Call inside `save()`/`restore()`. */
export declare const clipRing: (ctx: CanvasRenderingContext2D, ring: readonly Point[], width: number, height: number) => boolean;
/** One feathered dab: opaque-ish core, gone at the rim, so no shape edge is ever visible. */
export declare const softWash: (ctx: CanvasRenderingContext2D, dab: Dab, colour: string, alpha: number, mode: GlobalCompositeOperation) => void;
/** The image in, a new image out, painted through an offscreen canvas. The page DOM is never touched. */
export declare const paintCanvas: (src: ImageData, draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void) => ImageData;
/** Blush sits on the cheekbones, sized by the face's own width so it scales with the frame. */
export declare function blushDabs(regions: FaceRegions, width: number, height: number): Dab[];
/** Contour is the hollow under the cheekbone: the cheek dab pulled a little toward the chin. */
export declare function contourDabs(regions: FaceRegions, width: number, height: number): Dab[];
/** The two bright spots either side of the iris — the sclera, not the eye colour. */
export declare function scleraDabs(centre: Point, inner: Point, outer: Point, width: number, height: number): Dab[];
export declare function applyMakeup(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData;
