import { useEffect, useState } from 'react';
import { GROUPS, RetouchEditor, SLIDER_IDS } from '../src/index';
import type { GroupId, Locale, RetouchParams, RetouchResult } from '../src/index';

const SAMPLE = `${import.meta.env.BASE_URL}sample.jpg`;
const REPO = 'https://github.com/ckcckchk/ashluc-module-retouch';

const LANGUAGES: ReadonlyArray<{ id: Locale; short: string; name: string }> = [
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'zh-HK', short: '繁', name: '繁體中文（香港）' },
  { id: 'zh-CN', short: '简', name: '简体中文' },
];

const HTML_LANG: Record<Locale, string> = { en: 'en', 'zh-HK': 'zh-Hant-HK', 'zh-CN': 'zh-Hans-CN' };

const SNIPPET = `import { RetouchEditor } from
  '@ashluc/retouch';

<RetouchEditor
  source="/portrait.jpg"
  locale="zh-HK"
  onApply={({ canvas }) => {
    // keep the frame
    save(canvas);
  }}
/>`;

interface Copy {
  eyebrow: string;
  title: [string, string];
  lede: string;
  cta: string;
  langLabel: string;
  stats: ReadonlyArray<{ value: string; label: string }>;
  editorKicker: string;
  editorNote: string;
  resultKicker: string;
  resultNote: string;
  resultEmpty: string;
  resultAlt: string;
  download: string;
  paramsKicker: string;
  paramsCount: (n: number) => string;
  lip: string;
  rotate: string;
  mirror: string;
  on: string;
  off: string;
  groups: Record<GroupId, string>;
  howKicker: string;
  sections: ReadonlyArray<{ title: string; body: string }>;
  embedKicker: string;
  embedNote: string;
  footNote: string;
}

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: 'Portrait retouch that runs in the browser',
    title: ['Retouch a real face.', 'Nothing leaves the page.'],
    lede: 'Ashluc Retouch is one React component. It measures 478 face landmarks locally, then paints geometry, skin, makeup and heal passes onto a canvas — no upload, no server, no storage.',
    cta: 'Try the editor',
    langLabel: 'Language',
    stats: [
      { value: '478', label: 'face landmarks' },
      { value: '26', label: 'sliders · 7 tabs' },
      { value: '5', label: 'one-tap looks' },
      { value: '0', label: 'uploads' },
    ],
    editorKicker: 'The editor',
    editorNote: 'Drag a slider or tap a look. Hold the compare button to see the original. Every slider runs −100 to 100, and 0 is untouched.',
    resultKicker: 'Applied result',
    resultNote: 'onApply hands back a canvas at up to 2048 px — yours to keep, show or send. The params behind it come through as the second argument.',
    resultEmpty: 'Apply a retouch and the returned canvas lands here, with the params behind it.',
    resultAlt: 'Retouched portrait, as returned by onApply',
    download: 'Download JPEG',
    paramsKicker: 'Params carried',
    paramsCount: (n) => `${n} active`,
    lip: 'lip',
    rotate: 'rotate',
    mirror: 'mirror',
    on: 'on',
    off: 'off',
    groups: {
      shape: 'Shape',
      eyes: 'Eyes',
      nose: 'Nose',
      mouth: 'Mouth',
      skin: 'Skin',
      makeup: 'Makeup',
      local: 'Local',
    },
    howKicker: 'What the engine does',
    sections: [
      {
        title: 'Measure first',
        body: 'MediaPipe FaceLandmarker loads lazily on the first frame and returns 478 points. Every slider is measured against that one face map, not a guessed oval, so a jaw slim and an eye enlarge land where the face actually is.',
      },
      {
        title: 'A fixed order',
        body: 'Skin → makeup → local → heal → geometry → rotate/flip. Geometry runs last on purpose: the warp carries every earlier pass with it, so the preview and the 2048 px export are the same picture.',
      },
      {
        title: 'Nothing leaves the browser',
        body: 'Plain ImageData passes over canvas 2D: no server, no analytics, no storage. One rt-* stylesheet, colours read from --rt-* tokens, so the component inherits nothing from your page and leaks nothing back.',
      },
    ],
    embedKicker: 'Embedding it',
    embedNote: 'The component imports its own stylesheet; the host only supplies a portrait and decides what to do with the returned canvas.',
    footNote: 'ISC · first host: Ashluc Cast studio, step 02 修臉.',
  },

  'zh-HK': {
    eyebrow: '在瀏覽器內完成的人像修圖',
    title: ['真實人臉修圖，', '照片不會離開瀏覽器。'],
    lede: 'Ashluc Retouch 是一個 React 元件：在本機量度 478 個人臉特徵點，再以 canvas 逐層繪畫形體、皮膚、妝容與修補。不上傳、不經伺服器、不儲存。',
    cta: '開始試用',
    langLabel: '語言',
    stats: [
      { value: '478', label: '人臉特徵點' },
      { value: '26', label: '支滑桿 · 7 個分頁' },
      { value: '5', label: '一鍵妝容' },
      { value: '0', label: '上傳' },
    ],
    editorKicker: '編輯器',
    editorNote: '拖動滑桿或點一下妝容；按住對比鍵可看原圖。每支滑桿由 −100 到 100，0 代表原樣。',
    resultKicker: '套用結果',
    resultNote: 'onApply 交回一張最多 2048 px 的 canvas，由你決定怎樣用；它帶着的參數會以第二個參數傳入。',
    resultEmpty: '套用一次修圖，這裡會顯示交回的 canvas，以及它帶着的參數。',
    resultAlt: 'onApply 交回的修圖後人像',
    download: '下載 JPEG',
    paramsKicker: '帶着的參數',
    paramsCount: (n) => `${n} 項生效`,
    lip: '唇色',
    rotate: '旋轉',
    mirror: '鏡像',
    on: '開',
    off: '關',
    groups: {
      shape: '形體',
      eyes: '眼睛',
      nose: '鼻子',
      mouth: '嘴巴',
      skin: '皮膚',
      makeup: '妝容',
      local: '局部',
    },
    howKicker: '引擎怎樣運作',
    sections: [
      {
        title: '先量度，後修圖',
        body: 'MediaPipe FaceLandmarker 在第一次使用時才載入，量出 478 個點。每支滑桿都對着同一張臉部地圖，而不是猜一個橢圓，所以削下巴與放大眼睛都落在真正的臉上。',
      },
      {
        title: '固定的處理次序',
        body: '皮膚 → 妝容 → 局部 → 修補 → 形體 → 旋轉／鏡像。形體放在最後：變形會帶着之前每一層一起走，所以預覽與 2048 px 輸出是同一個畫面。',
      },
      {
        title: '不上傳、不儲存',
        body: '純 ImageData 與 canvas 2D：無伺服器、無分析、無 storage。只有一份 rt-* 樣式表，顏色由 --rt-* 變數傳入，所以元件不繼承你頁面的樣式，也不會漏回頁面。',
      },
    ],
    embedKicker: '嵌入方式',
    embedNote: '元件會自行載入樣式表；主機只需提供一張相，並決定交回的 canvas 怎樣用。',
    footNote: 'ISC · 首個宿主：Ashluc Cast studio 第 02 步 修臉。',
  },

  'zh-CN': {
    eyebrow: '在浏览器内完成的人像修图',
    title: ['真实人脸修图，', '照片不会离开浏览器。'],
    lede: 'Ashluc Retouch 是一个 React 组件：在本机测量 478 个人脸特征点，再用 canvas 逐层绘制形体、皮肤、妆容与修补。不上传、不经服务器、不存储。',
    cta: '开始试用',
    langLabel: '语言',
    stats: [
      { value: '478', label: '人脸特征点' },
      { value: '26', label: '个滑块 · 7 个分页' },
      { value: '5', label: '一键妆容' },
      { value: '0', label: '上传' },
    ],
    editorKicker: '编辑器',
    editorNote: '拖动滑块或点一下妆容；按住对比键可看原图。每个滑块从 −100 到 100，0 代表原样。',
    resultKicker: '套用结果',
    resultNote: 'onApply 交回一张最多 2048 px 的 canvas，由你决定怎样用；它携带的参数会作为第二个参数传入。',
    resultEmpty: '套用一次修图，这里会显示交回的 canvas，以及它携带的参数。',
    resultAlt: 'onApply 交回的修图后人像',
    download: '下载 JPEG',
    paramsKicker: '携带的参数',
    paramsCount: (n) => `${n} 项生效`,
    lip: '唇色',
    rotate: '旋转',
    mirror: '镜像',
    on: '开',
    off: '关',
    groups: {
      shape: '形体',
      eyes: '眼睛',
      nose: '鼻子',
      mouth: '嘴巴',
      skin: '皮肤',
      makeup: '妆容',
      local: '局部',
    },
    howKicker: '引擎如何运作',
    sections: [
      {
        title: '先测量，后修图',
        body: 'MediaPipe FaceLandmarker 在第一次使用时才载入，测出 478 个点。每个滑块都对着同一张脸部地图，而不是猜一个椭圆，所以削下巴与放大眼睛都落在真正的脸上。',
      },
      {
        title: '固定的处理顺序',
        body: '皮肤 → 妆容 → 局部 → 修补 → 形体 → 旋转／镜像。形体放在最后：变形会带着之前每一层一起走，所以预览与 2048 px 输出是同一个画面。',
      },
      {
        title: '不上传、不存储',
        body: '纯 ImageData 与 canvas 2D：无服务器、无分析、无 storage。只有一份 rt-* 样式表，颜色由 --rt-* 变量传入，所以组件不继承你页面的样式，也不会漏回页面。',
      },
    ],
    embedKicker: '嵌入方式',
    embedNote: '组件会自行载入样式表；主机只需提供一张照片，并决定交回的 canvas 怎样用。',
    footNote: 'ISC · 首个宿主：Ashluc Cast studio 第 02 步 修脸。',
  },
};

interface Applied {
  url: string;
  params: RetouchParams;
  width: number;
  height: number;
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-HK');
  const [applied, setApplied] = useState<Applied | null>(null);
  const t = COPY[locale];

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const handleApply = (result: RetouchResult, params: RetouchParams) => {
    const { canvas } = result;
    // shortcut: JPEG data URL keeps the demo stateless; swap for a blob URL if frames get large.
    setApplied({
      url: canvas.toDataURL('image/jpeg', 0.92),
      params,
      width: canvas.width,
      height: canvas.height,
    });
  };

  const activeCount = applied ? SLIDER_IDS.filter((id) => applied.params[id] !== 0).length : 0;

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="#top">
          <span className="mark" aria-hidden="true" />
          Ashluc Retouch
        </a>
        <div className="langs" role="group" aria-label={t.langLabel}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              aria-pressed={lang.id === locale}
              aria-label={lang.name}
              onClick={() => setLocale(lang.id)}
            >
              {lang.short}
            </button>
          ))}
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>
              <span>{t.title[0]}</span>
              <span>{t.title[1]}</span>
            </h1>
            <p className="lede">{t.lede}</p>
            <div className="actions">
              <a className="btn btn-primary" href="#editor">
                {t.cta}
              </a>
              <a className="btn btn-ghost" href={REPO} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </div>
          </div>
          <dl className="stats">
            {t.stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="block" id="editor">
          <div className="sec-head">
            <h2 className="sec-title">{t.editorKicker}</h2>
            <p className="sec-note">{t.editorNote}</p>
          </div>
          <div className="studio">
            <div className="card editor-card">
              <RetouchEditor source={SAMPLE} locale={locale} onApply={handleApply} />
            </div>

            <aside className="card result" aria-label={t.resultKicker}>
              <div aria-live="polite">
                <h2 className="sec-title sec-title-sm">{t.resultKicker}</h2>
                <p className="sec-note">{t.resultNote}</p>
                {applied ? (
                  <>
                    <figure className="shot">
                      <img
                        src={applied.url}
                        alt={t.resultAlt}
                        width={applied.width}
                        height={applied.height}
                      />
                      <figcaption>
                        {applied.width} × {applied.height} px
                      </figcaption>
                    </figure>
                    <a className="btn btn-primary btn-wide" href={applied.url} download="ashluc-retouch.jpg">
                      {t.download}
                    </a>
                    <p className="kicker kicker-tight">
                      {t.paramsKicker} <span className="count">{t.paramsCount(activeCount)}</span>
                    </p>
                    <dl className="params">
                      {GROUPS.map((group) => {
                        const ids = group.sliders.filter((id) => applied.params[id] !== 0);
                        if (!ids.length) return null;
                        return (
                          <div className="pgroup" key={group.id}>
                            <dt>{t.groups[group.id]}</dt>
                            {ids.map((id) => (
                              <dd key={id}>
                                <span>{id}</span>
                                <b>{signed(applied.params[id])}</b>
                              </dd>
                            ))}
                          </div>
                        );
                      })}
                    </dl>
                    <p className="chips">
                      <span className="chip">
                        {t.lip} {applied.params.lipShade}
                      </span>
                      <span className="chip">
                        {t.rotate} {applied.params.rotate}°
                      </span>
                      <span className="chip">
                        {t.mirror} {applied.params.flip ? t.on : t.off}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="empty">{t.resultEmpty}</p>
                )}
              </div>
            </aside>

            <div className="studio-side">
              <div className="sec-head">
                <h2 className="sec-title">{t.embedKicker}</h2>
                <p className="sec-note">{t.embedNote}</p>
              </div>
              <div className="card embed">
                <pre>
                  <code>{SNIPPET}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="sec-head">
            <h2 className="sec-title">{t.howKicker}</h2>
          </div>
          <div className="cards">
            {t.sections.map((section, index) => (
              <article className="card" key={section.title}>
                <span className="num" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>{t.footNote}</span>
        <span className="pkg">@ashluc/retouch</span>
        <a href={REPO} target="_blank" rel="noreferrer">
          github.com/ckcckchk/ashluc-module-retouch
        </a>
      </footer>
    </div>
  );
}
