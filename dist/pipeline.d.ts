import { type FaceRegions, type HealStroke, type RetouchParams } from './types';
export type RetouchSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
/** A quarter turn swaps the canvas's width and height. */
export declare function rotatedSize(width: number, height: number, rotate: RetouchParams['rotate']): {
    width: number;
    height: number;
};
/**
 * Paint one retouched frame at `maxEdge`. `regions` is null until a face has been measured, which
 * is why the geometry and appearance passes are skipped rather than run on empty regions — the
 * heal brush still works on a frame with no face in it.
 */
export declare function renderRetouch(source: RetouchSource, params: RetouchParams, regions: FaceRegions | null, strokes?: readonly HealStroke[], maxEdge?: number): HTMLCanvasElement;
