/**
 * @ashluc/retouch — a portrait retouch editor that runs entirely in the browser.
 *
 * The engine is plain functions over `ImageData`; the editor is one React component that owns the
 * preview, the tabs, the presets, the compare toggle and the heal brush. The host supplies the
 * portrait and receives the finished frame; nothing here encodes, uploads or stores anything.
 */
import './styles.css';
export { RetouchEditor } from './ui/RetouchEditor';
export type { RetouchEditorProps, RetouchResult, RetouchStatus } from './ui/RetouchEditor';
export { renderRetouch, rotatedSize } from './pipeline';
export type { RetouchSource } from './pipeline';
export { MAX_EDGE, PREVIEW_EDGE } from './edge';
export { detectLandmarks, resetLandmarker } from './landmarks';
export { buildRegions } from './regions';
export { COPY } from './copy';
export type { Copy, Locale } from './copy';
export { GROUPS, HEAL_RADIUS, LIP_SHADES, NEUTRAL_PARAMS, PRESETS, SLIDER_IDS, activePasses, anyActive, clampParams, isNeutral, lipShadeHex, presetParams, } from './types';
export type { FaceRegions, GroupId, HealStroke, LipShade, Point, PresetId, RetouchParams, SliderId, } from './types';
