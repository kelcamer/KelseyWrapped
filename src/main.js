import { SLIDES, CHAPTERS, RECEIPT, ROASTS, MENUS } from "./slides.js";
import { hueFor } from "./letters.js";

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVG = "http://www.w3.org/2000/svg";
let at = 0;

function h(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function s(tag, attrs = {}) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
const fmt = (v) => Math.round(v).toLocaleString("en-US");

/* ---------------------------------------------------------- big number --
   The one orchestrated moment: the number counts up when a card opens.
   Off under reduced motion; the final text is always in the DOM first. */
function bigNumber(text, cls = "big") {
  const el = h("p", cls, text);
  const m = text.match(/^([+-]?)([\d,]+)(\.\d+)?(.*)$/);
  if (!m || reduced) return el;
  const target = parseFloat((m[2] + (m[3] || "")).replace(/,/g, ""));
  const dec = m[3] ? m[3].length - 1 : 0;
  if (!(target > 0)) return el;
  el.setAttribute("aria-label", text);
  const t0 = performance.now(), dur = 700;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = m[1] + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[4];
    if (k < 1 && el.textContent !== text) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
  // Backstop: frames pause in background tabs, so always land on the truth.
  setTimeout(() => { el.textContent = text; }, dur + 150);
  return el;
}

function sticker(text) {
  const st = h("p", "sticker", text);
  st.style.setProperty("--tilt", `${(at % 2 ? 1.6 : -2.1)}deg`);
  return st;
}

/* Caption under a chart that names whatever mark is hovered or focused. */
function readout(def) {
  const p = h("p", "readout", def);
  p.setAttribute("aria-live", "polite");
  return p;
}
function hookMark(mark, out, text) {
  mark.setAttribute("tabindex", "0");
  mark.setAttribute("role", "img");
  mark.setAttribute("aria-label", text);
  const on = () => { out.textContent = text; mark.classList.add("on"); };
  const off = () => mark.classList.remove("on");
  mark.addEventListener("pointerenter", on);
  mark.addEventListener("focus", on);
  mark.addEventListener("pointerleave", off);
  mark.addEventListener("blur", off);
  mark.addEventListener("click", (e) => e.stopPropagation());
}

/* ------------------------------------------------------------- charts -- */
function bars(chart) {
  const fig = h("figure", "chart");
  fig.append(h("figcaption", "chart-title", chart.title));
  const max = Math.max(...chart.bars.map((b) => b.v));
  const best = chart.bars.reduce((a, b) => (b.v > a.v ? b : a));
  const out = readout(`Most: ${best.full}, ${fmt(best.v)} ${chart.unit}`);
  if (chart.horizontal) {
    const list = h("div", "hbars");
    chart.bars.forEach((b) => {
      const row = h("div", "hbar" + (b.hot ? " hot" : ""));
      row.append(h("span", "hbar-label", b.label));
      const track = h("span", "hbar-track");
      const fill = h("span", "hbar-fill");
      fill.style.width = `${(b.v / max) * 100}%`;
      track.append(fill);
      row.append(track, h("span", "hbar-val", fmt(b.v)));
      hookMark(row, out, `${b.full}: ${fmt(b.v)} ${chart.unit}`);
      list.append(row);
    });
    fig.append(list, out);
    return fig;
  }
  const W = 320, H = 150, gap = 10, bw = (W - gap * (chart.bars.length - 1)) / chart.bars.length;
  // 20px of headroom above the plot so the tallest bar's label clears the title
  const svg = s("svg", { viewBox: `0 -20 ${W} ${H + 42}`, class: "vbars" });
  chart.bars.forEach((b, i) => {
    const x = i * (bw + gap);
    const bh = Math.max(3, (b.v / max) * H);
    const g = s("g", { class: "mark" });
    g.append(s("rect", { x, y: 0, width: bw, height: H, class: "hit" }));
    // 4px rounded top, square at the baseline
    const r = Math.min(4, bw / 2, bh);
    g.append(s("path", {
      class: "bar",
      d: `M${x} ${H} V${H - bh + r} Q${x} ${H - bh} ${x + r} ${H - bh} H${x + bw - r} Q${x + bw} ${H - bh} ${x + bw} ${H - bh + r} V${H} Z`,
    }));
    const lab = s("text", { x: x + bw / 2, y: H + 17, "text-anchor": "middle", class: "tick" });
    lab.textContent = b.label;
    g.append(lab);
    if (b === best || b.v === Math.min(...chart.bars.map((z) => z.v))) {
      const v = s("text", { x: x + bw / 2, y: H - bh - 6, "text-anchor": "middle", class: "val" });
      v.textContent = fmt(b.v);
      g.append(v);
    }
    hookMark(g, out, `${b.full}: ${fmt(b.v)} ${chart.unit}`);
    svg.append(g);
  });
  svg.append(s("line", { x1: 0, x2: W, y1: H + 0.5, y2: H + 0.5, class: "base" }));
  fig.append(svg, out);
  return fig;
}

function line(chart) {
  const fig = h("figure", "chart");
  fig.append(h("figcaption", "chart-title", chart.title));
  const pts = chart.points;
  const W = 320, H = 130, pad = 6;
  const vs = pts.map((p) => p.v);
  const lo = Math.floor(Math.min(...vs) / 100) * 100, hi = Math.ceil(Math.max(...vs) / 100) * 100;
  const X = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const Y = (v) => pad + (1 - (v - lo) / (hi - lo)) * (H - pad * 2);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H + 22}`, class: "linechart" });
  [lo, hi].forEach((v) => {
    svg.append(s("line", { x1: 0, x2: W, y1: Y(v), y2: Y(v), class: "grid" }));
    const t = s("text", { x: 0, y: Y(v) - 4, class: "tick" });
    t.textContent = fmt(v);
    svg.append(t);
  });
  svg.append(s("path", { class: "ln", d: pts.map((p, i) => `${i ? "L" : "M"}${X(i)} ${Y(p.v)}`).join(" ") }));
  const last = pts.length - 1;
  const out = readout(`${pts[0].label}: ${fmt(pts[0].v)} ${chart.unit}. ${pts[last].label}: ${fmt(pts[last].v)} ${chart.unit}`);
  pts.forEach((p, i) => {
    const g = s("g", { class: "mark" });
    g.append(s("rect", { x: X(i) - (W / pts.length) / 2, y: 0, width: W / pts.length, height: H, class: "hit" }));
    g.append(s("circle", { cx: X(i), cy: Y(p.v), r: i === 0 || i === last ? 4.5 : 3, class: "dot" }));
    hookMark(g, out, `${p.label}: ${fmt(p.v)} ${chart.unit}`);
    svg.append(g);
  });
  [0, last].forEach((i) => {
    const t = s("text", { x: X(i), y: H + 17, "text-anchor": i ? "end" : "start", class: "tick" });
    t.textContent = pts[i].label;
    svg.append(t);
  });
  fig.append(svg, out);
  return fig;
}

function scatter(chart) {
  const fig = h("figure", "chart");
  fig.append(h("figcaption", "chart-title", chart.title));
  const W = 320, H = 170, L = 8, B = 8;
  const xs = chart.pts.map((p) => p[0]), ys = chart.pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys);
  const X = (v) => L + ((v - x0) / (x1 - x0)) * (W - L * 2);
  const Y = (v) => H - B - (v / y1) * (H - B * 2);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H + 18}`, class: "scatter" });
  svg.append(s("line", { x1: 0, x2: W, y1: H - B + 4, y2: H - B + 4, class: "base" }));
  const out = readout(`${chart.pts.length} sessions. Each dot is one gym day.`);
  chart.pts.forEach(([p, v]) => {
    const c = s("circle", { cx: X(p), cy: Y(v), r: 4.5, class: "pt" });
    hookMark(c, out, `${fmt(p)} g protein the day before, ${fmt(v)} lb moved`);
    svg.append(c);
  });
  const a = s("text", { x: 0, y: H + 16, class: "tick" }); a.textContent = `${fmt(x0)} g`;
  const b = s("text", { x: W, y: H + 16, class: "tick", "text-anchor": "end" }); b.textContent = `${fmt(x1)} g`;
  svg.append(a, b);
  fig.append(svg, out);
  return fig;
}

function pair(rows) {
  const fig = h("figure", "chart");
  fig.append(h("figcaption", "chart-title", "Gym days against rest days"));
  const out = readout("Solid bar: gym days. Outlined bar: rest days.");
  rows.forEach((r) => {
    const max = Math.max(r.gym, r.rest);
    const grp = h("div", "pair");
    grp.append(h("p", "pair-label", r.label));
    [["gym", "gym days"], ["rest", "rest days"]].forEach(([k, name]) => {
      const row = h("div", `hbar ${k}`);
      row.append(h("span", "hbar-label", name));
      const track = h("span", "hbar-track");
      const fill = h("span", "hbar-fill");
      fill.style.width = `${(r[k] / max) * 100}%`;
      track.append(fill);
      row.append(track, h("span", "hbar-val", fmt(r[k])));
      hookMark(row, out, `${r.label}, ${name}: ${fmt(r[k])}`);
      grp.append(row);
    });
    fig.append(grp);
  });
  fig.append(out);
  return fig;
}

/* -------------------------------------------------------------- cards -- */
function card(sl) {
  const box = h("section", `card kind-${sl.kind || "stat"}`);

  if (sl.kind === "intro") {
    const t = h("h1", "title");
    // Fisher-Price magnet colours: the colour belongs to the letter, so
    // both E's are the same blue. See letters.js.
    ["KELSEY", "WRAPPED"].forEach((word) => {
      const w = h("span", "word");
      [...word].forEach((ch) => w.append(h("span", `ltr ltr-${hueFor(ch)}`, ch)));
      t.append(w, " ");
    });
    box.append(t, h("p", "lede", sl.line), h("p", "foot", sl.foot));
    const go = h("button", "cta", "Start");
    go.type = "button";
    go.addEventListener("click", (e) => { e.stopPropagation(); show(1); });
    box.append(go);
    return box;
  }

  if (sl.kind === "receipt") return receipt(box);

  if (sl.kind === "menu") {
    box.append(h("p", "unit", sl.unit));
    const paper = h("div", "menu");
    const fill = () => {
      const m = MENUS[Math.floor(Math.random() * MENUS.length)];
      const d = new Date(m.date + "T12:00:00").toLocaleDateString("en-US",
        { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      paper.replaceChildren(h("p", "menu-date", d), h("p", "menu-note", m.note),
        h("p", "menu-tot", `${fmt(m.kcal)} kcal, ${fmt(m.protein)} g protein`));
    };
    fill();
    const again = h("button", "cta", "Another day");
    again.type = "button";
    again.addEventListener("click", (e) => { e.stopPropagation(); fill(); });
    box.append(paper, again, h("p", "foot", sl.foot));
    return box;
  }

  if (sl.kind === "duo" || sl.kind === "trio") {
    const row = h("div", "multi");
    sl.duo.forEach((d) => {
      const cell = h("div", "multi-cell");
      cell.append(bigNumber(d.big, "big big-sm"), h("p", "unit", d.unit));
      row.append(cell);
    });
    box.append(row);
  } else {
    box.append(bigNumber(sl.big), h("p", "unit", sl.unit));
  }

  if (sl.kind === "emoji") {
    const row = h("p", "emoji-row");
    sl.emoji.forEach(([e, v]) => row.append(h("span", "emo", `${e} ${fmt(v)}`)));
    box.append(row);
  }
  if (sl.roast) box.append(sticker(sl.roast));
  if (sl.kind === "bars") box.append(bars(sl.chart));
  if (sl.kind === "line") box.append(line(sl.chart));
  if (sl.kind === "scatter") box.append(scatter(sl.chart));
  if (sl.kind === "pair") box.append(pair(sl.pair));
  if (sl.kind === "prs") {
    const ol = h("ol", "prs");
    sl.prs.forEach((p) => {
      const li = h("li");
      li.append(h("span", "pr-name", p.label), h("span", "pr-lbs", `${fmt(p.lbs)} lb`),
        h("span", "pr-date", new Date(p.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })));
      ol.append(li);
    });
    box.append(ol);
  }
  if (sl.foot) box.append(h("p", "foot", sl.foot));
  return box;
}

function receipt(box) {
  const paper = h("div", "receipt");
  paper.append(h("p", "r-head", "LA FITNESS × KITCHEN"), h("p", "r-sub", "ITEMIZED YEAR"));
  const ul = h("ul", "r-list");
  ul.id = "receipt-list";
  RECEIPT.forEach((r) => {
    if (!r) { ul.append(h("li", "r-rule", "- - - - - - - - - - - - - - - - - -")); return; }
    const li = h("li");
    li.append(h("span", "r-k", r[0]), h("span", "r-v", r[1]));
    ul.append(li);
  });
  paper.append(ul, h("p", "r-total", "TOTAL: ONE (1) KELSEY"), h("p", "r-thanks", "THANK YOU FOR LIFTING\nNO REFUNDS ON SORENESS"));
  const roast = h("p", "sticker", ROASTS[0]);
  roast.style.setProperty("--tilt", "-1.5deg");
  const again = h("button", "cta", "Roast me again");
  again.type = "button";
  let i = 0;
  again.addEventListener("click", (e) => {
    e.stopPropagation();
    i = (i + 1 + Math.floor(Math.random() * (ROASTS.length - 1))) % ROASTS.length;
    roast.textContent = ROASTS[i];
    roast.classList.remove("slap"); void roast.offsetWidth; roast.classList.add("slap");
  });
  const restart = h("button", "cta ghost", "Start over");
  restart.type = "button";
  restart.addEventListener("click", (e) => { e.stopPropagation(); show(0); });
  const btns = h("div", "btns");
  btns.append(again, restart);
  box.append(paper, roast, btns);
  return box;
}

/* ---------------------------------------------------------- navigation -- */
const progress = $("progress");
SLIDES.forEach(() => progress.append(h("span", "seg")));

function show(i, focus = true) {
  at = Math.max(0, Math.min(SLIDES.length - 1, i));
  const sl = SLIDES[at];
  document.body.dataset.bg = sl.bg;
  $("chapter").textContent = CHAPTERS[sl.chapter].name;
  $("count").textContent = `${at + 1} of ${SLIDES.length}`;
  [...progress.children].forEach((seg, k) => seg.classList.toggle("done", k <= at));
  $("prev").disabled = at === 0;
  $("next").disabled = at === SLIDES.length - 1;
  stage.replaceChildren(card(sl));
  stage.scrollTop = 0;
  try { history.replaceState(null, "", at ? `#${at + 1}` : location.pathname); } catch {}
  if (focus) stage.focus({ preventScroll: true });
}

const next = () => show(at + 1);
const prev = () => show(at - 1);
$("next").addEventListener("click", next);
$("prev").addEventListener("click", prev);
// Tap the left third of the card to go back, anywhere else to go on.
// Controls, charts, the menu and the receipt keep their own clicks.
stage.addEventListener("click", (e) => {
  if (e.target.closest("button, a, .chart, .menu, .receipt")) return;
  const r = stage.getBoundingClientRect();
  (e.clientX - r.left < r.width / 3 ? prev : next)();
});
addEventListener("keydown", (e) => {
  if (e.target.closest?.("button") && (e.key === " " || e.key === "Enter")) return;
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); next(); }
  if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
  if (e.key === "Home") show(0);
  if (e.key === "End") show(SLIDES.length - 1);
});
let sx = null;
stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
stage.addEventListener("touchend", (e) => {
  if (sx == null) return;
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
  sx = null;
});
document.querySelector(".skip").addEventListener("click", (e) => {
  e.preventDefault();
  show(SLIDES.length - 1);
});

const fromHash = parseInt(location.hash.slice(1), 10);
show(Number.isFinite(fromHash) ? fromHash - 1 : 0, false);
requestAnimationFrame(() => document.body.classList.add("ready"));
