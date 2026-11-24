# AGENTS.md — @ashluc/retouch

A standalone, host-agnostic **portrait retouch editor** for the browser: face-aware geometry, skin,
makeup and a heal brush, all local, no server, no upload. It is built to be embedded — first host is
the Ashluc Cast studio (`~/Documents/Coding/Utils/ashluc-cast`, step 02 修臉), where the default
`apps/console` build imports the committed `dist/`.

## Stack — fixed

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript 5.7 + Vite 7, one component (`RetouchEditor`) |
| Detection | `@mediapipe/tasks-vision` FaceLandmarker (478 landmarks), lazy-imported on first use |
| Pixels | plain `ImageData` passes over canvas 2D — no WebGL, no worker, no server |
| Styles | one prefixed stylesheet (`rt-*`), host tokens read through CSS custom properties |
| Build | `vite build` (ESM library, React + MediaPipe external) + `tsc` declarations into `dist/` |

Rules: no network call except the MediaPipe model fetch, no analytics, no storage, no host-specific
import. Every slider is `-100..100` with `0` neutral and every coordinate is normalised `0..1`, so a
preview at 900 px and an applied frame at 2048 px are the same picture.

## Commands

```bash
cd "~/Documents/Coding/Custom Modules/ashluc-module-retouch"
npm install
npm run dev            # demo on :5191
npm run typecheck      # tsc --noEmit
npm test               # vitest
npm run build          # dist/ (index.js + styles.css + index.d.ts) — COMMITTED
npm run build:demo     # demo-dist/ for screenshots
```

`dist/` is committed on purpose: the host installs this package with a `file:` dependency and its
own `tsc` reads `dist/index.d.ts`, so a consumer never needs this repo's toolchain.

## The contract (frozen vocabulary)

`src/types.ts` is the single source of truth. Do not add a field to `RetouchParams` without adding it
to `SLIDER_IDS`, `GROUPS`, `NEUTRAL_PARAMS` and the copy table in the same edit — the panel renders
from `GROUPS`, the pipeline early-outs from `activePasses`, and a field in one list but not the others
is a slider that paints nothing or a pass that never runs.

Module boundaries, one owner each:

| File | Owns | Exports |
|---|---|---|
| `types.ts` | the model | `RetouchParams`, `FaceRegions`, `HealStroke`, `PRESETS`, `clampParams`, `activePasses` |
| `pipeline.ts` | pass order, rotate/flip | `renderRetouch(source, params, regions, strokes, maxEdge)` |
| `landmarks.ts` | MediaPipe load + detect | `detectLandmarks(source) => Promise<Point[] \| null>` |
| `regions.ts` | landmark index → `FaceRegions` | `buildRegions(points)` |
| `warp.ts` | geometric sliders | `applyGeometry(imageData, regions, params)` |
| `skin.ts` | smooth / whiten / evenTone | `applySkin(imageData, regions, params)` |
| `makeup.ts` | blush / lip / brow / shadow / contour | `applyMakeup(imageData, regions, params)` |
| `local.ts` | brighten / bag / teeth / heal | `applyLocal(imageData, regions, params)`, `applyHeal(imageData, strokes)` |
| `ui/RetouchEditor.tsx` | the editor | `RetouchEditor`, `RetouchEditorProps` |
| `copy.ts` | en / zh-HK / zh-CN strings | `COPY` |

Pass order is fixed by `pipeline.ts`: skin → makeup → local → heal → geometry → rotate/flip.
Geometry runs LAST so the warp carries every earlier pass with it; every module therefore works in
the un-warped frame and receives regions in un-warped coordinates.

## Status board

| Area | State |
|---|---|
| Landmark detection (MediaPipe, CDN wasm + model) | **0.1.0** |
| Geometry (slim / v-shape / forehead / cheek / face length / eyes / nose / mouth) | **0.1.0** |
| Skin (smooth, whiten, even tone) | **0.1.0** |
| Makeup (blush, lip colour + 4 shades, brow, eye shadow, contour) | **0.1.0** |
| Local (eye brighten, eye bag, teeth) | **0.1.0** |
| Heal brush (blemish / object removal) | **0.1.0** |
| Five presets, compare-while-held, rotate/flip, reset | **0.1.0** |
| Layout — answers to the host's container width: side by side (preview left, scrolling sheet right) from 760 px, a pinned preview band with only the sheet scrolling below it; `height: 100%` on the root so a definite-height wrapper gets a full-height editor while an auto-height one grows as before; the stacked preview budget is `--rt-frame-max` (default `calc(44vh - 84px)`, 64vh side by side) so the band stays under ~44% of the viewport; every control row ≥ 44 px under `pointer: coarse` | **0.1.0** |
| Demo app (`npm run dev`) | **0.1.0** |

## Delegating it

Work goes through `mk-coding`: one lane per file family above, the model in `types.ts` frozen before
the fan-out, and `pipeline.ts`/`index.ts` owned by the orchestrator alone. Lanes never
`git commit`.
