/**
 * The retouch editor — preview, tab rail, looks, sliders, shades, heal brush, compare, apply.
 *
 * Every pixel the person sees comes back through `renderRetouch`, and so does the frame `onApply`
 * receives: only `maxEdge` differs, so the preview is the result, not an approximation of it.
 */
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { MAX_EDGE, PREVIEW_EDGE } from '../edge';
import { detectLandmarks } from '../landmarks';
import { renderRetouch } from '../pipeline';
import { buildRegions } from '../regions';
import {
  GROUPS,
  HEAL_RADIUS,
  LIP_SHADES,
  NEUTRAL_PARAMS,
  PRESETS,
  SLIDER_IDS,
  clampParams,
  isNeutral,
  presetParams,
  type FaceRegions,
  type GroupId,
  type HealStroke,
  type RetouchParams,
  type SliderId,
} from '../types';
import { COPY, type Copy, type Locale } from '../copy';
import { HealLayer } from './HealLayer';
import { Slider } from './Slider';

export interface RetouchResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  params: RetouchParams;
}

export type RetouchStatus = 'idle' | 'loading' | 'ready' | 'no-face' | 'failed';

export interface RetouchEditorProps {
  source: string;
  locale?: Locale;
  previewEdge?: number;
  onApply: (result: RetouchResult, params: RetouchParams) => void | Promise<void>;
  onParamsChange?: (params: RetouchParams) => void;
  copy?: Partial<Copy>;
  className?: string;
}

const ROTATIONS: ReadonlyArray<RetouchParams['rotate']> = [0, 90, 180, 270];

export function RetouchEditor({
  source,
  locale = 'zh-HK',
  previewEdge = PREVIEW_EDGE,
  onApply,
  onParamsChange,
  copy,
  className,
}: RetouchEditorProps) {
  const text = useMemo<Copy>(() => (copy ? { ...COPY[locale], ...copy } : COPY[locale]), [locale, copy]);

  const [status, setStatus] = useState<RetouchStatus>(source ? 'loading' : 'idle');
  const [params, setParams] = useState<RetouchParams>(() => ({ ...NEUTRAL_PARAMS }));
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [regions, setRegions] = useState<FaceRegions | null>(null);
  const [detectError, setDetectError] = useState<'load' | 'none' | null>(null);
  const [strokes, setStrokes] = useState<HealStroke[]>([]);
  const [group, setGroup] = useState<GroupId>('shape');
  const [compare, setCompare] = useState(false);
  const [healOn, setHealOn] = useState(false);
  const [brush, setBrush] = useState(Math.round(HEAL_RADIUS * 1000) / 10);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const preview = useRef<HTMLCanvasElement | null>(null);
  const panelId = useId();

  // Load the frame, then measure the face. A rejection with code 'load' means the model never
  // arrived; anything else means the picture has no face to work on.
  useEffect(() => {
    if (!source) {
      setImage(null);
      setStatus('idle');
      return;
    }
    let live = true;
    setStatus('loading');
    setDetectError(null);
    setRegions(null);
    setImage(null);
    setStrokes([]);
    setDone(false);
    setParams({ ...NEUTRAL_PARAMS });

    const frame = new Image();
    frame.crossOrigin = 'anonymous';
    frame.decoding = 'async';
    frame.onload = () => {
      if (!live) return;
      setImage(frame);
      void (async () => {
        try {
          const points = await detectLandmarks(frame);
          if (!live) return;
          if (!points || points.length === 0) {
            setDetectError('none');
            setStatus('no-face');
            return;
          }
          setRegions(buildRegions(points));
          setStatus('ready');
        } catch (error) {
          if (!live) return;
          const load = (error as { code?: string }).code === 'load';
          setDetectError(load ? 'load' : 'none');
          setStatus(load ? 'failed' : 'no-face');
        }
      })();
    };
    frame.onerror = () => {
      if (!live) return;
      setImage(null);
      setStatus('failed');
    };
    frame.src = source;
    return () => {
      live = false;
    };
  }, [source, attempt]);

  // One paint per animation frame, so a drag repaints at most once per vsync.
  useEffect(() => {
    if (!image) return;
    const target = preview.current;
    if (!target) return;
    const handle = requestAnimationFrame(() => {
      try {
        const painted = compare
          ? renderRetouch(
              image,
              { ...NEUTRAL_PARAMS, rotate: params.rotate, flip: params.flip },
              null,
              [],
              previewEdge,
            )
          : renderRetouch(image, params, regions, strokes, previewEdge);
        target.width = painted.width;
        target.height = painted.height;
        target.getContext('2d')?.drawImage(painted, 0, 0);
        setBox((current) =>
          current.w === painted.width && current.h === painted.height
            ? current
            : { w: painted.width, h: painted.height },
        );
      } catch {
        setStatus('failed');
      }
    });
    return () => cancelAnimationFrame(handle);
  }, [image, params, regions, strokes, previewEdge, compare]);

  const notify = useRef(onParamsChange);
  notify.current = onParamsChange;
  useEffect(() => {
    notify.current?.(params);
  }, [params]);

  const update = (patch: Partial<RetouchParams>) => {
    setDone(false);
    setParams((current) => clampParams({ ...current, ...patch }));
  };

  const apply = async () => {
    if (!image || busy) return;
    setBusy(true);
    try {
      const canvas = renderRetouch(image, params, regions, strokes, MAX_EDGE);
      await onApply({ canvas, width: canvas.width, height: canvas.height, params }, params);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      setStatus('failed');
    } finally {
      setBusy(false);
    }
  };

  const active = GROUPS.find((entry) => entry.id === group) ?? GROUPS[0];
  const activePreset = PRESETS.find((preset) =>
    SLIDER_IDS.every((id) => params[id] === (preset.params[id] ?? 0)),
  )?.id;
  const dirty = !isNeutral(params) || strokes.length > 0;
  const aspect = box.w > 0 && box.h > 0 ? box.w / box.h : 0.8;

  const notice =
    status === 'loading'
      ? { tone: 'busy', text: text.detect.searching, retry: false }
      : status === 'no-face'
        ? { tone: 'info', text: text.detect.none, retry: false }
        : status === 'failed'
          ? detectError === 'load'
            ? { tone: 'warn', text: text.detect.failed, retry: true }
            : { tone: 'warn', text: text.failed, retry: false }
          : null;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' || event.defaultPrevented) return;
    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'TEXTAREA') return;
    event.preventDefault();
    void apply();
  };

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = GROUPS.findIndex((entry) => entry.id === group);
    const next = GROUPS[(index + step + GROUPS.length) % GROUPS.length];
    setGroup(next.id);
    document.getElementById(`${panelId}-${next.id}`)?.focus();
  };

  return (
    <section
      className={className ? `rt-root ${className}` : 'rt-root'}
      aria-label={text.title}
      onKeyDown={onKeyDown}
    >
      <header className="rt-head">
        <h2 className="rt-title">{text.title}</h2>
        <p className="rt-lead">{text.lead}</p>
      </header>

      {!source ? (
        <div className="rt-empty">{text.needSource}</div>
      ) : (
        <div className="rt-body">
          <div className="rt-stage">
            <div className="rt-frame" style={{ '--rt-ar': aspect } as CSSProperties}>
              <canvas
                ref={preview}
                className="rt-preview"
                role="img"
                aria-label={compare ? `${text.title} — ${text.compare}` : text.title}
              />
              <HealLayer
                active={healOn}
                radius={brush / 100}
                rotate={params.rotate}
                flip={params.flip}
                onStroke={(stroke) => {
                  setDone(false);
                  setStrokes((current) => [...current, stroke]);
                }}
              />
              {compare && <span className="rt-badge">{text.compare}</span>}
            </div>

            <div className="rt-tools">
              <button
                type="button"
                className="rt-btn"
                aria-pressed={compare}
                aria-label={`${text.compare} — ${text.compareHint}`}
                title={text.compareHint}
                disabled={!image}
                onPointerDown={() => setCompare(true)}
                onPointerUp={() => setCompare(false)}
                onPointerLeave={() => setCompare(false)}
                onPointerCancel={() => setCompare(false)}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    setCompare(true);
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') setCompare(false);
                }}
                onBlur={() => setCompare(false)}
              >
                {text.compare}
              </button>
              <button
                type="button"
                className="rt-btn"
                disabled={!image}
                onClick={() =>
                  update({ rotate: ROTATIONS[(ROTATIONS.indexOf(params.rotate) + 1) % 4] })
                }
              >
                {text.rotate}
              </button>
              <button
                type="button"
                className="rt-btn"
                aria-pressed={params.flip}
                disabled={!image}
                onClick={() => update({ flip: !params.flip })}
              >
                {text.flip}
              </button>
            </div>

            {notice && (
              <p className="rt-notice" data-tone={notice.tone} role="status">
                <span>{notice.text}</span>
                {notice.retry && (
                  <button
                    type="button"
                    className="rt-btn rt-btn--small"
                    onClick={() => setAttempt((current) => current + 1)}
                  >
                    {text.detect.retry}
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="rt-panel">
            <div className="rt-panel__main">
              <div className="rt-tabs" role="tablist" aria-label={text.title} onKeyDown={onTabKey}>
                {GROUPS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    id={`${panelId}-${entry.id}`}
                    className="rt-tab"
                    aria-selected={entry.id === group}
                    aria-controls={panelId}
                    tabIndex={entry.id === group ? 0 : -1}
                    onClick={() => setGroup(entry.id)}
                  >
                    {text.tabs[entry.id]}
                  </button>
                ))}
              </div>

              <div
                className="rt-sheet"
                role="tabpanel"
                id={panelId}
                aria-labelledby={`${panelId}-${group}`}
                tabIndex={-1}
              >
                {!regions && <p className="rt-note rt-note--flag">{text.needFace}</p>}

                <div className="rt-section">
                  <span className="rt-section__label">{text.presetLabel}</span>
                  <div className="rt-presets">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="rt-preset"
                        aria-pressed={activePreset === preset.id}
                        disabled={!regions}
                        onClick={() => {
                          setDone(false);
                          setParams((current) =>
                            clampParams({
                              ...presetParams(preset.id),
                              lipShade: current.lipShade,
                              rotate: current.rotate,
                              flip: current.flip,
                            }),
                          );
                        }}
                      >
                        {text.presets[preset.id]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rt-section">
                  {active.sliders.map((id: SliderId) => (
                    <Slider
                      key={id}
                      label={text.sliders[id]}
                      value={params[id]}
                      zeroLabel={text.neutral}
                      disabled={!regions}
                      onChange={(value) => update({ [id]: value })}
                    />
                  ))}
                </div>

                {group === 'makeup' && (
                  <div className="rt-section">
                    <span className="rt-section__label">{text.shadesLabel}</span>
                    <div className="rt-shades">
                      {LIP_SHADES.map((shade) => (
                        <button
                          key={shade.id}
                          type="button"
                          className="rt-swatch"
                          style={{ background: shade.hex }}
                          aria-pressed={params.lipShade === shade.id}
                          aria-label={text.shades[shade.id]}
                          title={text.shades[shade.id]}
                          disabled={!regions}
                          onClick={() => update({ lipShade: shade.id })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="rt-heal">
                  <div className="rt-heal__head">
                    <button
                      type="button"
                      className="rt-btn"
                      aria-pressed={healOn}
                      disabled={!image}
                      onClick={() => setHealOn((current) => !current)}
                    >
                      {text.heal.toggle}
                    </button>
                    <button
                      type="button"
                      className="rt-btn rt-btn--small"
                      disabled={strokes.length === 0}
                      onClick={() => setStrokes((current) => current.slice(0, -1))}
                    >
                      {text.heal.undo}
                    </button>
                    <button
                      type="button"
                      className="rt-btn rt-btn--small"
                      disabled={strokes.length === 0}
                      onClick={() => setStrokes([])}
                    >
                      {text.heal.clear}
                    </button>
                  </div>
                  <div className="rt-field">
                    <div className="rt-field__head">
                      <label className="rt-field__label" htmlFor={`${panelId}-brush`}>
                        {text.heal.size}
                      </label>
                      <span className="rt-field__value">{brush}</span>
                    </div>
                    <div className="rt-range">
                      <span className="rt-range__track" aria-hidden="true" />
                      <input
                        id={`${panelId}-brush`}
                        className="rt-range__input"
                        type="range"
                        min={1}
                        max={12}
                        step={0.5}
                        value={brush}
                        disabled={!image}
                        onChange={(event) => setBrush(Number(event.target.value))}
                      />
                    </div>
                  </div>
                  <p className="rt-note rt-note--tight">{text.heal.hint}</p>
                </div>

                <p className="rt-note">{text.hint}</p>
              </div>
            </div>

            <div className="rt-actions">
              <button
                type="button"
                className="rt-btn rt-btn--small"
                disabled={!dirty}
                onClick={() => {
                  setDone(false);
                  setStrokes([]);
                  setParams((current) =>
                    clampParams({
                      ...NEUTRAL_PARAMS,
                      lipShade: current.lipShade,
                      rotate: current.rotate,
                      flip: current.flip,
                    }),
                  );
                }}
              >
                {text.reset}
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--small"
                disabled={!dirty}
                onClick={() => {
                  setDone(false);
                  setHealOn(false);
                  setStrokes([]);
                  setParams({ ...NEUTRAL_PARAMS });
                }}
              >
                {text.restore}
              </button>
              <button
                type="button"
                className="rt-btn rt-btn--accent"
                disabled={!image || busy}
                aria-live="polite"
                onClick={() => void apply()}
              >
                {busy ? text.applying : done ? text.applied : text.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
