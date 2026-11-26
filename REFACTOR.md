# Refactor notes: reusable renderer

Status: steps 1 to 4 done (`8c4057e` to `05eb36c`). `bash test/run.sh` (30 renderer tests) and `bash test/smoke.sh` (13 scripted editor checks) pass. Still to check by hand: Save to file, Discard, and real mouse feel. Step 5 not started. Written at commit `c5724a2`, revised at `a4b0c55`. Line numbers below refer to `a4b0c55` and will drift.

Outcome notes:
- API: `normalize(raw) → {model, warnings}`, `renderGantt(model, opts) → SVG string`, `ganttLayout(model) → {W, LW, RH, mw, x}`, all in the `gantt-render` block. Only `lanes` is required by `normalize`.
- Warnings go to the browser console for now (step 5 shows them on screen).
- An item with an unknown `k` is now drawn grey (`#808080`) instead of with no fill.
- `ser()`, `itemStr` and `J` moved to the top level of the main script so tests can call them. Behaviour unchanged.

## Goal

Pull the drawing code in `gantt.html` out into a pure `renderGantt(model, opts)` so the chart can later be embedded elsewhere (code-block rendering, SVG export, Mermaid-style use). `gantt.html` and the `roadmap.js` format must keep working unchanged.

## Decisions

- **Keep the week format.** `s:[startWeek,endWeek]`, 4 weeks to a month, stays. No date syntax for now.
- **One internal model.** A `normalize(raw) → {model, warnings}` step sits between the file and everything else. It fills defaults, computes `END`, and checks the data. The renderer and the editor read only the model. This is what keeps exact dates cheap later: date support means teaching `normalize` (and Save) to read and write dates, and nothing else.
- **Weeks are the internal unit.** Inside the model, time is a position in weeks. A date can be converted to that position from `startDate` (the today line already does this).
- **Single file stays single.** The renderer lives in `gantt.html` in its own `<script id="gantt-render">` block, not a separate file, so `gantt.html` plus `roadmap.js` is still all you copy. Tests and any later export script read that block out of `gantt.html`.
- **No Node, no dependencies.** Tests run in a browser page (`test/run.html`), headless through Edge or Chrome from a shell script, or by opening the page by hand.

## Non-goals

- No change to the `roadmap.js` format or to what Save writes.
- No new chart features during the refactor (the "Nov wk 4" editor labels and on-screen warnings come after).
- No build step or dependencies.

## What `render()` depends on today

Globals that the draw code reads directly:

- Data from `roadmap.js`: `title`, `kinds`, `msColor`, `startDate`, `legend`, `lullLabel`, `months`, `quarters`, `lulls`, `lanes`, `editable`.
- Derived in `gantt.html`: `col` (kind to colour), `END`, `W`, `LW`, `TOP`, `RH`, `PAD`, `mw`, `x()`, `esc()`, `wrap()`, `wk()`.
- Editor state: `sel`, `selL`, `editing` (selection rings, "+ Add item" and "+ Add lane" rows).
- DOM: `document.getElementById("lt")` (lulls checkbox) and `cw.innerHTML = ...` (output).
- Clock: `new Date()` for the today line.
- Side effect: `render()` writes `i.row` and `l.lines` onto the data. `snap0()` in the undo code strips those two keys, so keep that in step.

## Target shape

1. `normalize(raw)` takes the `roadmap.js` constants and returns the model plus a list of warnings (unknown `k`, `s` out of range or reversed, months not matching quarters, quarters not contiguous). It does not throw on bad data. The model shares the `lanes` and `kinds` objects with the editor (see Risks).
2. `renderGantt(model, opts)` returns an SVG string. Pure: no DOM, no globals, no clock. `opts` carries `editing`, `selected` (item), `selectedLane`, `showLulls`, `now` (a `Date`), and `idPrefix`.
3. `gantt.html` keeps the editor, the legend, the tooltip and the checkbox, and calls `cw.innerHTML = renderGantt(model, {..., now: new Date()})`.
4. Defaults for optional fields (`kinds`, `months`, `quarters`, `lulls`, `legend`, `msColor`, `startDate`) live in `normalize`, so an embedded block can be small.
5. All text from the data is escaped wherever it goes into HTML or SVG.

## Risks to watch

- **Shared references.** `lanes` and `kinds` are mutated in place by the editor and by undo (`lanes.length=0; lanes.push(...)`). The model must hold the same objects, not copies, or edits will not show.
- **Element ids.** The pattern id `hatch` is fixed. Two charts on one page would collide. Use `idPrefix` (default empty, so the current output is unchanged).
- **Mutation inside render.** `i.row` and `l.lines` are set during render. Nothing else reads them (check before removing), so the pure version computes them locally.
- **Editor globals.** `sel`, `editing`, `dragging`, the undo stacks and the document-level key handlers stay in `gantt.html`.
- **Tooltip and cursor code** use `cw` and the `data-l`, `data-i`, `data-t`, `data-d`, `data-ln` attributes and the `g.add`, `g.addl`, `g.ln`, `g.lull` classes. Keep them exactly.
- **Tooltip HTML.** `data-d` holds `<br>` on purpose and the tooltip inserts it as HTML. Escape the data text, not the `<br>`.
- **Save format.** `ser()` writes the file from the `const editable` line down. Leave it alone.

## Known escaping gaps (fix in step 3, as its own commit)

Inserted without escaping at `a4b0c55`: lane names and descriptions, month and quarter labels, phase text, lull labels (`data-t`), item hover text `d` (`data-d` and the tooltip), `legend` entries, `lullLabel`, and the type names and keys in the item panel's Type dropdown.

## Order of work

1. **Safety net.** Add the test page and capture golden SVGs from the current code, with a fixed clock. Commit.
2. **Extract.** Move the draw code into `renderGantt` in the `gantt-render` block, with `normalize`. Golden output identical. Commit.
3. **Switch and harden.** `gantt.html` calls the new functions. Then, as separate commits: `idPrefix` and the two-instance test; escaping fixes with their tests; the remaining tests below.
4. **Check.** All automated tests pass, then the manual checklist in a browser.
5. Later: "Nov wk 4" labels in the editor, warnings shown on screen, embedding, export.

Commit each step (and each sub-step in 3) separately so any one can be reverted.

## Tests

`test/run.html` loads `roadmap.js`-style data and the `gantt-render` block, runs the checks and writes a pass or fail summary into the page. `test/run.sh` runs it headless and prints the result.

### Automated

1. **Golden output.** Captured from the current code before any change, with the clock fixed at 2027-11-10. Cases: view mode; `editing` with one item selected; lulls hidden; today outside the chart. After the refactor the renderer must produce identical strings. Goldens are stored as `.js` files so the test page can load them with a script tag.
2. **Structure checks** on the SVG for the sample data:
   - one `<g data-l data-i>` per item;
   - one lane name text per lane;
   - lulls visible when shown and hidden when not;
   - milestone items contain a diamond `<path>`; TBC items contain `stroke-dasharray`.
3. **Edge cases** (small hand-built data):
   - empty `lanes`, and a lane with no items;
   - an item with zero width, and with `s[1]` at `END`;
   - a bar under half a week wide with `ms:1` shows only the diamond;
   - label placement: right of the bar, then left, then inside in white;
   - `<`, `&` and `"` in titles, lane names, hover text, months, legend and lull labels are escaped in text and in `data-*` attributes;
   - unknown `k` does not throw, and `normalize` warns about it.
4. **normalize warnings** for each check in Target shape 1, and none for the sample files.
5. **Round trip.** `ser()` output evaluated back gives the same data as the input (guards the Save format).
6. **Two instances.** Two charts with different `idPrefix` values have no duplicate ids.

### Manual checklist (browser, `gantt.html`)

Run once in Chrome or Edge after step 3.

- Page title comes from `roadmap.js`; legend, lull checkbox and Show/Hide legend work.
- The today line and its date label show (or are hidden when today is outside the chart).
- Hover tips show the title, week range and hover text.
- Edit button: bars drag sideways, ends resize, up/down drag reorders and locks to one axis.
- Click selects, second click renames in place, click on empty chart area deselects, Esc deselects.
- Panel: every field updates the bar; lane dropdown moves the item; Up/Down/Delete/Close work.
- Lane panel and Types panel: rename, recolour, add, delete, move.
- Delete and Backspace delete the selected item, but not while typing in a field.
- Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y work; a drag is one undo step; undoing back to the saved state clears "Unsaved changes".
- Save writes `roadmap.js` and it reloads identically; Export and Discard work.
- `editable=false` hides all editing.
- Open from `file://` (no server) to confirm the script-tag loading still works.
