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
import type { FaceRegions, RetouchParams } from './types';
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
/** The displacement of every op summed at one point. */
export declare function warpAt(ops: readonly WarpOp[], x: number, y: number): {
    dx: number;
    dy: number;
};
/** The ops a params set implies. Empty means nothing to warp, which is also the early-out. */
export declare function buildWarpOps(r: FaceRegions, p: RetouchParams): WarpOp[];
export declare function buildWarpField(ops: readonly WarpOp[], cols: number, rows: number): WarpField;
/** Bilinear read of the field at normalised (u, v). Pass `into` in a loop to skip the allocation. */
export declare function sampleField(f: WarpField, u: number, v: number, into?: {
    dx: number;
    dy: number;
}): {
    dx: number;
    dy: number;
};
/**
 * Sample `src` backwards through the warp: destination pixel (u, v) reads source (u − dx, v − dy),
 * bilinearly. Offsets past the frame clamp to the edge pixel, which is what the canvas does.
 */
export declare function applyGeometry(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData;
