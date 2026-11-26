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
  const {gantt, clock, code} = e.data;
  const cw = document.getElementById("cw");
  const setter = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set;
  let last = null;
  Object.defineProperty(cw, "innerHTML", {configurable: true, get() { return last; },
    set(v) { last = v; setter.call(cw, v); }});
  const Real = Date, fixed = new Real(clock[0], clock[1] - 1, clock[2], 12).getTime();
  window.Date = class extends Real { constructor(...a) { super(...(a.length ? a : [fixed])); } static now() { return fixed; } };
  const run = src => { const s = document.createElement("script"); s.textContent = src; document.body.append(s); };
  run(gantt);
  if (code) run(code);
  parent.postMessage({result: last}, "*");
});
<\/script></body></html>`;

let ganttText = null;
async function legacyCapture(c) {
  if (ganttText === null) ganttText = await (await fetch(GANTT_URL)).text();
  const m = ganttText.match(/<script>([\s\S]*?)<\/script>/); // the inline script (no src)
  if (!m) throw new Error("no inline script in gantt.html");
  const f = document.createElement("iframe");
  f.srcdoc = FRAME;
  const done = new Promise(res => addEventListener("message", function h(e) {
    if (e.source === f.contentWindow) { removeEventListener("message", h); res(e.data.result); }
  }));
  f.onload = () => f.contentWindow.postMessage({gantt: m[1], clock: c.clock, code: c.code}, "*");
  document.body.append(f);
  const r = await done;
  f.remove();
  return r;
}

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
