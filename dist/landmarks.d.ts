/**
 * One lazy, cached MediaPipe FaceLandmarker per page.
 *
 * The wasm runtime and the 3 MB model are a third-party download, so the import is dynamic: the host
 * bundle pays nothing until the face step opens, and `@mediapipe/tasks-vision` can stay external.
 * The instance is kept between calls, GPU first, CPU when the browser has no usable WebGL delegate.
 */
import type { Point } from './types';
export type LandmarkSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;
export type LandmarkErrorCode = 'load' | 'none';
export type LandmarkError = Error & {
    code: LandmarkErrorCode;
};
/** Throw away the cached detector: the next `detectLandmarks` loads it again from scratch. */
export declare function resetLandmarker(): void;
/**
 * The 478 normalised landmarks of the largest face in `source`, in the source frame's own 0..1 space.
 * Rejects with `code: 'load'` when the runtime, the model or the image could not be read, and
 * `code: 'none'` when there is no face in the picture.
 */
export declare function detectLandmarks(source: LandmarkSource): Promise<Point[]>;
