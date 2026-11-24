/**
 * The one retouch pipeline. Both the live preview and the applied frame come through
 * `renderRetouch`, so the pixels a person tunes are the pixels the host stores.
 *
 * Order is the order the effects must compose in: appearance first, then the heal brush, then the
 * geometric warp last so a slimmed jaw carries the skin work with it. Rotation and the mirror stay
 * outside the pixel passes — they act on the finished frame.
 */
import { MAX_EDGE } from './edge';
import {
  activePasses,
  clampParams,
  type FaceRegions,
  type HealStroke,
  type RetouchParams,
} from './types';
import { applyGeometry } from './warp';
import { applySkin } from './skin';
import { applyMakeup } from './makeup';
import { applyHeal, applyLocal } from './local';

export type RetouchSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

/** A quarter turn swaps the canvas's width and height. */
export function rotatedSize(width: number, height: number, rotate: RetouchParams['rotate']) {
  return rotate % 180 === 0 ? { width, height } : { width: height, height: width };
}

/**
 * Paint one retouched frame at `maxEdge`. `regions` is null until a face has been measured, which
 * is why the geometry and appearance passes are skipped rather than run on empty regions — the
 * heal brush still works on a frame with no face in it.
 */
export function renderRetouch(
  source: RetouchSource,
  params: RetouchParams,
  regions: FaceRegions | null,
  strokes: readonly HealStroke[] = [],
  maxEdge = MAX_EDGE,
): HTMLCanvasElement {
  const p = clampParams(params);
  const long = Math.max(source.width, source.height);
  const scale = Math.min(1, maxEdge / Math.max(1, long));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no_canvas');
  ctx.imageSmoothingQuality = 'high';
  // jpeg has no alpha channel, and a transparent png would otherwise bake in black
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  const passes = activePasses(p);
  const painted = Boolean(regions) && (passes.skin || passes.makeup || passes.local || passes.geometry);
  if (painted || strokes.length > 0) {
    let image = ctx.getImageData(0, 0, width, height);
    if (regions) {
      if (passes.skin) image = applySkin(image, regions, p);
      if (passes.makeup) image = applyMakeup(image, regions, p);
      if (passes.local) image = applyLocal(image, regions, p);
    }
    if (strokes.length > 0) image = applyHeal(image, strokes);
    if (regions && passes.geometry) image = applyGeometry(image, regions, p);
    ctx.putImageData(image, 0, 0);
  }

  if (p.rotate === 0 && !p.flip) return canvas;

  const size = rotatedSize(width, height, p.rotate);
  const out = document.createElement('canvas');
  out.width = size.width;
  out.height = size.height;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('no_canvas');
  octx.imageSmoothingQuality = 'high';
  octx.translate(size.width / 2, size.height / 2);
  if (p.flip) octx.scale(-1, 1);
  octx.rotate((p.rotate * Math.PI) / 180);
  octx.drawImage(canvas, -width / 2, -height / 2);
  return out;
}
