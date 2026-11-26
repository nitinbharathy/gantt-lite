# Tests

Browser tests, no Node. They run in headless Edge.

- Run: `sh test/run.sh`. The first line of the output is `PASS n/n` or `FAIL k/n` (k failures). Exit code is non-zero on FAIL.
- By hand: open `test/run.html` in a browser started with `--allow-file-access-from-files` (it fetches `gantt.html`).
- Set `EDGE=/path/to/msedge-or-chrome` to use another browser.

## How it works

`harness.js` loads `gantt.html`'s inline script into a fresh iframe with `roadmap-sample.js` as data and a fixed clock, then returns the exact string `render()` assigned to `#cw.innerHTML`. Cases are listed in `CASES`. Add checks in `run.html` with `test(name, fn)` and `eq(actual, expected)`.

## What is covered

- **Page goldens**: `gantt.html` run in an iframe (`legacyRun`), for view, edit with an item selected, edit with a lane selected, lulls hidden, and today outside the chart. Compared to `golden/goldens.js`.
- **Renderer goldens**: the `gantt-render` block (`loadApi`) called directly with the same options on `roadmap-sample.js`, compared to the same goldens. Also checks that `renderGantt` does not mutate the model.
- **idPrefix**: two charts with different prefixes have no duplicate `id`s.
- **Escaping**: `<b>`, `&amp;`, quotes in title, lane name and info, months, quarter label and phase, lull label, item title and hover text. The SVG has no raw tags, parses as XML (the literal `<br>` in `data-d` is swapped out first, XML forbids `<` in attributes), shows the original text, and the tooltip expression gives the same text. Legend, lull checkbox label and Type options in `gantt.html` are only checked by looking for `esc(` in the source.
- **Structure**: one `g[data-l][data-i]` per item, one lane name per lane, lulls shown or hidden, diamonds on milestones, dashes on TBC items.
- **Edge cases**: no lanes, empty lane (also in edit mode), zero-width item, item ending at the last week, milestone bar under half a week (diamond only), label right / left / inside in white, unknown type.
- **normalize**: warnings for unknown type, reversed or out-of-range weeks, months not matching quarters, non-contiguous quarters; none for `roadmap-sample.js` and `roadmap.js`; `lanes` and `kinds` shared with the input; defaults for a minimal input.
- **Save round trip**: `ser()` output from the page, evaluated back, equals `roadmap-sample.js` as JSON.

**Editor smoke test** (`sh test/smoke.sh`, same output contract): loads the real `gantt.html` in an iframe with `roadmap-sample.js` as data and drives the editor with synthetic DOM events (view toggles, hover tip, select, drag move/resize/reorder, undo/redo, panel fields, delete keys, lanes, types, inline rename, Export into a stubbed clipboard). Any `window.onerror` or `console.error` in the page fails the test. Save and Discard are never clicked. Not covered: real mouse or keyboard input, the Save file picker, Discard, and the today line.

## Goldens

`golden/goldens.js` holds the expected SVG per case. Recapture only when the output is meant to change: `sh test/capture.sh`, then review the diff.

They are `.js` files (`window.GOLDEN=...`) because a file:// page can load data by script tag but not read other files freely.
