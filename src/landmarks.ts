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
export type LandmarkError = Error & { code: LandmarkErrorCode };

type Detector = import('@mediapipe/tasks-vision').FaceLandmarker;
type DetectorOptions = import('@mediapipe/tasks-vision').FaceLandmarkerOptions;

// Pinned to the installed runtime: the wasm build and the JS build have to match.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm';
// shortcut: wasm and model are fetched from Google's CDN on the first face; vendor both under public/mediapipe/ if the host must work offline.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

function fail(code: LandmarkErrorCode, message: string, cause?: unknown): LandmarkError {
  const error = new Error(message, cause === undefined ? undefined : { cause }) as LandmarkError;
  error.code = code;
  return error;
}

let runtime: Detector | null = null;
let pending: Promise<Detector> | null = null;
let delegate: 'GPU' | 'CPU' = 'GPU';

async function load(): Promise<Detector> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const options = (on: 'GPU' | 'CPU'): DetectorOptions => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate: on },
    runningMode: 'IMAGE',
  });
  if (delegate === 'GPU') {
    try {
      return await FaceLandmarker.createFromOptions(fileset, options('GPU'));
    } catch {
      // no usable WebGL delegate: stay on CPU for the rest of the page, not just this load
      delegate = 'CPU';
    }
  }
  return FaceLandmarker.createFromOptions(fileset, options('CPU'));
}

function getDetector(): Promise<Detector> {
  if (runtime) return Promise.resolve(runtime);
  pending ??= load()
    .then((detector) => (runtime = detector))
    .catch((error: unknown) => {
      throw fail('load', 'landmark: the MediaPipe runtime could not load', error);
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

function discard(): void {
  runtime?.close();
  runtime = null;
  pending = null;
}

/** Throw away the cached detector: the next `detectLandmarks` loads it again from scratch. */
export function resetLandmarker(): void {
  discard();
  delegate = 'GPU';
}

/**
 * The 478 normalised landmarks of the largest face in `source`, in the source frame's own 0..1 space.
 * Rejects with `code: 'load'` when the runtime, the model or the image could not be read, and
 * `code: 'none'` when there is no face in the picture.
 */
export async function detectLandmarks(source: LandmarkSource): Promise<Point[]> {
  if (!source || !(source.width > 0) || !(source.height > 0)) {
    throw fail('load', 'landmark: the source has no pixels');
  }

  const detector = await getDetector();
  let face: Point[] | undefined;
  try {
    face = detector.detect(source).faceLandmarks[0];
  } catch (error) {
    if (delegate !== 'GPU') throw fail('load', 'landmark: detection failed', error);
    // a WebGL context can die on its first frame; the CPU delegate on the same image does not
    delegate = 'CPU';
    discard();
    try {
      face = (await getDetector()).detect(source).faceLandmarks[0];
    } catch (retry) {
      throw fail('load', 'landmark: detection failed', retry);
    }
  }

  // shortcut: one face as the detector ranks it, which is the largest in any normal portrait but can be a second face in a group shot
  if (!face || face.length < 468) throw fail('none', 'landmark: no face found');
  return face.map(({ x, y }) => ({ x, y }));
}
