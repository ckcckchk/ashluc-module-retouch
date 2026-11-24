# @ashluc/retouch

A portrait retouch editor for React that runs entirely in the browser — Meitu-style face tuning, not
a colour filter. Face landmarks are measured locally, and every effect is applied by plain canvas
passes: nothing is uploaded, and there is no server.

```tsx
import { RetouchEditor } from '@ashluc/retouch';
import '@ashluc/retouch/style.css';

<RetouchEditor
  source={portraitUrl}
  locale="zh-HK"
  onApply={async ({ canvas }) => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    // store it, show it, send it
  }}
/>;
```

## What it does

| Tab | Sliders |
|---|---|
| 形體 shape | slim, v-shape chin, forehead, cheekbone, face length |
| 眼睛 eyes | eye size, eye spacing, outer-corner tilt, eye height |
| 鼻子 nose | wing width, nose length, nose tip |
| 嘴巴 mouth | mouth width, lip fullness, smile |
| 皮膚 skin | smoothing, whitening, even tone |
| 妝容 makeup | blush, lip colour (4 shades), brow, eye shadow, contour |
| 局部 local | eye brighten, under-eye bag, teeth |

Plus five one-tap looks (自然 / 精緻 / 網紅 / 清新 / 男神), a hold-to-compare original button, a heal
brush for blemishes and small objects, rotate and mirror.

## How it works

- **Detection** — `@mediapipe/tasks-vision` FaceLandmarker (478 points), lazy-imported on the first
  frame. The wasm runtime and the model come from Google's public CDN (`shortcut:` noted in
  `src/landmarks.ts`); vendor them under `public/mediapipe/` if the host must work offline.
- **Geometry** — an inverse-mapped displacement field built from the landmark regions, evaluated on
  a coarse grid and bilinearly sampled, so a jaw slim or an eye enlarge leaves no mesh seams.
- **Skin** — edge-aware blend of a blurred copy over the sharp one inside the face oval, minus the
  eyes, brows and lips, plus a whitening wash and a red-channel even-out.
- **Makeup** — soft radial washes clipped to the landmark shapes in `soft-light` / `overlay` /
  `multiply`, the same composites a retoucher paints with.
- **Local + heal** — ellipse-masked luminance/teeth work, and a ring-sampled patch blend along a
  brush stroke.
- **Order** — skin → makeup → local → heal → geometry → rotate/flip. Geometry last, so the warp
  carries every earlier pass with it.

## Props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `source` | `string` | — | portrait URL / data URL |
| `locale` | `'en' \| 'zh-HK' \| 'zh-CN'` | `'zh-HK'` | built-in copy language |
| `previewEdge` | `number` | `900` | preview long edge in px |
| `onApply` | `(result, params) => void \| Promise\<void\>` | — | receives the finished canvas at up to 2048 px |
| `onParamsChange` | `(params) => void` | — | optional state mirror |
| `copy` | `Partial<Copy>` | — | copy overrides, merged over the locale table |
| `className` | `string` | — | extra class on the root |

The engine is exported too (`renderRetouch`, `detectLandmarks`, `buildRegions`, `PRESETS`,
`clampParams`, …) if a host wants to drive the passes itself.

## Layout

The panel answers to the width of the **container the host gives it**, not the viewport:

- **660 px and wider** — preview on the left, control sheet on the right (the panel takes
  `minmax(300px, min(360px, 45%))`); the sheet scrolls inside the editor instead of growing the
  page.
- **Below 660 px** — the preview band pins to the top (frame, compare/rotate/mirror, notice) and
  only the control sheet scrolls underneath it. The band is budgeted to ~44% of the viewport, and
  to ~38% under a 480 px container so a phone keeps more than half the screen for the controls.

Height is the host's call. Give the editor a definite height (`height: 640px` on its wrapper) and
it fills that box, with the sheet scrolling internally and the apply bar pinned; leave the height
auto and it grows like any block, which is what the demo does. On touch pointers every control row
is at least 44 px and no row clips.

## Styling

The component ships `dist/styles.css` with `rt-*` classes and reads host colours from
`--rt-*` custom properties with sane fallbacks, so it inherits nothing and leaks nothing. Override
any of them on the root:

```css
.rt-root {
  --rt-accent: #2563eb;
  --rt-ink: #111827;
  --rt-surface: #fff;
  --rt-line: #e5e7eb;
  --rt-radius: 12px;
}
```

One layout token: `--rt-frame-max` is the preview's height budget in the stacked layout, which
defaults to keeping the band under ~44% of the viewport. A host whose page scrolls can spend more
room on the preview by setting it on the editor's wrapper:

```css
.editor-card {
  --rt-frame-max: 56vh;
}
```

## Development

```bash
npm install
npm run dev        # demo on http://localhost:5191 with the sample portrait
npm test
npm run build      # writes dist/ (committed — hosts install from it)
```
