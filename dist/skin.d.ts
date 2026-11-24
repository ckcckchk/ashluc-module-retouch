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
import type { FaceRegions, RetouchParams } from './types';
/** 1 inside `inner`, smoothstep to 0 at q = 1, nothing past the rim. */
export declare function ellipseWeight(x: number, y: number, cx: number, cy: number, rx: number, ry: number, inner?: number): number;
/** How much of the pass lands on this point: 0..1. Pure, so the shape can be tested without canvas. */
export declare function skinMaskAt(r: FaceRegions, x: number, y: number): number;
/** Brightness curve per amount. `whitenLut(0)` is the identity, so a neutral slider cannot shift a channel. */
export declare function whitenLut(amount: number): Uint8Array;
/**
 * Blur radius in px, tied to the frame so the preview and the applied edge look the same.
 * Kept near pore scale (1% of the short edge at max): a big radius erases structure, which is what
 * makes a 磨皮 look plastic, so the amount buys blend strength rather than a wider blur.
 */
export declare function blurRadius(w: number, h: number, amount: number): number;
/** 1 on flat skin, falling to 0 across a hard edge: lashes, brows and the nose line stay sharp. */
export declare function edgeKeep(gradient: number): number;
/**
 * shortcut: the blur sees transparent black past the frame edge, so skin inside one blur radius of
 * the border darkens slightly. Pad the canvas and crop back if a host crops faces to the frame edge.
 */
export declare function applySkin(src: ImageData, regions: FaceRegions, params: RetouchParams): ImageData;
