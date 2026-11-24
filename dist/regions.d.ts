/**
 * Raw FaceLandmarker points → the `FaceRegions` every pass reads.
 *
 * The index rings are the canonical MediaPipe FACEMESH_* arrays so they survive a model upgrade.
 * "Left" always means the viewer's left — the side of the photo the subject's right cheek is on —
 * because every region is painted on screen. Output stays in the source frame's normalised space,
 * clamped to the frame so a tight crop cannot paint outside the canvas.
 */
import type { FaceRegions, Point } from './types';
export declare function buildRegions(points: readonly Point[]): FaceRegions;
