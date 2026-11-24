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

## Styling

The component ships `dist/ashluc-retouch.css` with `rt-*` classes and reads host colours from
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

## Development

```bash
npm install
npm run dev        # demo on http://localhost:5191 with the sample portrait
npm test
npm run build      # writes dist/ (committed — hosts install from it)
```
