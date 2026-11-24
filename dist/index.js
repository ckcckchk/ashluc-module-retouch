import { jsx as w, jsxs as I } from "react/jsx-runtime";
import { useRef as V, useEffect as ie, useId as Ie, useMemo as $e, useState as Y } from "react";
const _e = 2048, Ue = 900, He = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm", We = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
function J(e, t, n) {
  const o = new Error(t, n === void 0 ? void 0 : { cause: n });
  return o.code = e, o;
}
let Z = null, se = null, ee = "GPU";
async function Ge() {
  const { FaceLandmarker: e, FilesetResolver: t } = await import("@mediapipe/tasks-vision"), n = await t.forVisionTasks(He), o = (a) => ({
    baseOptions: { modelAssetPath: We, delegate: a },
    runningMode: "IMAGE"
  });
  if (ee === "GPU")
    try {
      return await e.createFromOptions(n, o("GPU"));
    } catch {
      ee = "CPU";
    }
  return e.createFromOptions(n, o("CPU"));
}
function ve() {
  return Z ? Promise.resolve(Z) : (se ??= Ge().then((e) => Z = e).catch((e) => {
    throw J("load", "landmark: the MediaPipe runtime could not load", e);
  }).finally(() => {
    se = null;
  }), se);
}
function Ae() {
  Z?.close(), Z = null, se = null;
}
function qt() {
  Ae(), ee = "GPU";
}
async function Ke(e) {
  if (!e || !(e.width > 0) || !(e.height > 0))
    throw J("load", "landmark: the source has no pixels");
  const t = await ve();
  let n;
  try {
    n = t.detect(e).faceLandmarks[0];
  } catch (o) {
    if (ee !== "GPU") throw J("load", "landmark: detection failed", o);
    ee = "CPU", Ae();
    try {
      n = (await ve()).detect(e).faceLandmarks[0];
    } catch (a) {
      throw J("load", "landmark: detection failed", a);
    }
  }
  if (!n || n.length < 468) throw J("none", "landmark: no face found");
  return n.map(({ x: o, y: a }) => ({ x: o, y: a }));
}
const pe = [
  "slim",
  "vshape",
  "forehead",
  "cheek",
  "facelength",
  "eyesize",
  "eyespace",
  "eyetilt",
  "eyeopen",
  "nosewidth",
  "noselength",
  "nosetip",
  "mouthwidth",
  "lipfull",
  "smile",
  "smooth",
  "whiten",
  "eventone",
  "blush",
  "lipcolor",
  "brow",
  "eyeshadow",
  "contour",
  "eyebright",
  "eyebag",
  "teeth"
], W = [
  { id: "shape", sliders: ["slim", "vshape", "forehead", "cheek", "facelength"] },
  { id: "eyes", sliders: ["eyesize", "eyespace", "eyetilt", "eyeopen"] },
  { id: "nose", sliders: ["nosewidth", "noselength", "nosetip"] },
  { id: "mouth", sliders: ["mouthwidth", "lipfull", "smile"] },
  { id: "skin", sliders: ["smooth", "whiten", "eventone"] },
  { id: "makeup", sliders: ["blush", "lipcolor", "brow", "eyeshadow", "contour"] },
  { id: "local", sliders: ["eyebright", "eyebag", "teeth"] }
], ge = [
  { id: "rose", hex: "#c0555f" },
  { id: "coral", hex: "#d0714a" },
  { id: "plum", hex: "#8e3a58" },
  { id: "nude", hex: "#b57a6d" }
], je = (e) => ge.find((t) => t.id === e)?.hex ?? "#c0555f", q = {
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
  lipShade: "rose",
  rotate: 0,
  flip: !1
}, qe = 0.035, me = [
  {
    id: "natural",
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
      teeth: 6
    }
  },
  {
    id: "refined",
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
      teeth: 12
    }
  },
  {
    id: "glam",
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
      smooth: 58,
      whiten: 24,
      eventone: 38,
      blush: 28,
      lipcolor: 34,
      brow: 22,
      eyeshadow: 24,
      contour: 24,
      eyebright: 28,
      eyebag: 22,
      teeth: 20
    }
  },
  {
    id: "fresh",
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
      teeth: 10
    }
  },
  {
    id: "male",
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
      eyebag: 12
    }
  }
];
function Ve(e) {
  const t = me.find((n) => n.id === e);
  return G(t?.params ?? {});
}
const Qe = (e, t) => Number.isFinite(e) ? Math.min(100, Math.max(-100, Math.round(e * 10) / 10)) : t;
function G(e) {
  const t = e ?? {}, n = { ...q };
  for (const o of pe) n[o] = Qe(t[o] ?? 0, 0);
  return n.lipShade = ge.some((o) => o.id === t.lipShade) ? t.lipShade : "rose", n.rotate = t.rotate === 90 || t.rotate === 180 || t.rotate === 270 ? t.rotate : 0, n.flip = t.flip === !0, n;
}
function Je(e) {
  const t = G(e);
  return pe.every((n) => t[n] === 0) && t.rotate === 0 && !t.flip;
}
function Q(e, t) {
  return t.some((n) => e[n] !== 0);
}
function Ze(e) {
  const t = G(e);
  return {
    geometry: Q(t, [
      "slim",
      "vshape",
      "forehead",
      "cheek",
      "facelength",
      "eyesize",
      "eyespace",
      "eyetilt",
      "eyeopen",
      "nosewidth",
      "noselength",
      "nosetip",
      "mouthwidth",
      "lipfull",
      "smile"
    ]),
    skin: Q(t, ["smooth", "whiten", "eventone"]),
    makeup: Q(t, ["blush", "lipcolor", "brow", "eyeshadow", "contour"]),
    local: Q(t, ["eyebright", "eyebag", "teeth"])
  };
}
const D = (e) => Math.max(-1, Math.min(1, (Number.isFinite(e) ? e : 0) / 100)), et = [-1, 1], Ne = (e, t) => Math.hypot(e.x - t.x, e.y - t.y);
function Re(e) {
  if (e.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let t = 1 / 0, n = 1 / 0, o = -1 / 0, a = -1 / 0;
  for (const i of e)
    i.x < t && (t = i.x), i.y < n && (n = i.y), i.x > o && (o = i.x), i.y > a && (a = i.y);
  return { minX: t, minY: n, maxX: o, maxY: a };
}
function tt(e, t, n) {
  let o = 0, a = 0;
  for (const i of e) {
    const r = (t - i.x) / i.rx, s = (n - i.y) / i.ry, c = r * r + s * s;
    if (c >= 1) continue;
    const l = (1 - c) * (1 - c);
    i.kind === "shift" ? (o += i.ax * l, a += i.ay * l) : i.kind === "scale" ? (o += i.ax * (t - i.x) * l, a += i.ay * (n - i.y) * l) : a += i.ax * (t - i.x) * l;
  }
  return { dx: o, dy: a };
}
function nt(e, t) {
  const n = Re(e.oval), o = Math.max(1e-3, n.maxX - n.minX), a = Math.max(1e-3, n.maxY - n.minY), i = (n.minX + n.maxX) / 2, r = (e.cheekLeft.y + e.cheekRight.y + 2 * e.chin.y) / 4, s = Math.max(1e-3, Ne(e.noseWingLeft, e.noseWingRight)), c = Re(e.lipOuter), l = Math.max(1e-3, c.maxX - c.minX), u = Math.max(1e-3, c.maxY - c.minY), f = (c.minX + c.maxX) / 2, h = (c.minY + c.maxY) / 2, m = [], y = D(t.slim), g = D(t.vshape);
  for (const M of et) {
    if (y) {
      const S = M < 0 ? n.minX : n.maxX;
      m.push({ kind: "shift", x: S, y: r, rx: o * 0.7, ry: a * 0.22, ax: -M * o * 0.055 * y, ay: 0 });
    }
    if (g) {
      const S = i + M * o * 0.28, z = e.chin.y - a * 0.08;
      m.push({ kind: "shift", x: S, y: z, rx: o * 0.5, ry: a * 0.18, ax: -M * o * 0.05 * g, ay: 0 });
    }
  }
  const v = D(t.cheek);
  v && (m.push({ kind: "shift", x: e.cheekLeft.x, y: e.cheekLeft.y, rx: o * 0.32, ry: a * 0.18, ax: o * 0.035 * v, ay: 0 }), m.push({ kind: "shift", x: e.cheekRight.x, y: e.cheekRight.y, rx: o * 0.32, ry: a * 0.18, ax: -o * 0.035 * v, ay: 0 }));
  const x = D(t.forehead);
  if (x) {
    const M = e.foreheadTop.x, S = e.foreheadTop.y;
    m.push({ kind: "shift", x: M, y: S, rx: o * 0.5, ry: a * 0.2, ax: 0, ay: -a * 0.05 * x });
  }
  const k = D(t.facelength);
  k && (m.push({ kind: "shift", x: i, y: n.minY, rx: o * 0.6, ry: a * 0.22, ax: 0, ay: -a * 0.045 * k }), m.push({ kind: "shift", x: e.chin.x, y: e.chin.y, rx: o * 0.45, ry: a * 0.16, ax: 0, ay: a * 0.05 * k }));
  const E = D(t.eyesize), p = D(t.eyespace), R = D(t.eyetilt), b = D(t.eyeopen), L = [
    { c: e.eyeLeftCenter, i: e.eyeLeftInner, o: e.eyeLeftOuter },
    { c: e.eyeRightCenter, i: e.eyeRightInner, o: e.eyeRightOuter }
  ];
  for (const M of L) {
    const S = Math.max(1e-3, Ne(M.i, M.o)), z = Math.sign(M.o.x - M.c.x) || 1, X = Math.sign(M.c.x - i) || 1;
    E && m.push({ kind: "scale", x: M.c.x, y: M.c.y, rx: S * 1.4, ry: S * 0.8, ax: 0.3 * E, ay: 0.3 * E }), p && m.push({ kind: "shift", x: M.c.x, y: M.c.y, rx: S * 2, ry: S * 1.2, ax: X * o * 0.025 * p, ay: 0 }), R && m.push({ kind: "shear", x: M.c.x, y: M.c.y, rx: S * 1.6, ry: S, ax: -0.7 * R * z, ay: 0 }), b && m.push({ kind: "scale", x: M.c.x, y: M.c.y + S * 0.45, rx: S * 1.4, ry: S * 0.9, ax: 0.06 * b, ay: 0.3 * b });
  }
  const C = D(t.nosewidth);
  if (C) {
    const M = s / 2;
    m.push({ kind: "shift", x: e.noseWingLeft.x, y: e.noseWingLeft.y, rx: M * 1.15, ry: M * 0.95, ax: M * 0.3 * C, ay: 0 }), m.push({ kind: "shift", x: e.noseWingRight.x, y: e.noseWingRight.y, rx: M * 1.15, ry: M * 0.95, ax: -M * 0.3 * C, ay: 0 });
  }
  const P = D(t.noselength);
  if (P) {
    const M = e.noseTip.x, S = (e.noseTip.y + e.noseBridgeBottom.y) / 2;
    m.push({ kind: "shift", x: M, y: S, rx: s * 0.85, ry: a * 0.1, ax: 0, ay: -a * 0.025 * P });
  }
  const _ = D(t.nosetip);
  _ && m.push({ kind: "scale", x: e.noseTip.x, y: e.noseTip.y, rx: s * 0.62, ry: s * 0.62, ax: -0.22 * _, ay: -0.18 * _ });
  const F = D(t.mouthwidth);
  F && (m.push({ kind: "shift", x: e.mouthLeft.x, y: e.mouthLeft.y, rx: l * 0.32, ry: u * 1.1, ax: -l * 0.15 * F, ay: 0 }), m.push({ kind: "shift", x: e.mouthRight.x, y: e.mouthRight.y, rx: l * 0.32, ry: u * 1.1, ax: l * 0.15 * F, ay: 0 }));
  const A = D(t.lipfull);
  A && m.push({ kind: "scale", x: f, y: h, rx: l * 0.72, ry: u * 1.2, ax: 0.08 * A, ay: 0.32 * A });
  const O = D(t.smile);
  return O && (m.push({ kind: "shift", x: e.mouthLeft.x, y: e.mouthLeft.y, rx: l * 0.3, ry: u * 1.1, ax: -l * 0.04 * O, ay: -u * 0.35 * O }), m.push({ kind: "shift", x: e.mouthRight.x, y: e.mouthRight.y, rx: l * 0.3, ry: u * 1.1, ax: l * 0.04 * O, ay: -u * 0.35 * O })), m;
}
function ot(e, t, n) {
  const o = Math.max(2, t), a = Math.max(2, n), i = new Float32Array(o * a), r = new Float32Array(o * a);
  for (let s = 0; s < a; s++) {
    const c = s / (a - 1);
    for (let l = 0; l < o; l++) {
      const u = tt(e, l / (o - 1), c);
      i[s * o + l] = u.dx, r[s * o + l] = u.dy;
    }
  }
  return { cols: o, rows: a, dx: i, dy: r };
}
function at(e, t, n, o = { dx: 0, dy: 0 }) {
  const a = Math.min(e.cols - 1, Math.max(0, t * (e.cols - 1))), i = Math.min(e.rows - 1, Math.max(0, n * (e.rows - 1))), r = Math.min(e.cols - 2, Math.floor(a)), s = Math.min(e.rows - 2, Math.floor(i)), c = a - r, l = i - s, u = s * e.cols + r, f = u + 1, h = u + e.cols, m = h + 1, y = e.dx[u] + (e.dx[f] - e.dx[u]) * c, g = e.dx[h] + (e.dx[m] - e.dx[h]) * c, v = e.dy[u] + (e.dy[f] - e.dy[u]) * c, x = e.dy[h] + (e.dy[m] - e.dy[h]) * c;
  return o.dx = y + (g - y) * l, o.dy = v + (x - v) * l, o;
}
const ae = (e, t, n) => e < t ? t : e > n ? n : e;
function it(e, t, n) {
  const o = nt(t, n);
  if (o.length === 0) return e;
  const { width: a, height: i, data: r } = e;
  if (a < 2 || i < 2) return e;
  const s = new ImageData(new Uint8ClampedArray(r.length), a, i), c = s.data, l = Math.max(4, Math.round(Math.min(a, i) / 160)), u = ot(o, Math.ceil(a / l) + 1, Math.ceil(i / l) + 1), f = { dx: 0, dy: 0 };
  for (let h = 0; h < i; h++) {
    const m = (h + 0.5) / i;
    for (let y = 0; y < a; y++) {
      const g = (h * a + y) * 4;
      if (at(u, (y + 0.5) / a, m, f), f.dx === 0 && f.dy === 0) {
        c[g] = r[g], c[g + 1] = r[g + 1], c[g + 2] = r[g + 2], c[g + 3] = r[g + 3];
        continue;
      }
      const v = ((y + 0.5) / a - f.dx) * a - 0.5, x = (m - f.dy) * i - 0.5, k = ae(Math.floor(v), 0, a - 1), E = ae(Math.floor(x), 0, i - 1), p = Math.min(a - 1, k + 1), R = Math.min(i - 1, E + 1), b = ae(v - k, 0, 1), L = ae(x - E, 0, 1), C = (E * a + k) * 4, P = (E * a + p) * 4, _ = (R * a + k) * 4, F = (R * a + p) * 4;
      for (let A = 0; A < 4; A++) {
        const O = r[C + A] + (r[P + A] - r[C + A]) * b, M = r[_ + A] + (r[F + A] - r[_ + A]) * b;
        c[g + A] = O + (M - O) * L;
      }
    }
  }
  return s;
}
function de(e, t, n, o, a, i, r = 0.7) {
  const s = Math.hypot((e - n) / Math.max(1e-6, a), (t - o) / Math.max(1e-6, i));
  if (s >= 1) return 0;
  if (s <= r) return 1;
  const c = (s - r) / (1 - r);
  return 1 - c * c * (3 - 2 * c);
}
function ue(e) {
  if (e.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let t = 1 / 0, n = 1 / 0, o = -1 / 0, a = -1 / 0;
  for (const i of e)
    i.x < t && (t = i.x), i.y < n && (n = i.y), i.x > o && (o = i.x), i.y > a && (a = i.y);
  return { minX: t, minY: n, maxX: o, maxY: a };
}
function st(e, t, n) {
  const o = ue(e.oval), a = Math.max(1e-3, (o.maxX - o.minX) / 2), i = Math.max(1e-3, (o.maxY - o.minY) / 2);
  let r = de(t, n, (o.minX + o.maxX) / 2, (o.minY + o.maxY) / 2, a, i, 0.74);
  if (r <= 0) return 0;
  for (const c of [e.eyeLeft, e.eyeRight, e.browLeft, e.browRight]) {
    const l = ue(c), u = (l.minX + l.maxX) / 2, f = (l.minY + l.maxY) / 2;
    if (r *= 1 - de(t, n, u, f, (l.maxX - l.minX) / 2 * 1.1, (l.maxY - l.minY) / 2 * 1.7, 0.5), r <= 0) return 0;
  }
  const s = ue(e.lipOuter);
  return r *= 1 - de(t, n, (s.minX + s.maxX) / 2, (s.minY + s.maxY) / 2, (s.maxX - s.minX) / 2 * 0.95, (s.maxY - s.minY) / 2, 0.5), r > 0 ? r : 0;
}
function rt(e, t, n, o) {
  const a = Math.ceil(t / o) + 1, i = Math.ceil(n / o) + 1, r = new Float32Array(a * i);
  for (let s = 0; s < i; s++) {
    const c = (s * o + 0.5) / n;
    for (let l = 0; l < a; l++) r[s * a + l] = st(e, (l * o + 0.5) / t, c);
  }
  return { cols: a, rows: i, data: r };
}
function lt(e, t, n) {
  const o = Math.min(e.cols - 1, Math.max(0, t)), a = Math.min(e.rows - 1, Math.max(0, n)), i = Math.min(e.cols - 2, Math.floor(o)), r = Math.min(e.rows - 2, Math.floor(a)), s = o - i, c = a - r, l = r * e.cols + i, u = e.data[l] + (e.data[l + 1] - e.data[l]) * s, f = e.data[l + e.cols] + (e.data[l + e.cols + 1] - e.data[l + e.cols]) * s;
  return u + (f - u) * c;
}
function ct(e) {
  const n = 1 - 0.42 * Math.max(0, Math.min(1, Number.isFinite(e) ? e : 0)), o = new Uint8Array(256);
  for (let a = 0; a < 256; a++) o[a] = Math.round(255 * Math.pow(a / 255, n));
  return o;
}
function ht(e, t, n) {
  const o = Math.max(0, Math.min(1, Math.abs(n)));
  return Math.max(1, Math.round(Math.min(e, t) * 0.01 * o));
}
function Le(e) {
  return 1 - Math.min(1, Math.abs(e) / 48);
}
function dt(e, t) {
  if (typeof document > "u") return null;
  const { width: n, height: o } = e, a = document.createElement("canvas");
  a.width = n, a.height = o;
  const i = document.createElement("canvas");
  i.width = n, i.height = o;
  const r = a.getContext("2d"), s = i.getContext("2d");
  return !r || !s || (r.putImageData(e, 0, 0), s.filter = `blur(${t}px)`, s.filter === "none") ? null : (s.drawImage(a, 0, 0), s.getImageData(0, 0, n, o));
}
function ut(e, t, n) {
  const o = Math.max(0, Math.min(100, n.smooth)) / 100, a = Math.max(0, Math.min(100, n.whiten)) / 100, i = Math.max(0, Math.min(100, n.eventone)) / 100;
  if (o === 0 && a === 0 && i === 0) return e;
  const { width: r, height: s, data: c } = e;
  if (r < 2 || s < 2) return e;
  const l = new ImageData(new Uint8ClampedArray(c), r, s), u = l.data, f = Math.max(2, Math.round(Math.min(r, s) / 220)), h = rt(t, r, s, f), y = (o > 0 || i > 0 ? dt(e, ht(r, s, Math.max(o, i))) : null)?.data ?? null, g = a > 0 ? ct(a) : null, v = o * 0.88, x = r * 4;
  for (let k = 0; k < s; k++) {
    const E = k / f;
    for (let p = 0; p < r; p++) {
      const R = lt(h, p / f, E);
      if (R <= 2e-3) continue;
      const b = (k * r + p) * 4;
      let L = c[b], C = c[b + 1], P = c[b + 2];
      if (y) {
        if (v > 0) {
          const _ = p < r - 1 ? b + 4 : b - 4, F = p > 0 ? b - 4 : b + 4, A = k < s - 1 ? b + x : b - x, O = k > 0 ? b - x : b + x, M = (X) => 0.299 * c[X] + 0.587 * c[X + 1] + 0.114 * c[X + 2], S = Le(M(_) - M(F)) * Le(M(A) - M(O)), z = R * v * S;
          L += (y[b] - L) * z, C += (y[b + 1] - C) * z, P += (y[b + 2] - P) * z;
        }
        if (i > 0) {
          const _ = R * i * 0.85;
          L += (y[b] - L) * _, C += (y[b + 1] - C) * _ * 0.45, P += (y[b + 2] - P) * _ * 0.35;
        }
      }
      if (g) {
        const _ = R * a;
        L += (g[L + 0.5 | 0] - L) * _, C += (g[C + 0.5 | 0] - C) * _, P += (g[P + 0.5 | 0] - P) * _;
      }
      u[b] = L, u[b + 1] = C, u[b + 2] = P;
    }
  }
  return l;
}
const ft = ["blush", "lipcolor", "brow", "eyeshadow", "contour"], mt = (e) => {
  const t = e.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(t)) return [0, 0, 0];
  const n = Number.parseInt(t, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}, K = (e, t) => {
  const [n, o, a] = mt(e);
  return `rgba(${n}, ${o}, ${a}, ${Math.min(1, Math.max(0, t))})`;
}, U = (e, t) => (Number.isFinite(e) ? Math.min(1, Math.abs(e) / 100) : 0) * t, re = (e) => {
  if (e.length === 0) return { cx: 0.5, cy: 0.5, w: 0, h: 0 };
  let t = e[0].x, n = t, o = e[0].y, a = o;
  for (const i of e)
    t = Math.min(t, i.x), n = Math.max(n, i.x), o = Math.min(o, i.y), a = Math.max(a, i.y);
  return { cx: (t + n) / 2, cy: (o + a) / 2, w: n - t, h: a - o };
}, xe = (e, t, n) => ({
  x: e.x + (t.x - e.x) * n,
  y: e.y + (t.y - e.y) * n
}), te = (e, t, n) => ({
  x: e.x * t,
  y: e.y * n
}), j = (e, t, n) => e.map((o) => te(o, t, n)), ye = (e, t) => {
  if (t.length < 3) return !1;
  e.moveTo(t[0].x, t[0].y);
  for (let n = 1; n < t.length; n += 1) e.lineTo(t[n].x, t[n].y);
  return e.closePath(), !0;
}, le = (e, t) => (e.beginPath(), ye(e, t)), ce = (e, t, n, o) => le(e, j(t, n, o)) ? (e.clip(), !0) : !1, he = (e, t, n, o, a) => {
  if (o <= 0 || t.r <= 0) return;
  const i = e.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
  i.addColorStop(0, K(n, 0.9)), i.addColorStop(0.5, K(n, 0.45)), i.addColorStop(1, K(n, 0)), e.globalCompositeOperation = a, e.globalAlpha = o, e.fillStyle = i, e.beginPath(), e.arc(t.x, t.y, t.r, 0, Math.PI * 2), e.fill(), e.globalAlpha = 1;
}, Pe = (e, t) => {
  const n = document.createElement("canvas");
  n.width = e.width, n.height = e.height;
  const o = n.getContext("2d");
  return o ? (o.putImageData(e, 0, 0), t(o, e.width, e.height), o.getImageData(0, 0, e.width, e.height)) : e;
};
function yt(e, t, n) {
  const o = Math.max(3, re(e.oval).w * t * 0.26);
  return [e.cheekLeft, e.cheekRight].map((a) => ({ ...te(a, t, n), r: o }));
}
function pt(e, t, n) {
  const o = Math.max(3, re(e.oval).w * t * 0.2);
  return [e.cheekLeft, e.cheekRight].map((a) => ({
    ...te(xe(a, e.chin, 0.42), t, n),
    r: o
  }));
}
function gt(e, t, n, o, a) {
  const i = Math.hypot((t.x - n.x) * o, (t.y - n.y) * a), r = Math.max(1, i * 0.16);
  return [t, n].map((s) => ({ ...te(xe(e, s, 0.4), o, a), r }));
}
function xt(e, t, n, o, a) {
  if (e.save(), !ce(e, t.oval, n, o)) {
    e.restore();
    return;
  }
  for (const i of yt(t, n, o)) he(e, i, "#e0787d", a, "soft-light");
  e.restore();
}
function bt(e, t, n, o, a, i) {
  const r = j(t.lipOuter, n, o), s = j(t.lipInner, n, o);
  r.length < 3 || (e.save(), e.beginPath(), ye(e, r), ye(e, s), e.globalCompositeOperation = "multiply", e.globalAlpha = a, e.fillStyle = K(i, 1), e.fill("evenodd"), e.restore());
}
function wt(e, t, n, o, a) {
  e.save(), e.globalCompositeOperation = "multiply", e.globalAlpha = a, e.fillStyle = "#6a4a3a";
  for (const i of [t.browLeft, t.browRight])
    le(e, j(i, n, o)) && e.fill();
  e.restore();
}
function Mt(e, t, n, o, a) {
  const i = "#8a5f58";
  for (const r of [t.eyeLeft, t.eyeRight]) {
    const s = j(r, n, o), c = re(s);
    if (c.h <= 0) continue;
    if (e.save(), !le(e, s)) {
      e.restore();
      continue;
    }
    e.clip();
    const l = e.createLinearGradient(c.cx, c.cy - c.h / 2, c.cx, c.cy + c.h / 2);
    l.addColorStop(0, K(i, 0.95)), l.addColorStop(0.55, K(i, 0.45)), l.addColorStop(0.78, K(i, 0)), e.globalCompositeOperation = "soft-light", e.globalAlpha = a, e.fillStyle = l, e.fillRect(c.cx - c.w / 2, c.cy - c.h / 2, c.w, c.h), e.restore();
  }
}
function kt(e, t, n, o, a) {
  if (e.save(), !ce(e, t.oval, n, o)) {
    e.restore();
    return;
  }
  for (const i of pt(t, n, o)) he(e, i, "#7a5148", a, "multiply");
  e.restore();
}
function vt(e, t, n) {
  if (!Q(n, ft)) return e;
  const o = U(n.blush, 0.26), a = U(n.lipcolor, 0.45), i = U(n.brow, 0.28), r = U(n.eyeshadow, 0.34), s = U(n.contour, 0.22), c = je(n.lipShade);
  return Pe(e, (l, u, f) => {
    s > 0 && kt(l, t, u, f, s), o > 0 && xt(l, t, u, f, o), r > 0 && Mt(l, t, u, f, r), i > 0 && wt(l, t, u, f, i), a > 0 && bt(l, t, u, f, a, c);
  });
}
const Nt = ["eyebright", "eyebag", "teeth"];
function Rt(e, t, n, o, a) {
  const i = [
    [t.eyeLeft, t.eyeLeftCenter, t.eyeLeftInner, t.eyeLeftOuter],
    [t.eyeRight, t.eyeRightCenter, t.eyeRightInner, t.eyeRightOuter]
  ];
  for (const [r, s, c, l] of i) {
    if (e.save(), ce(e, r, n, o))
      for (const u of gt(s, c, l, n, o))
        he(e, u, "#ffffff", a, "screen");
    e.restore();
  }
}
function Lt(e, t, n, o, a) {
  const i = Math.max(3, re(t.oval).w * n * 0.16);
  if (e.save(), !ce(e, t.oval, n, o)) {
    e.restore();
    return;
  }
  for (const r of [t.underEyeLeft, t.underEyeRight])
    he(e, { ...te(r, n, o), r: i }, "#ffd9c8", a, "soft-light");
  e.restore();
}
function Ct(e, t, n, o, a) {
  e.save(), le(e, j(t.teeth, n, o)) && (e.globalCompositeOperation = "screen", e.globalAlpha = a, e.fillStyle = "#eef4ff", e.fill()), e.restore();
}
function St(e, t, n) {
  if (!Q(n, Nt)) return e;
  const o = U(n.eyebright, 0.34), a = U(n.eyebag, 0.5), i = U(n.teeth, 0.42);
  return Pe(e, (r, s, c) => {
    o > 0 && Rt(r, t, s, c, o), a > 0 && Lt(r, t, s, c, a), i > 0 && Ct(r, t, s, c, i);
  });
}
const Et = (e, t) => {
  if (t <= 0) return 0;
  const n = Math.min(1, Math.max(0, e / t));
  return 1 - n * n * (3 - 2 * n);
};
function It(e, t) {
  if (e.length === 0) return [];
  const n = Math.max(0.5, t), o = [e[0]];
  for (let a = 1; a < e.length; a += 1) {
    const i = e[a - 1], r = e[a], s = Math.hypot(r.x - i.x, r.y - i.y);
    if (s === 0) continue;
    const c = Math.floor(s / n);
    for (let l = 1; l <= c; l += 1) o.push(xe(i, r, l * n / s));
    c * n < s - 0.5 && o.push(r);
  }
  return o;
}
function _t(e, t, n, o, a, i, r = 24) {
  let s = 0, c = 0, l = 0, u = 0;
  for (let y = 0; y < r; y += 1) {
    const g = y / r * Math.PI * 2, v = Math.round(o + Math.cos(g) * i * 1.3), x = Math.round(a + Math.sin(g) * i * 1.3);
    if (v < 0 || x < 0 || v >= t || x >= n) continue;
    const k = (x * t + v) * 4;
    s += e[k], c += e[k + 1], l += e[k + 2], u += 1;
  }
  if (u > 0) return [s / u, c / u, l / u];
  const f = Math.min(t - 1, Math.max(0, Math.round(o))), m = (Math.min(n - 1, Math.max(0, Math.round(a))) * t + f) * 4;
  return [e[m], e[m + 1], e[m + 2]];
}
function At(e, t, n, o, a, i, r) {
  const [s, c, l] = _t(t, n, o, a, i, r), u = Math.max(0, Math.floor(a - r)), f = Math.min(n - 1, Math.ceil(a + r)), h = Math.max(0, Math.floor(i - r)), m = Math.min(o - 1, Math.ceil(i + r));
  for (let y = h; y <= m; y += 1)
    for (let g = u; g <= f; g += 1) {
      const v = Math.hypot(g - a, y - i);
      if (v >= r) continue;
      const x = Et(v, r) * 0.92, k = (y * n + g) * 4;
      e[k] += (s - e[k]) * x, e[k + 1] += (c - e[k + 1]) * x, e[k + 2] += (l - e[k + 2]) * x;
    }
}
function Pt(e, t) {
  if (t.length === 0) return e;
  const { width: n, height: o } = e, a = new Uint8ClampedArray(e.data), i = Math.min(n, o);
  for (const r of t) {
    if (r.points.length === 0) continue;
    const s = Math.min(0.12, Math.max(0.01, r.radius)) * i, c = It(j(r.points, n, o), s * 0.5);
    for (const l of c) At(a, e.data, n, o, l.x, l.y, s);
  }
  return new ImageData(a, n, o);
}
function Tt(e, t, n) {
  return n % 180 === 0 ? { width: e, height: t } : { width: t, height: e };
}
function fe(e, t, n, o = [], a = _e) {
  const i = G(t), r = Math.max(e.width, e.height), s = Math.min(1, a / Math.max(1, r)), c = Math.max(1, Math.round(e.width * s)), l = Math.max(1, Math.round(e.height * s)), u = document.createElement("canvas");
  u.width = c, u.height = l;
  const f = u.getContext("2d");
  if (!f) throw new Error("no_canvas");
  f.imageSmoothingQuality = "high", f.fillStyle = "#ffffff", f.fillRect(0, 0, c, l), f.drawImage(e, 0, 0, c, l);
  const h = Ze(i);
  if (!!n && (h.skin || h.makeup || h.local || h.geometry) || o.length > 0) {
    let x = f.getImageData(0, 0, c, l);
    n && (h.skin && (x = ut(x, n, i)), h.makeup && (x = vt(x, n, i)), h.local && (x = St(x, n, i))), o.length > 0 && (x = Pt(x, o)), n && h.geometry && (x = it(x, n, i)), f.putImageData(x, 0, 0);
  }
  if (i.rotate === 0 && !i.flip) return u;
  const y = Tt(c, l, i.rotate), g = document.createElement("canvas");
  g.width = y.width, g.height = y.height;
  const v = g.getContext("2d");
  if (!v) throw new Error("no_canvas");
  return v.imageSmoothingQuality = "high", v.translate(y.width / 2, y.height / 2), i.flip && v.scale(-1, 1), v.rotate(i.rotate * Math.PI / 180), v.drawImage(u, -c / 2, -l / 2), g;
}
const Dt = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], Xt = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], Yt = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466], Ot = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46], Ft = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276], zt = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185], Bt = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191], Ce = 0.9, $t = 0.12, $ = (e) => e < 0 ? 0 : e > 1 ? 1 : e;
function Ut(e) {
  if (e.length < 468)
    throw new Error(`buildRegions: the FaceLandmarker returns 468 points, got ${e.length}`);
  const t = (p) => ({ x: $(e[p].x), y: $(e[p].y) }), n = (p) => p.map(t), o = (p, R) => ({
    x: $((p.x + R.x) / 2),
    y: $((p.y + R.y) / 2)
  }), a = (p, R, b) => ({
    x: $(p.x + (R.x - p.x) * b),
    y: $(p.y + (R.y - p.y) * b)
  }), i = (p) => ({
    x: p.reduce((R, b) => R + b.x, 0) / p.length,
    y: p.reduce((R, b) => R + b.y, 0) / p.length
  }), r = n(Dt), s = t(152), c = o(t(46), t(276)), l = t(10), u = {
    x: $(l.x + (l.x - c.x) * Ce),
    y: $(l.y + (l.y - c.y) * Ce)
  }, f = n(Xt), h = n(Yt), m = e.length > 473, y = m ? t(468) : i(f), g = m ? t(473) : i(h), v = (p, R) => {
    const b = Math.max(...p.map((C) => C.y)), L = b - Math.min(...p.map((C) => C.y));
    return { x: R.x, y: $(b + L * 0.35) };
  }, x = n(Bt), k = i(x), E = x.slice(0, 11).map((p) => a(p, k, $t));
  return {
    oval: r,
    jawLeft: [r[0], ...r.slice(19).reverse(), s],
    jawRight: [...r.slice(0, 18), s],
    chin: s,
    foreheadTop: u,
    foreheadCenter: o(u, c),
    cheekLeft: t(50),
    cheekRight: t(280),
    eyeLeft: f,
    eyeRight: h,
    eyeLeftCenter: y,
    eyeRightCenter: g,
    eyeLeftInner: t(133),
    eyeLeftOuter: t(33),
    eyeRightInner: t(362),
    eyeRightOuter: t(263),
    browLeft: n(Ot),
    browRight: n(Ft),
    underEyeLeft: v(f, y),
    underEyeRight: v(h, g),
    noseTip: t(1),
    noseWingLeft: t(129),
    noseWingRight: t(358),
    noseBridgeTop: t(168),
    noseBridgeBottom: t(2),
    lipOuter: n(zt),
    lipInner: x,
    mouthLeft: t(61),
    mouthRight: t(291),
    teeth: E
  };
}
const Se = {
  en: {
    title: "Retouch",
    lead: "Shape, skin, makeup and blemish repair — every pass runs on this device.",
    tabs: {
      shape: "Shape",
      eyes: "Eyes",
      nose: "Nose",
      mouth: "Mouth",
      skin: "Skin",
      makeup: "Makeup",
      local: "Local"
    },
    sliders: {
      slim: "Slim",
      vshape: "Chin",
      forehead: "Forehead",
      cheek: "Cheekbone",
      facelength: "Face length",
      eyesize: "Eyes",
      eyespace: "Eye space",
      eyetilt: "Eye tilt",
      eyeopen: "Eye height",
      nosewidth: "Nose width",
      noselength: "Nose length",
      nosetip: "Nose tip",
      mouthwidth: "Mouth width",
      lipfull: "Lip fullness",
      smile: "Smile",
      smooth: "Smooth",
      whiten: "Whiten",
      eventone: "Even tone",
      blush: "Blush",
      lipcolor: "Lip colour",
      brow: "Brow",
      eyeshadow: "Eyeshadow",
      contour: "Contour",
      eyebright: "Brighten",
      eyebag: "Eye bags",
      teeth: "Teeth"
    },
    presets: { natural: "Natural", refined: "Refined", glam: "Glam", fresh: "Fresh", male: "Male" },
    presetLabel: "Look",
    shadesLabel: "Lip shade",
    shades: { rose: "Rose", coral: "Coral", plum: "Plum", nude: "Nude" },
    compare: "Compare",
    compareHint: "Hold to see the original",
    rotate: "Rotate",
    flip: "Mirror",
    reset: "Reset",
    restore: "Restore",
    apply: "Apply",
    applying: "Applying…",
    applied: "Applied",
    neutral: "Neutral",
    hint: "Drag a control to tune it; hold Compare for the original.",
    heal: {
      toggle: "Heal",
      size: "Brush",
      undo: "Undo",
      clear: "Clear",
      hint: "Brush over a blemish to lift it."
    },
    detect: {
      searching: "Finding the face…",
      none: "No face detected — heal and apply still work.",
      failed: "Face detection did not load.",
      retry: "Try again"
    },
    needFace: "No face in this photo, so shape, skin and makeup stay off. Heal and Apply still work.",
    failed: "The frame could not be retouched. Try again.",
    needSource: "Choose a photo to retouch."
  },
  "zh-HK": {
    title: "人像美容",
    lead: "調整輪廓、膚質與妝容，並修復細小瑕疵；所有處理均在本機完成。",
    tabs: {
      shape: "形體",
      eyes: "眼睛",
      nose: "鼻子",
      mouth: "嘴巴",
      skin: "皮膚",
      makeup: "妝容",
      local: "局部"
    },
    sliders: {
      slim: "瘦臉",
      vshape: "尖下巴",
      forehead: "額頭",
      cheek: "顴骨",
      facelength: "臉長",
      eyesize: "大眼",
      eyespace: "眼距",
      eyetilt: "眼尾",
      eyeopen: "眼高",
      nosewidth: "鼻翼",
      noselength: "鼻長",
      nosetip: "鼻頭",
      mouthwidth: "嘴寬",
      lipfull: "唇厚",
      smile: "嘴角",
      smooth: "磨皮",
      whiten: "美白",
      eventone: "勻膚",
      blush: "腮紅",
      lipcolor: "唇彩",
      brow: "眉",
      eyeshadow: "眼影",
      contour: "修容",
      eyebright: "亮眼",
      eyebag: "去眼袋",
      teeth: "牙齒"
    },
    presets: { natural: "自然", refined: "精緻", glam: "網紅", fresh: "清新", male: "男神" },
    presetLabel: "風格",
    shadesLabel: "唇色",
    shades: { rose: "玫瑰", coral: "珊瑚", plum: "梅子", nude: "裸色" },
    compare: "對比",
    compareHint: "按住以查看原圖",
    rotate: "旋轉",
    flip: "鏡像",
    reset: "重設",
    restore: "還原",
    apply: "套用",
    applying: "套用中…",
    applied: "已套用",
    neutral: "歸零",
    hint: "左右拖動即可調整；按住「對比」可查看原圖。",
    heal: {
      toggle: "修瑕疵",
      size: "筆刷大小",
      undo: "復原",
      clear: "清除",
      hint: "在瑕疵上輕輕塗抹即可去除。"
    },
    detect: {
      searching: "正在定位臉部…",
      none: "未能偵測臉部，仍可修瑕疵及套用。",
      failed: "臉部偵測未能載入。",
      retry: "重試"
    },
    needFace: "這張相片沒有臉部，形體、膚質與妝容暫不可用；修瑕疵與套用仍可正常使用。",
    failed: "未能完成修圖，請再試一次。",
    needSource: "請先選擇一張相片。"
  },
  "zh-CN": {
    title: "人像美容",
    lead: "调整轮廓、肤质与妆容，并修复细小瑕疵；所有处理均在本机完成。",
    tabs: {
      shape: "形体",
      eyes: "眼睛",
      nose: "鼻子",
      mouth: "嘴巴",
      skin: "皮肤",
      makeup: "妆容",
      local: "局部"
    },
    sliders: {
      slim: "瘦脸",
      vshape: "尖下巴",
      forehead: "额头",
      cheek: "颧骨",
      facelength: "脸长",
      eyesize: "大眼",
      eyespace: "眼距",
      eyetilt: "眼尾",
      eyeopen: "眼高",
      nosewidth: "鼻翼",
      noselength: "鼻长",
      nosetip: "鼻头",
      mouthwidth: "嘴宽",
      lipfull: "唇厚",
      smile: "嘴角",
      smooth: "磨皮",
      whiten: "美白",
      eventone: "匀肤",
      blush: "腮红",
      lipcolor: "唇彩",
      brow: "眉",
      eyeshadow: "眼影",
      contour: "修容",
      eyebright: "亮眼",
      eyebag: "去眼袋",
      teeth: "牙齿"
    },
    presets: { natural: "自然", refined: "精致", glam: "网红", fresh: "清新", male: "男神" },
    presetLabel: "风格",
    shadesLabel: "唇色",
    shades: { rose: "玫瑰", coral: "珊瑚", plum: "梅子", nude: "裸色" },
    compare: "对比",
    compareHint: "按住以查看原图",
    rotate: "旋转",
    flip: "镜像",
    reset: "重置",
    restore: "还原",
    apply: "应用",
    applying: "正在应用…",
    applied: "已应用",
    neutral: "归零",
    hint: "左右拖动即可调整；按住“对比”可查看原图。",
    heal: {
      toggle: "修瑕疵",
      size: "笔刷大小",
      undo: "撤销",
      clear: "清除",
      hint: "在瑕疵上轻轻涂抹即可去除。"
    },
    detect: {
      searching: "正在定位脸部…",
      none: "未检测到人脸，仍可修瑕疵及应用。",
      failed: "人脸检测加载失败。",
      retry: "重试"
    },
    needFace: "这张照片没有人脸，形体、肤质与妆容暂不可用；修瑕疵与应用仍可正常使用。",
    failed: "未能完成修图，请重试。",
    needSource: "请先选择一张照片。"
  }
};
function Ht(e, t, n) {
  const o = n ? 1 - e.x : e.x, a = e.y;
  switch (t) {
    case 90:
      return { x: a, y: 1 - o };
    case 180:
      return { x: 1 - o, y: 1 - a };
    case 270:
      return { x: 1 - a, y: o };
    default:
      return { x: o, y: a };
  }
}
function Wt({ active: e, radius: t, rotate: n, flip: o, onStroke: a }) {
  const i = V(null), r = V(null), s = V([]), c = V(!1), l = () => {
    const f = i.current, h = f?.getContext("2d");
    if (!f || !h || (h.clearRect(0, 0, f.width, f.height), !e)) return;
    const m = f.width, y = f.height, g = Math.max(3, t * Math.min(m, y)), v = getComputedStyle(f).getPropertyValue("--rt-accent").trim() || "#7F5410";
    s.current.length > 1 && (h.beginPath(), s.current.forEach((k, E) => {
      const p = k.x * m, R = k.y * y;
      E === 0 ? h.moveTo(p, R) : h.lineTo(p, R);
    }), h.lineJoin = "round", h.lineCap = "round", h.lineWidth = g * 2, h.globalAlpha = 0.28, h.strokeStyle = v, h.stroke(), h.globalAlpha = 1);
    const x = r.current;
    x && (h.beginPath(), h.arc(x.x * m, x.y * y, g, 0, Math.PI * 2), h.lineWidth = Math.max(1, m / 400), h.strokeStyle = v, h.globalAlpha = 0.9, h.stroke(), h.globalAlpha = 1);
  };
  ie(() => {
    const f = i.current;
    if (!f) return;
    e || (s.current = [], r.current = null, c.current = !1);
    const h = () => {
      const y = f.getBoundingClientRect(), g = Math.min(2, window.devicePixelRatio || 1);
      f.width = Math.max(1, Math.round(y.width * g)), f.height = Math.max(1, Math.round(y.height * g)), l();
    };
    h();
    const m = new ResizeObserver(h);
    return m.observe(f), () => m.disconnect();
  }, [e, t]);
  const u = (f) => {
    const h = f.currentTarget.getBoundingClientRect();
    return { x: (f.clientX - h.left) / h.width, y: (f.clientY - h.top) / h.height };
  };
  return /* @__PURE__ */ w(
    "canvas",
    {
      ref: i,
      className: "rt-heal-layer",
      "data-on": e ? "" : void 0,
      "aria-hidden": "true",
      onPointerDown: (f) => {
        if (!e) return;
        f.currentTarget.setPointerCapture(f.pointerId);
        const h = u(f);
        c.current = !0, s.current = [h], r.current = h, l();
      },
      onPointerMove: (f) => {
        if (!e) return;
        const h = u(f);
        if (r.current = h, c.current) {
          const m = s.current[s.current.length - 1];
          (!m || Math.hypot(h.x - m.x, h.y - m.y) > 4e-3) && s.current.push(h);
        }
        l();
      },
      onPointerUp: () => {
        if (!c.current) return;
        c.current = !1;
        const f = s.current;
        s.current = [], f.length > 0 && a({ points: f.map((h) => Ht(h, n, o)), radius: t }), l();
      },
      onPointerCancel: () => {
        c.current = !1, s.current = [], l();
      },
      onPointerLeave: () => {
        r.current = null, l();
      }
    }
  );
}
function Gt({ label: e, value: t, zeroLabel: n, disabled: o = !1, onChange: a }) {
  const i = Ie(), r = (t + 100) / 200 * 100, s = Math.min(50, r), c = Math.max(50, r);
  return /* @__PURE__ */ I("div", { className: "rt-field", children: [
    /* @__PURE__ */ I("div", { className: "rt-field__head", children: [
      /* @__PURE__ */ w("label", { className: "rt-field__label", htmlFor: i, children: e }),
      t === 0 ? /* @__PURE__ */ w("span", { className: "rt-field__value", children: "0" }) : /* @__PURE__ */ w(
        "button",
        {
          type: "button",
          className: "rt-field__value",
          "data-on": "",
          "aria-label": `${n} · ${e}`,
          onClick: () => a(0),
          disabled: o,
          children: t > 0 ? `+${t}` : t
        }
      )
    ] }),
    /* @__PURE__ */ I("div", { className: "rt-range", children: [
      /* @__PURE__ */ w("span", { className: "rt-range__track", "aria-hidden": "true" }),
      /* @__PURE__ */ w(
        "span",
        {
          className: "rt-range__fill",
          "aria-hidden": "true",
          style: { left: `${s}%`, width: `${c - s}%` }
        }
      ),
      /* @__PURE__ */ w("span", { className: "rt-range__zero", "aria-hidden": "true" }),
      /* @__PURE__ */ w(
        "input",
        {
          id: i,
          className: "rt-range__input",
          type: "range",
          min: -100,
          max: 100,
          step: 1,
          value: t,
          disabled: o,
          onChange: (l) => a(Number(l.target.value))
        }
      )
    ] })
  ] });
}
const Ee = [0, 90, 180, 270];
function Vt({
  source: e,
  locale: t = "zh-HK",
  previewEdge: n = Ue,
  onApply: o,
  onParamsChange: a,
  copy: i,
  className: r
}) {
  const s = $e(() => i ? { ...Se[t], ...i } : Se[t], [t, i]), [c, l] = Y(e ? "loading" : "idle"), [u, f] = Y(() => ({ ...q })), [h, m] = Y(null), [y, g] = Y(null), [v, x] = Y(null), [k, E] = Y([]), [p, R] = Y("shape"), [b, L] = Y(!1), [C, P] = Y(!1), [_, F] = Y(Math.round(qe * 1e3) / 10), [A, O] = Y({ w: 0, h: 0 }), [M, S] = Y(!1), [z, X] = Y(!1), [Te, De] = Y(0), be = V(null), H = Ie();
  ie(() => {
    if (!e) {
      m(null), l("idle");
      return;
    }
    let d = !0;
    l("loading"), x(null), g(null), m(null), E([]), X(!1), f({ ...q });
    const N = new Image();
    return N.crossOrigin = "anonymous", N.decoding = "async", N.onload = () => {
      d && (m(N), (async () => {
        try {
          const T = await Ke(N);
          if (!d) return;
          if (!T || T.length === 0) {
            x("none"), l("no-face");
            return;
          }
          g(Ut(T)), l("ready");
        } catch (T) {
          if (!d) return;
          const B = T.code === "load";
          x(B ? "load" : "none"), l(B ? "failed" : "no-face");
        }
      })());
    }, N.onerror = () => {
      d && (m(null), l("failed"));
    }, N.src = e, () => {
      d = !1;
    };
  }, [e, Te]), ie(() => {
    if (!h) return;
    const d = be.current;
    if (!d) return;
    const N = requestAnimationFrame(() => {
      try {
        const T = b ? fe(
          h,
          { ...q, rotate: u.rotate, flip: u.flip },
          null,
          [],
          n
        ) : fe(h, u, y, k, n);
        d.width = T.width, d.height = T.height, d.getContext("2d")?.drawImage(T, 0, 0), O(
          (B) => B.w === T.width && B.h === T.height ? B : { w: T.width, h: T.height }
        );
      } catch {
        l("failed");
      }
    });
    return () => cancelAnimationFrame(N);
  }, [h, u, y, k, n, b]);
  const we = V(a);
  we.current = a, ie(() => {
    we.current?.(u);
  }, [u]);
  const ne = (d) => {
    X(!1), f((N) => G({ ...N, ...d }));
  }, Me = async () => {
    if (!(!h || M)) {
      S(!0);
      try {
        const d = fe(h, u, y, k, _e);
        await o({ canvas: d, width: d.width, height: d.height, params: u }, u), X(!0), window.setTimeout(() => X(!1), 1800);
      } catch {
        l("failed");
      } finally {
        S(!1);
      }
    }
  }, Xe = W.find((d) => d.id === p) ?? W[0], Ye = me.find(
    (d) => pe.every((N) => u[N] === (d.params[N] ?? 0))
  )?.id, ke = !Je(u) || k.length > 0, Oe = A.w > 0 && A.h > 0 ? A.w / A.h : 0.8, oe = c === "loading" ? { tone: "busy", text: s.detect.searching, retry: !1 } : c === "no-face" ? { tone: "info", text: s.detect.none, retry: !1 } : c === "failed" ? v === "load" ? { tone: "warn", text: s.detect.failed, retry: !0 } : { tone: "warn", text: s.failed, retry: !1 } : null, Fe = (d) => {
    if (d.key !== "Enter" || d.defaultPrevented) return;
    const N = d.target.tagName;
    N === "BUTTON" || N === "A" || N === "TEXTAREA" || (d.preventDefault(), Me());
  }, ze = (d) => {
    const N = d.key === "ArrowRight" || d.key === "ArrowDown" ? 1 : d.key === "ArrowLeft" || d.key === "ArrowUp" ? -1 : 0;
    if (N === 0) return;
    d.preventDefault();
    const T = W.findIndex((Be) => Be.id === p), B = W[(T + N + W.length) % W.length];
    R(B.id), document.getElementById(`${H}-${B.id}`)?.focus();
  };
  return /* @__PURE__ */ I(
    "section",
    {
      className: r ? `rt-root ${r}` : "rt-root",
      "aria-label": s.title,
      onKeyDown: Fe,
      children: [
        /* @__PURE__ */ I("header", { className: "rt-head", children: [
          /* @__PURE__ */ w("h2", { className: "rt-title", children: s.title }),
          /* @__PURE__ */ w("p", { className: "rt-lead", children: s.lead })
        ] }),
        e ? /* @__PURE__ */ I("div", { className: "rt-body", children: [
          /* @__PURE__ */ I("div", { className: "rt-stage", children: [
            /* @__PURE__ */ I("div", { className: "rt-frame", style: { "--rt-ar": Oe }, children: [
              /* @__PURE__ */ w(
                "canvas",
                {
                  ref: be,
                  className: "rt-preview",
                  role: "img",
                  "aria-label": b ? `${s.title} — ${s.compare}` : s.title
                }
              ),
              /* @__PURE__ */ w(
                Wt,
                {
                  active: C,
                  radius: _ / 100,
                  rotate: u.rotate,
                  flip: u.flip,
                  onStroke: (d) => {
                    X(!1), E((N) => [...N, d]);
                  }
                }
              ),
              b && /* @__PURE__ */ w("span", { className: "rt-badge", children: s.compare })
            ] }),
            /* @__PURE__ */ I("div", { className: "rt-tools", children: [
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn",
                  "aria-pressed": b,
                  "aria-label": `${s.compare} — ${s.compareHint}`,
                  title: s.compareHint,
                  disabled: !h,
                  onPointerDown: () => L(!0),
                  onPointerUp: () => L(!1),
                  onPointerLeave: () => L(!1),
                  onPointerCancel: () => L(!1),
                  onKeyDown: (d) => {
                    (d.key === " " || d.key === "Enter") && (d.preventDefault(), L(!0));
                  },
                  onKeyUp: (d) => {
                    (d.key === " " || d.key === "Enter") && L(!1);
                  },
                  onBlur: () => L(!1),
                  children: s.compare
                }
              ),
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn",
                  disabled: !h,
                  onClick: () => ne({ rotate: Ee[(Ee.indexOf(u.rotate) + 1) % 4] }),
                  children: s.rotate
                }
              ),
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn",
                  "aria-pressed": u.flip,
                  disabled: !h,
                  onClick: () => ne({ flip: !u.flip }),
                  children: s.flip
                }
              )
            ] }),
            oe && /* @__PURE__ */ I("p", { className: "rt-notice", "data-tone": oe.tone, role: "status", children: [
              /* @__PURE__ */ w("span", { children: oe.text }),
              oe.retry && /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn rt-btn--small",
                  onClick: () => De((d) => d + 1),
                  children: s.detect.retry
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ I("div", { className: "rt-panel", children: [
            /* @__PURE__ */ I("div", { className: "rt-panel__main", children: [
              /* @__PURE__ */ w("div", { className: "rt-tabs", role: "tablist", "aria-label": s.title, onKeyDown: ze, children: W.map((d) => /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  role: "tab",
                  id: `${H}-${d.id}`,
                  className: "rt-tab",
                  "aria-selected": d.id === p,
                  "aria-controls": H,
                  tabIndex: d.id === p ? 0 : -1,
                  onClick: () => R(d.id),
                  children: s.tabs[d.id]
                },
                d.id
              )) }),
              /* @__PURE__ */ I(
                "div",
                {
                  className: "rt-sheet",
                  role: "tabpanel",
                  id: H,
                  "aria-labelledby": `${H}-${p}`,
                  tabIndex: -1,
                  children: [
                    !y && /* @__PURE__ */ w("p", { className: "rt-note rt-note--flag", children: s.needFace }),
                    /* @__PURE__ */ I("div", { className: "rt-section", children: [
                      /* @__PURE__ */ w("span", { className: "rt-section__label", children: s.presetLabel }),
                      /* @__PURE__ */ w("div", { className: "rt-presets", children: me.map((d) => /* @__PURE__ */ w(
                        "button",
                        {
                          type: "button",
                          className: "rt-preset",
                          "aria-pressed": Ye === d.id,
                          disabled: !y,
                          onClick: () => {
                            X(!1), f(
                              (N) => G({
                                ...Ve(d.id),
                                lipShade: N.lipShade,
                                rotate: N.rotate,
                                flip: N.flip
                              })
                            );
                          },
                          children: s.presets[d.id]
                        },
                        d.id
                      )) })
                    ] }),
                    /* @__PURE__ */ w("div", { className: "rt-section", children: Xe.sliders.map((d) => /* @__PURE__ */ w(
                      Gt,
                      {
                        label: s.sliders[d],
                        value: u[d],
                        zeroLabel: s.neutral,
                        disabled: !y,
                        onChange: (N) => ne({ [d]: N })
                      },
                      d
                    )) }),
                    p === "makeup" && /* @__PURE__ */ I("div", { className: "rt-section", children: [
                      /* @__PURE__ */ w("span", { className: "rt-section__label", children: s.shadesLabel }),
                      /* @__PURE__ */ w("div", { className: "rt-shades", children: ge.map((d) => /* @__PURE__ */ w(
                        "button",
                        {
                          type: "button",
                          className: "rt-swatch",
                          style: { background: d.hex },
                          "aria-pressed": u.lipShade === d.id,
                          "aria-label": s.shades[d.id],
                          title: s.shades[d.id],
                          disabled: !y,
                          onClick: () => ne({ lipShade: d.id })
                        },
                        d.id
                      )) })
                    ] }),
                    /* @__PURE__ */ I("div", { className: "rt-heal", children: [
                      /* @__PURE__ */ I("div", { className: "rt-heal__head", children: [
                        /* @__PURE__ */ w(
                          "button",
                          {
                            type: "button",
                            className: "rt-btn",
                            "aria-pressed": C,
                            disabled: !h,
                            onClick: () => P((d) => !d),
                            children: s.heal.toggle
                          }
                        ),
                        /* @__PURE__ */ w(
                          "button",
                          {
                            type: "button",
                            className: "rt-btn rt-btn--small",
                            disabled: k.length === 0,
                            onClick: () => E((d) => d.slice(0, -1)),
                            children: s.heal.undo
                          }
                        ),
                        /* @__PURE__ */ w(
                          "button",
                          {
                            type: "button",
                            className: "rt-btn rt-btn--small",
                            disabled: k.length === 0,
                            onClick: () => E([]),
                            children: s.heal.clear
                          }
                        )
                      ] }),
                      /* @__PURE__ */ I("div", { className: "rt-field", children: [
                        /* @__PURE__ */ I("div", { className: "rt-field__head", children: [
                          /* @__PURE__ */ w("label", { className: "rt-field__label", htmlFor: `${H}-brush`, children: s.heal.size }),
                          /* @__PURE__ */ w("span", { className: "rt-field__value", children: _ })
                        ] }),
                        /* @__PURE__ */ I("div", { className: "rt-range", children: [
                          /* @__PURE__ */ w("span", { className: "rt-range__track", "aria-hidden": "true" }),
                          /* @__PURE__ */ w(
                            "input",
                            {
                              id: `${H}-brush`,
                              className: "rt-range__input",
                              type: "range",
                              min: 1,
                              max: 12,
                              step: 0.5,
                              value: _,
                              disabled: !h,
                              onChange: (d) => F(Number(d.target.value))
                            }
                          )
                        ] })
                      ] }),
                      /* @__PURE__ */ w("p", { className: "rt-note rt-note--tight", children: s.heal.hint })
                    ] }),
                    /* @__PURE__ */ w("p", { className: "rt-note", children: s.hint })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ I("div", { className: "rt-actions", children: [
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn rt-btn--small",
                  disabled: !ke,
                  onClick: () => {
                    X(!1), E([]), f(
                      (d) => G({
                        ...q,
                        lipShade: d.lipShade,
                        rotate: d.rotate,
                        flip: d.flip
                      })
                    );
                  },
                  children: s.reset
                }
              ),
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn rt-btn--small",
                  disabled: !ke,
                  onClick: () => {
                    X(!1), P(!1), E([]), f({ ...q });
                  },
                  children: s.restore
                }
              ),
              /* @__PURE__ */ w(
                "button",
                {
                  type: "button",
                  className: "rt-btn rt-btn--accent",
                  disabled: !h || M,
                  "aria-live": "polite",
                  onClick: () => {
                    Me();
                  },
                  children: M ? s.applying : z ? s.applied : s.apply
                }
              )
            ] })
          ] })
        ] }) : /* @__PURE__ */ w("div", { className: "rt-empty", children: s.needSource })
      ]
    }
  );
}
export {
  Se as COPY,
  W as GROUPS,
  qe as HEAL_RADIUS,
  ge as LIP_SHADES,
  _e as MAX_EDGE,
  q as NEUTRAL_PARAMS,
  me as PRESETS,
  Ue as PREVIEW_EDGE,
  Vt as RetouchEditor,
  pe as SLIDER_IDS,
  Ze as activePasses,
  Q as anyActive,
  Ut as buildRegions,
  G as clampParams,
  Ke as detectLandmarks,
  Je as isNeutral,
  je as lipShadeHex,
  Ve as presetParams,
  fe as renderRetouch,
  qt as resetLandmarker,
  Tt as rotatedSize
};
