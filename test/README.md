# Tests

Browser tests, no Node. They run in headless Edge.

- Run: `sh test/run.sh`. The first line of the output is `PASS n/n` or `FAIL k/n` (k failures). Exit code is non-zero on FAIL.
- By hand: open `test/run.html` in a browser started with `--allow-file-access-from-files` (it fetches `gantt.html`).
- Set `EDGE=/path/to/msedge-or-chrome` to use another browser.

## How it works

`harness.js` loads `gantt.html`'s inline script into a fresh iframe with `roadmap-sample.js` as data and a fixed clock, then returns the exact string `render()` assigned to `#cw.innerHTML`. Cases are listed in `CASES`. Add checks in `run.html` with `test(name, fn)` and `eq(actual, expected)`.

## Goldens

`golden/goldens.js` holds the expected SVG per case. Recapture only when the output is meant to change: `sh test/capture.sh`, then review the diff.

They are `.js` files (`window.GOLDEN=...`) because a file:// page can load data by script tag but not read other files freely.
