# roadmap.js format

Spec for `roadmap.js`, the data file read by `gantt.html`. Written so a person or an LLM can create or change the file correctly. `roadmap-sample.js` is a full working example.

## Rules that must hold

- The file is plain JavaScript: only `const` declarations and comments. No imports, no functions, no `export`. The page loads it with a `<script>` tag.
- Every constant below must be present, with exactly these names. A missing one stops the page from drawing.
- Strings use double quotes. Escape any `"` inside a string as `\"`.
- Keep the comment header above `const editable`. The editor's Save rewrites everything from the `const editable` line down and keeps what is above it.
- Time is in weeks counted from a start date you choose, with 4 weeks to a month. Week 0 is the start of the first month.
- Chart length (`END`) is the end week of the last entry in `quarters`. Everything is drawn from 0 to `END`.

## Constants

| Name | Type | Meaning |
|---|---|---|
| `editable` | `true` or `false` | `true` shows the Edit button. `false` makes the page read-only. |
| `title` | string | Page heading and browser tab title. |
| `kinds` | object | Item type to `[legend label, colour]`. Example: `"dev":["Development","#6B7280"]`. |
| `msColor` | string | Colour of milestone diamonds. |
| `todayWeek` | number | Week position of the red "today" line. |
| `legend` | array of strings | Extra plain-text legend entries shown after the colour swatches. May be `[]`. |
| `lullLabel` | string | Label of the show/hide lulls checkbox. |
| `months` | array of strings | Month labels, left to right, 4 weeks each. Length must be `END / 4`. |
| `quarters` | array | Each entry is `[label, startWeek, endWeek, phase, colour]`. Entries must be contiguous: each starts where the previous ended, the first starts at 0. `phase` is the text under the heading. |
| `lulls` | array | Each entry is `[startWeek, endWeek, label]`. Hatched band across all lanes. May be `[]`. |
| `lanes` | array | The rows of the chart. See below. |

Keep the declaration order as in the sample.

### Lanes and items

```js
const lanes=[
 {n:"Lane name",info:["Optional description"],items:[
  {t:"Item title",k:"dev",s:[2,6],d:"Hover text"}
 ]}
];
```

Lane:

- `n` (required): lane name.
- `info` (optional): list of text phrases. They are joined with ", " and wrapped into one block under the lane name. Leave it out for no description. The in-page editor writes one phrase of free text.
- `items` (required): list of items, may be `[]`. Each item gets its own row, in order. Lane order in the array is the order on the chart.

Item:

- `t` (required): title, shown next to the bar.
- `k` (required): type. Must be a key of `kinds`, or the bar has no colour.
- `s` (required): `[startWeek, endWeek]`. Both between 0 and `END`, start not after end. Halves are fine (`7.5`). A week is 1 unit, so `[16,17]` is one week.
- `d` (optional, use `""` for none): hover text. Do not put dates in it. The week range is worked out from `s`.
- `ms` (optional): `1` draws a milestone diamond at the end of the bar. A bar under half a week wide shows only the diamond. For a point-in-time milestone use a tiny range such as `[22,22.2]`.
- `tbc` (optional): `1` means the plan is not final. Draws a dashed, pale bar and adds "(TBC)" to the label.

Omit `ms` and `tbc` when they are off. Do not write `0` or `false`.

## Converting dates to weeks

Pick the start date (week 0, the first day of the first month). Then:

- week = 4 x (months since the start month) + position in month, where early = week 1 of the month, mid = weeks 2 to 3, late = week 4.
- With a start of 1 Aug: the whole of September is `[4,8]`, late November is `[15,16]`, mid to end of December is `[17,20]`.
- The 4-weeks-to-a-month rule is a simplification. Round to the nearest half week.

## Minimal valid file

```js
const editable=true;
const title="Small plan";
const kinds={"dev":["Development","#6B7280"],"go":["Go live","#2F6FDE"]};
const msColor="#1B9E77";
const todayWeek=1;
const legend=[];
const lullLabel="Show lull periods";
const months=["Jan","Feb","Mar"];
const quarters=[["Q1",0,12,"Build","#2F6FDE"]];
const lulls=[];
const lanes=[
 {n:"Team A",items:[
  {t:"Build",k:"dev",s:[0,8],d:""},
  {t:"Launch",k:"go",s:[8,8.2],d:"",ms:1}
 ]}
];
```

## Tasks

- **Create from a description:** choose the start date and `END` (a multiple of 4, matching `months`), write `quarters` and `months`, define `kinds` for the types you need, then the lanes. Copy the comment header from `roadmap-sample.js`.
- **Add an item:** append to the lane's `items`. Check `k` is in `kinds` and `s` is within 0 to `END`.
- **Add a lane:** append an object to `lanes` with `n` and `items`.
- **Add a type:** add a key to `kinds`, then use it as `k`. (In the page: Edit, then Types. New types get a key like `t1`; keys can be renamed by editing the file.)
- **Extend the timeline:** add months to `months` and extend or add a `quarters` entry so the last end week equals 4 x the number of months.
- **Checks before finishing:** all constants present; `months.length * 4` equals the last quarter's end; every `k` is in `kinds`; every `s` is within range; the file has no syntax errors (balanced brackets, commas between items, no trailing text).
