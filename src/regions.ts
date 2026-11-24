/**
 * Raw FaceLandmarker points → the `FaceRegions` every pass reads.
 *
 * The index rings are the canonical MediaPipe FACEMESH_* arrays so they survive a model upgrade.
 * "Left" always means the viewer's left — the side of the photo the subject's right cheek is on —
 * because every region is painted on screen. Output stays in the source frame's normalised space,
 * clamped to the frame so a tight crop cannot paint outside the canvas.
 */
import type { FaceRegions, Point } from './types';

const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const EYE_LEFT = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const EYE_RIGHT = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const BROW_LEFT = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const BROW_RIGHT = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];

/** The hairline sits this far past landmark 10 on the glabella→10 axis (calibrated on public/sample.jpg). */
const HAIRLINE = 0.9;
/** How far the teeth ring is pulled off the inner lip, toward the lip's centre. */
const TEETH_INSET = 0.12;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

export function buildRegions(points: readonly Point[]): FaceRegions {
  if (points.length < 468) {
    throw new Error(`buildRegions: the FaceLandmarker returns 468 points, got ${points.length}`);
  }

  const at = (index: number): Point => ({ x: clamp01(points[index].x), y: clamp01(points[index].y) });
  const ring = (indexes: readonly number[]) => indexes.map(at);
  const mid = (a: Point, b: Point): Point => ({
    x: clamp01((a.x + b.x) / 2),
    y: clamp01((a.y + b.y) / 2),
  });
  const inset = (p: Point, toward: Point, t: number): Point => ({
    x: clamp01(p.x + (toward.x - p.x) * t),
    y: clamp01(p.y + (toward.y - p.y) * t),
  });
  const centroid = (list: readonly Point[]): Point => ({
    x: list.reduce((sum, p) => sum + p.x, 0) / list.length,
    y: list.reduce((sum, p) => sum + p.y, 0) / list.length,
  });

  const oval = ring(FACE_OVAL);
  const chin = at(152);
  const glabella = mid(at(46), at(276));
  // the hairline is not a landmark: continue the glabella→10 axis past landmark 10
  const top = at(10);
  const foreheadTop: Point = {
    x: clamp01(top.x + (top.x - glabella.x) * HAIRLINE),
    y: clamp01(top.y + (top.y - glabella.y) * HAIRLINE),
  };

  const eyeLeft = ring(EYE_LEFT);
  const eyeRight = ring(EYE_RIGHT);
  // the iris centres only exist on the 478-point model; a 468-point mesh falls back to the lid ring
  const hasIris = points.length > 473;
  const eyeLeftCenter = hasIris ? at(468) : centroid(eyeLeft);
  const eyeRightCenter = hasIris ? at(473) : centroid(eyeRight);
  const under = (lid: readonly Point[], centre: Point): Point => {
    const bottom = Math.max(...lid.map((p) => p.y));
    const span = bottom - Math.min(...lid.map((p) => p.y));
    return { x: centre.x, y: clamp01(bottom + span * 0.35) };
  };

  const lipInner = ring(LIPS_INNER);
  const lipCentre = centroid(lipInner);
  // the teeth show in the upper half of the inner lip; the ring closes along the mouth line
  const teeth = lipInner.slice(0, 11).map((p) => inset(p, lipCentre, TEETH_INSET));

  return {
    oval,
    jawLeft: [oval[0], ...oval.slice(19).reverse(), chin],
    jawRight: [...oval.slice(0, 18), chin],
    chin,
    foreheadTop,
    foreheadCenter: mid(foreheadTop, glabella),
    cheekLeft: at(50),
    cheekRight: at(280),
    eyeLeft,
    eyeRight,
    eyeLeftCenter,
    eyeRightCenter,
    eyeLeftInner: at(133),
    eyeLeftOuter: at(33),
    eyeRightInner: at(362),
    eyeRightOuter: at(263),
    browLeft: ring(BROW_LEFT),
    browRight: ring(BROW_RIGHT),
    underEyeLeft: under(eyeLeft, eyeLeftCenter),
    underEyeRight: under(eyeRight, eyeRightCenter),
    noseTip: at(1),
    noseWingLeft: at(129),
    noseWingRight: at(358),
    noseBridgeTop: at(168),
    noseBridgeBottom: at(2),
    lipOuter: ring(LIPS_OUTER),
    lipInner,
    mouthLeft: at(61),
    mouthRight: at(291),
    teeth,
  };
}
