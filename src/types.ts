/**
 * The retouch model — the one vocabulary every module of the editor shares.
 *
 * Every slider is -100..100 with 0 as untouched, and every coordinate is normalised (0..1 of the
 * source frame) so the same values paint identically at preview resolution and at the applied edge.
 * Nothing here touches the DOM: geometry, colours and the preset table are plain data.
 */

/** A point in the source frame, normalised 0..1. */
export interface Point {
  x: number;
  y: number;
}

export type GroupId = 'shape' | 'eyes' | 'nose' | 'mouth' | 'skin' | 'makeup' | 'local';

export type LipShade = 'rose' | 'coral' | 'plum' | 'nude';

export type PresetId = 'natural' | 'refined' | 'glam' | 'fresh' | 'male';

export interface RetouchParams {
  slim: number;
  vshape: number;
  forehead: number;
  cheek: number;
  facelength: number;
  eyesize: number;
  eyespace: number;
  eyetilt: number;
  eyeopen: number;
  nosewidth: number;
  noselength: number;
  nosetip: number;
  mouthwidth: number;
  lipfull: number;
  smile: number;
  smooth: number;
  whiten: number;
  eventone: number;
  blush: number;
  lipcolor: number;
  brow: number;
  eyeshadow: number;
  contour: number;
  eyebright: number;
  eyebag: number;
  teeth: number;
  lipShade: LipShade;
  rotate: 0 | 90 | 180 | 270;
  flip: boolean;
}

export type SliderId = Exclude<keyof RetouchParams, 'lipShade' | 'rotate' | 'flip'>;

export const SLIDER_IDS: readonly SliderId[] = [
  'slim',
  'vshape',
  'forehead',
  'cheek',
  'facelength',
  'eyesize',
  'eyespace',
  'eyetilt',
  'eyeopen',
  'nosewidth',
  'noselength',
  'nosetip',
  'mouthwidth',
  'lipfull',
  'smile',
  'smooth',
  'whiten',
  'eventone',
  'blush',
  'lipcolor',
  'brow',
  'eyeshadow',
  'contour',
  'eyebright',
  'eyebag',
  'teeth',
] as const;

/** The tabs, in the order the panel shows them, each owning its sliders. */
export const GROUPS: ReadonlyArray<{ id: GroupId; sliders: readonly SliderId[] }> = [
  { id: 'shape', sliders: ['slim', 'vshape', 'forehead', 'cheek', 'facelength'] },
  { id: 'eyes', sliders: ['eyesize', 'eyespace', 'eyetilt', 'eyeopen'] },
  { id: 'nose', sliders: ['nosewidth', 'noselength', 'nosetip'] },
  { id: 'mouth', sliders: ['mouthwidth', 'lipfull', 'smile'] },
  { id: 'skin', sliders: ['smooth', 'whiten', 'eventone'] },
  { id: 'makeup', sliders: ['blush', 'lipcolor', 'brow', 'eyeshadow', 'contour'] },
  { id: 'local', sliders: ['eyebright', 'eyebag', 'teeth'] },
];

export const LIP_SHADES: ReadonlyArray<{ id: LipShade; hex: string }> = [
  { id: 'rose', hex: '#c0555f' },
  { id: 'coral', hex: '#d0714a' },
  { id: 'plum', hex: '#8e3a58' },
  { id: 'nude', hex: '#b57a6d' },
];

export const lipShadeHex = (shade: LipShade): string =>
  LIP_SHADES.find((entry) => entry.id === shade)?.hex ?? '#c0555f';

export const NEUTRAL_PARAMS: RetouchParams = {
  slim: 0,
  vshape: 0,
  forehead: 0,
  cheek: 0,
  facelength: 0,
  eyesize: 0,
  eyespace: 0,
  eyetilt: 0,
  eyeopen: 0,
  nosewidth: 0,
  noselength: 0,
  nosetip: 0,
  mouthwidth: 0,
  lipfull: 0,
  smile: 0,
  smooth: 0,
  whiten: 0,
  eventone: 0,
  blush: 0,
  lipcolor: 0,
  brow: 0,
  eyeshadow: 0,
  contour: 0,
  eyebright: 0,
  eyebag: 0,
  teeth: 0,
  lipShade: 'rose',
  rotate: 0,
  flip: false,
};

/** Landmark-measured regions, normalised like `Point`. Built by `regions.ts`. */
export interface FaceRegions {
  /** closed ring around the face, ordered from the left temple clockwise */
  oval: Point[];
  /** the oval's left half, top to chin */
  jawLeft: Point[];
  /** the oval's right half, top to chin */
  jawRight: Point[];
  chin: Point;
  /** hairline centre */
  foreheadTop: Point;
  foreheadCenter: Point;
  cheekLeft: Point;
  cheekRight: Point;
  eyeLeft: Point[];
  eyeRight: Point[];
  eyeLeftCenter: Point;
  eyeRightCenter: Point;
  eyeLeftInner: Point;
  eyeLeftOuter: Point;
  eyeRightInner: Point;
  eyeRightOuter: Point;
  browLeft: Point[];
  browRight: Point[];
  underEyeLeft: Point;
  underEyeRight: Point;
  noseTip: Point;
  noseWingLeft: Point;
  noseWingRight: Point;
  noseBridgeTop: Point;
  noseBridgeBottom: Point;
  lipOuter: Point[];
  lipInner: Point[];
  mouthLeft: Point;
  mouthRight: Point;
  /** closed ring inside the upper inner lip */
  teeth: Point[];
}

/** One brush stroke of the heal tool, recorded in source-frame coordinates. */
export interface HealStroke {
  points: Point[];
  /** brush radius as a fraction of the frame's short edge (0.01..0.12) */
  radius: number;
}

/** Brush radius default, fraction of the short edge. */
export const HEAL_RADIUS = 0.035;

/**
 * The five one-tap looks. Each carries the whole slider set of its family, so a preset can never
 * inherit a stale value from whatever was tuned before it.
 */
export const PRESETS: ReadonlyArray<{ id: PresetId; params: Partial<RetouchParams> }> = [
  {
    id: 'natural',
    params: {
      slim: 10,
      vshape: 8,
      eyesize: 12,
      smooth: 35,
      whiten: 12,
      eventone: 20,
      blush: 6,
      lipcolor: 8,
      eyebright: 10,
      eyebag: 8,
      teeth: 6,
    },
  },
  {
    id: 'refined',
    params: {
      slim: 24,
      vshape: 18,
      cheek: 8,
      eyesize: 22,
      eyetilt: 8,
      nosewidth: 10,
      nosetip: 8,
      lipfull: 8,
      smile: 6,
      smooth: 55,
      whiten: 22,
      eventone: 35,
      blush: 14,
      lipcolor: 18,
      brow: 12,
      eyeshadow: 10,
      contour: 12,
      eyebright: 20,
      eyebag: 15,
      teeth: 12,
    },
  },
  {
    id: 'glam',
    params: {
      slim: 34,
      vshape: 30,
      facelength: -8,
      cheek: 12,
      eyesize: 34,
      eyespace: -10,
      eyetilt: 14,
      eyeopen: 10,
      nosewidth: 20,
      noselength: 8,
      nosetip: 16,
      mouthwidth: -8,
      lipfull: 20,
      smile: 12,
      smooth: 70,
      whiten: 35,
      eventone: 50,
      blush: 28,
      lipcolor: 34,
      brow: 22,
      eyeshadow: 24,
      contour: 24,
      eyebright: 28,
      eyebag: 22,
      teeth: 20,
    },
  },
  {
    id: 'fresh',
    params: {
      slim: 12,
      eyesize: 14,
      eyeopen: 8,
      smooth: 45,
      whiten: 28,
      eventone: 28,
      blush: 16,
      lipcolor: 14,
      eyebright: 16,
      eyebag: 12,
      teeth: 10,
    },
  },
  {
    id: 'male',
    params: {
      slim: 14,
      vshape: 8,
      nosewidth: 8,
      smooth: 30,
      whiten: 10,
      eventone: 25,
      brow: 16,
      contour: 14,
      eyesize: 8,
      eyebag: 12,
    },
  },
];

/** A preset as a full param set, on top of the neutral one. */
export function presetParams(id: PresetId): RetouchParams {
  const preset = PRESETS.find((entry) => entry.id === id);
  return clampParams(preset?.params ?? {});
}

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(100, Math.max(-100, Math.round(value * 10) / 10)) : fallback;

/** Keep every slider on its range and the two geometry fields legal, so a stale record cannot paint nonsense. */
export function clampParams(p: Partial<RetouchParams> | null | undefined): RetouchParams {
  const source = p ?? {};
  const out = { ...NEUTRAL_PARAMS };
  for (const id of SLIDER_IDS) out[id] = finite(source[id] ?? 0, 0);
  out.lipShade = LIP_SHADES.some((entry) => entry.id === source.lipShade)
    ? (source.lipShade as LipShade)
    : 'rose';
  out.rotate = source.rotate === 90 || source.rotate === 180 || source.rotate === 270 ? source.rotate : 0;
  out.flip = source.flip === true;
  return out;
}

export function isNeutral(p: RetouchParams): boolean {
  const e = clampParams(p);
  return SLIDER_IDS.every((id) => e[id] === 0) && e.rotate === 0 && !e.flip;
}

/** True when any of the given sliders is off zero. */
export function anyActive(p: RetouchParams, ids: readonly SliderId[]): boolean {
  return ids.some((id) => p[id] !== 0);
}

/** Which passes a params set needs; the pipeline runs only these. */
export function activePasses(p: RetouchParams) {
  const e = clampParams(p);
  return {
    geometry: anyActive(e, [
      'slim',
      'vshape',
      'forehead',
      'cheek',
      'facelength',
      'eyesize',
      'eyespace',
      'eyetilt',
      'eyeopen',
      'nosewidth',
      'noselength',
      'nosetip',
      'mouthwidth',
      'lipfull',
      'smile',
    ]),
    skin: anyActive(e, ['smooth', 'whiten', 'eventone']),
    makeup: anyActive(e, ['blush', 'lipcolor', 'brow', 'eyeshadow', 'contour']),
    local: anyActive(e, ['eyebright', 'eyebag', 'teeth']),
  };
}
