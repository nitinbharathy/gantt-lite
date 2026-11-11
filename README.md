# gantt-lite

A single-page roadmap timeline chart. Hand-written SVG and JS, no build step, no dependencies. Open the HTML in a browser.

## Files

- `gantt.html`: the chart, with an in-page editor.
- `roadmap.js`: the data and config. This is the file you edit.

Keep both in the same folder. The page loads `roadmap.js` with a `<script>` tag, because pages opened from `file://` can't `fetch()`.

## Use

1. Open `gantt.html` in a browser.
2. Edit `roadmap.js` and refresh.

## Data format

Time is in weeks from the start date, 4 weeks to a month. The comment header in `roadmap.js` is the full reference. In short:

- `lanes`: each has a name, optional `info` phrases and a list of `items`. Each item gets its own row.
- item: `t` title, `k` type (sets colour), `s` `[startWeek, endWeek]`, `d` hover text, `ms` 1 for a milestone diamond, `tbc` 1 for a dashed pale bar.
- `kinds`: item type to legend label and colour.
- `months`, `quarters`, `lulls`: the axis, quarter headings and hatched calendar lulls.
- `todayWeek`: position of the red today line.

## Edit mode

Set `const editable=true` in `roadmap.js`, then click **Edit** in the top right.

- Drag a bar sideways to move it in time. Drag an end to resize it.
- Drag a bar up or down to reorder it within its lane. A drag locks to the direction you start in, so release and drag again to move it the other way.
- Click a bar to select it. Click it again to rename it in place.
- The bottom panel edits type, lane (moves the item to the end of another lane), weeks, hover text, milestone and TBC. It also reorders (up/down buttons) and deletes items.
- **Ctrl+Z** undoes and **Ctrl+Shift+Z** (or **Ctrl+Y**) redoes, up to 200 steps. A drag, a typing burst or a button click is one step. History is lost on reload. Inside a text field Ctrl+Z stays the browser's own text undo.
- **Delete** or **Backspace** deletes the selected item (not while typing in a field).
- **Esc** or a click on an empty part of the chart unselects.
- **Save** writes to `roadmap.js` through a file picker (Chrome or Edge only).
- **Export** copies the new data to the clipboard. Paste it over everything from `const editable` down in `roadmap.js`.
- **Discard** reloads the page and drops unsaved changes.

Save rewrites everything from the `const editable` line down, so keep the comment header above it.

## Notes

- A page opened from `file://` can't know its own folder, so the Save picker may not start there. The browser remembers the last folder after the first use.
- Set `editable=false` to hide editing for a read-only copy.
