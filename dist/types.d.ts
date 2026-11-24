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
export declare const SLIDER_IDS: readonly SliderId[];
/** The tabs, in the order the panel shows them, each owning its sliders. */
export declare const GROUPS: ReadonlyArray<{
    id: GroupId;
    sliders: readonly SliderId[];
}>;
export declare const LIP_SHADES: ReadonlyArray<{
    id: LipShade;
    hex: string;
}>;
export declare const lipShadeHex: (shade: LipShade) => string;
export declare const NEUTRAL_PARAMS: RetouchParams;
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
export declare const HEAL_RADIUS = 0.035;
/**
 * The five one-tap looks. Each carries the whole slider set of its family, so a preset can never
 * inherit a stale value from whatever was tuned before it.
 */
export declare const PRESETS: ReadonlyArray<{
    id: PresetId;
    params: Partial<RetouchParams>;
}>;
/** A preset as a full param set, on top of the neutral one. */
export declare function presetParams(id: PresetId): RetouchParams;
/** Keep every slider on its range and the two geometry fields legal, so a stale record cannot paint nonsense. */
export declare function clampParams(p: Partial<RetouchParams> | null | undefined): RetouchParams;
export declare function isNeutral(p: RetouchParams): boolean;
/** True when any of the given sliders is off zero. */
export declare function anyActive(p: RetouchParams, ids: readonly SliderId[]): boolean;
/** Which passes a params set needs; the pipeline runs only these. */
export declare function activePasses(p: RetouchParams): {
    geometry: boolean;
    skin: boolean;
    makeup: boolean;
    local: boolean;
};
