// Shared test harness. Runs gantt.html's inline script in a fresh iframe per case
// and returns the exact string that render() assigned to #cw.innerHTML.
// Needs --allow-file-access-from-files when opened from file:// (fetch of gantt.html).

// Each case: a fixed clock [year, month(1-12), day] and code run after load.
const CASES = {
  "view":       {clock: [2027, 11, 10], code: ""},
  "edit":       {clock: [2027, 11, 10], code: "editing=true; sel=lanes[0].items[2]; render()"},
  "edit-lane":  {clock: [2027, 11, 10], code: "editing=true; selL=lanes[1]; sel=null; render()"},
  "nolulls":    {clock: [2027, 11, 10], code: "document.getElementById('lt').checked=false; render()"},
  "outside":    {clock: [2026, 11, 26], code: ""},
};

const HERE = location.href.replace(/[^\/]*$/, "");
const GANTT_URL = new URL("../gantt.html", HERE).href;
const DATA_URL = new URL("../roadmap-sample.js", HERE).href;

// Page the iframe shows: the elements gantt.html expects, the sample data, and a
// listener that sets up stubs, injects the gantt script and runs the case.
const FRAME = `<!doctype html><html><body>
<h1 id="h"></h1><div id="cw"></div><div id="pn"></div><label id="lb"></label>
<span id="ls"></span><div id="lg"></div><div id="tip"></div>
<script src="${DATA_URL}"><\/script>
<script>
addEventListener("message", e => {
  const {block, gantt, clock, code} = e.data;
  const cw = document.getElementById("cw");
  const setter = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set;
  let last = null;
  Object.defineProperty(cw, "innerHTML", {configurable: true, get() { return last; },
    set(v) { last = v; setter.call(cw, v); }});
  const Real = Date, fixed = new Real(clock[0], clock[1] - 1, clock[2], 12).getTime();
  window.Date = class extends Real { constructor(...a) { super(...(a.length ? a : [fixed])); } static now() { return fixed; } };
  const run = src => { const s = document.createElement("script"); s.textContent = src; document.body.append(s); };
  run(block); run(gantt);
  if (code) run(code);
  parent.postMessage({result: last, out: window.__out}, "*");
});
<\/script></body></html>`;

let ganttText = null;
async function legacyRun(c) { // c.code may set window.__out; resolves {result: last #cw.innerHTML, out}
  if (ganttText === null) ganttText = await (await fetch(GANTT_URL)).text();
  const m = ganttText.match(/<script>([\s\S]*?)<\/script>/), b = ganttText.match(/<script id="gantt-render">([\s\S]*?)<\/script>/); // main inline script, render block
  if (!m || !b) throw new Error("scripts missing in gantt.html");
  const f = document.createElement("iframe");
  f.srcdoc = FRAME;
  const done = new Promise(res => addEventListener("message", function h(e) {
    if (e.source === f.contentWindow) { removeEventListener("message", h); res(e.data); }
  }));
  f.onload = () => f.contentWindow.postMessage({block: b[1], gantt: m[1], clock: c.clock, code: c.code}, "*");
  document.body.append(f);
  const r = await done;
  f.remove();
  return r;
}
const legacyCapture = async (c) => (await legacyRun(c)).result;

async function captureAll() {
  const out = {};
  for (const k in CASES) out[k] = await legacyCapture(CASES[k]);
  return out;
}

// Print text through --dump-dom safely: base64 of UTF-8 inside a <pre id="b64">.
function emit(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
  const pre = document.createElement("pre");
  pre.id = "b64"; pre.textContent = btoa(bin);
  document.body.append(pre);
}

// ---- direct access to the renderer (no iframe): the gantt-render block and the sample data ----
const textCache = {};
async function textOf(url) { return textCache[url] ??= await (await fetch(url)).text(); }
async function loadApi() { // fresh copy of {normalize, renderGantt, ganttLayout} from gantt.html
  const t = (await textOf(GANTT_URL)).match(/<script id="gantt-render">([\s\S]*?)<\/script>/);
  if (!t) throw new Error("no gantt-render block in gantt.html");
  return new Function(t[1] + ";return {normalize,renderGantt,ganttLayout}")();
}
const DATA_NAMES = "editable,title,kinds,msColor,startDate,legend,lullLabel,months,quarters,lulls,lanes";
const evalData = (text) => new Function(text + "; return {" + DATA_NAMES + "}")(); // roadmap.js-style text -> its constants
async function loadSample() { return evalData(await textOf(DATA_URL)); } // fresh, unshared copy of roadmap-sample.js
async function loadRoadmap() { return evalData(await textOf(new URL("../roadmap.js", HERE).href)); }
