# Refactor notes: reusable renderer

Status: not started. Written at commit `c5724a2`. Line numbers below refer to that commit and will drift.

## Goal

Pull the drawing code out of `gantt.html` into `renderGantt(data, container)` so the chart can be embedded elsewhere (code-block rendering, a Node SVG export, Mermaid-style use). `gantt.html` and the `roadmap.js` format must keep working unchanged.

## Non-goals

- No change to the `roadmap.js` format or to what Save writes.
- No new chart features during the refactor.
- No build step or dependencies.

## What `render()` depends on today

Globals that the draw code reads directly:

- Data from `roadmap.js`: `title`, `kinds`, `msColor`, `todayWeek`, `legend`, `lullLabel`, `months`, `quarters`, `lulls`, `lanes`, `editable`.
- Derived in `gantt.html`: `col` (kind to colour), `END`, `W`, `LW`, `TOP`, `RH`, `PAD`, `mw`, `x()`, `esc()`, `wrap()`, `wk()`.
- Editor state: `sel`, `editing` (draws the selection ring and the "+ Add item" rows).
- DOM: `document.getElementById("lt")` (lulls checkbox) and `cw.innerHTML = ...` (output).
- Side effect: `render()` writes `i.row` and `l.lines` onto the data. `restore()` in the undo code strips those two keys when snapshotting, so keep that in step.

## Target shape

1. `renderGantt(data, opts)` returns an SVG string. Pure: no DOM, no globals. `opts` carries `editing`, `selected`, `showLulls`, and an id prefix.
2. `gantt.html` keeps the editor and calls `cw.innerHTML = renderGantt(...)`.
3. The renderer lives in its own file (for example `gantt-render.js`) that works as a browser `<script>` and under Node (`module.exports` guarded by `typeof module`). Keep it loadable by a script tag, because `file://` pages cannot `fetch()` or use ES modules reliably.
4. Defaults for optional fields (`kinds`, `months`, `quarters`, `lulls`, `legend`, `msColor`, `todayWeek`) so an embedded block can be small.

## Risks to watch

- **Shared references.** `lanes` is a `const` that undo restores in place (`lanes.length=0; lanes.push(...)`). Keep one shared reference. Passing a copy to the renderer is fine, but the editor must keep mutating the original.
- **Element ids.** The pattern id `hatch` is fixed and the lulls checkbox is found by id `lt`. Two charts on one page would collide. Use an id prefix per instance and pass `showLulls` in instead of reading the checkbox.
- **Mutation inside render.** `i.row` and `l.lines` are set during render. The pure version should compute them locally, or the editor must still see `i.row` where it relies on it (check `mousedown` and the drag code).
- **Editor globals.** `sel`, `editing`, `dragging`, the undo stacks and the document-level key handlers are single instances. Keep them in `gantt.html`. Do not move them into the renderer.
- **Tooltip and cursor code** use `cw` and the `data-l`, `data-i`, `data-t`, `data-d` attributes on each `<g>`. Keep those attributes exactly.
- **Save format.** `ser()` writes the file from the `const editable` line down. Leave it alone.

## Order of work

1. Add the tests below first, against the current code, and get them passing. They are the safety net.
2. Extract `renderGantt` as a pure function. Make the tests pass with no change to the golden output.
3. Switch `gantt.html` to call it. Do the manual checklist.
4. Only then add the code-block loader or the Node SVG script.

Commit each step separately so any one can be reverted.

## Tests

No test framework is needed. Use Node's built-in runner (`node --test`), no dependencies.

### Automated

1. **Golden output.** Before changing anything, capture the SVG string for `roadmap.js` in view mode and save it as `test/golden/view.svg`. After the refactor, the renderer must produce the identical string. Repeat with `editing: true` and one item selected (`golden/edit.svg`), and with lulls hidden.
   - To capture today's output, load `roadmap.js` and the draw code in a Node `vm` context with a stub `document`, or extract the draw code first and then capture. Do the capture before editing the draw code.
2. **Structure checks** on the SVG for the sample data:
   - one `<g data-l data-i>` per item, so the count equals the total number of items;
   - the number of lane label texts equals the number of lanes;
   - lulls present when shown and absent when hidden;
   - milestone items contain a diamond `<path>`; TBC items contain `stroke-dasharray`.
3. **Edge cases** (small hand-built data objects):
   - empty `lanes`, and a lane with no items;
   - an item with `s` of zero width, and with `s[1]` at `END`;
   - a bar under half a week wide with `ms:1` shows only the diamond;
   - label placement: right of the bar, then left, then inside in white;
   - titles with `<`, `&` and `"` are escaped in both text and `data-*` attributes;
   - unknown `k` (kind not in `kinds`) does not throw.
4. **Round trip.** `ser()` output evaluated back gives the same `lanes` as the input (guards the Save format).
5. **Undo model.** If the undo logic is extracted into a plain function, test that: commit then undo then redo restores state, the redo stack clears on a new commit, the cap drops the oldest entry, and undoing back to the saved snapshot clears the dirty flag.
6. **Two instances.** Render two charts into one string and check there are no duplicate ids.

### Manual checklist (browser, `gantt.html`)

Run once in Chrome or Edge after step 3.

- Page title comes from `roadmap.js`; legend, lull checkbox and Show/Hide legend work.
- Hover tips show the title, week range and hover text.
- Edit button: bars drag sideways, ends resize, up/down drag reorders and locks to one axis.
- Click selects, second click renames in place, click on empty chart area deselects, Esc deselects.
- Panel: every field updates the bar; lane dropdown moves the item; Up/Down/Delete/Close work.
- Delete and Backspace delete the selected item, but not while typing in a field.
- Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y work; a drag is one undo step; undoing back to the saved state clears "Unsaved changes".
- Save writes `roadmap.js` and it reloads identically; Export and Discard work.
- `editable=false` hides all editing.
- Open from `file://` (no server) to confirm the script-tag loading still works.
