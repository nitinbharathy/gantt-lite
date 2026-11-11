// SAMPLE roadmap data for the timeline page. Fictional, for testing. Rename to roadmap.js to use it (keep it in the same folder as the HTML).
//
// FORMAT
// Time is counted in WEEKS from 1 Aug 2027, with 4 weeks to a month (so the 11 months Aug to Jun are weeks 0 to 44).
//            Aug 0-4 | Sep 4-8 | Oct 8-12 | Nov 12-16 | Dec 16-20 | Jan 20-24 | ... | Jun 40-44
//            Early = week 1 of the month, mid = weeks 2-3, late = week 4. e.g. Late Nov = [15,16], Mid-end Dec = [17,20].
// months   : month labels, left to right (4 weeks each).
// quarters : [label, startWeek, endWeek, phase, colour]. Phase is the text under the heading.
// lanes    : [{ n: lane name, info: optional list of phrases, joined with commas into one wrapped text block under the lane name, items: [...] }]. Each item gets its own row, in order.
// item     : t  title shown next to the bar
//            k  type and colour: dev = Development (grey), uat = UAT and training, go = Onboarding / cutover, roll = Rollout (purple), ref = Detailed on another slide (orange), adm = Admin (light grey)
//            s  [startWeek, endWeek]. Each white tick inside a bar is 1 week.
//            d  extra hover text (optional). The week range is worked out from s, so do not put dates here
//            ms 1 = draw a milestone diamond at the end of the bar (a bar under half a week wide shows only the diamond)
//            tbc 1 = plan not final: dashed, pale bar and "(TBC)" in the label
//            Labels go right of the bar; if no room, left of the bar; if still none, inside the bar in white.
// editable : feature flag. true = shows an Edit button; the page stays in view mode until it is clicked. Then drag/resize/edit bars and Save to roadmap.js (Chrome/Edge) or Copy. false = no editing.
//            Save rewrites everything from the "const editable" line down, so keep this comment header above it.
// title    : heading above the chart.
// kinds    : item type (the k field) -> legend label and colour.
// msColor  : colour of milestone diamonds.
// todayWeek: week position of the red "today" line.
// legend   : extra plain-text legend entries, after the colour swatches.
// lullLabel: label of the show/hide lulls checkbox.
const editable=true;
const title="Example project plan";
const kinds={"dev":["Development","#6B7280"],"uat":["UAT and training","#C13584"],"go":["Onboarding / cutover","#2F6FDE"],"roll":["Rollout","#8E5BD9"],"ref":["Detailed on another slide","#E08A00"],"adm":["Admin","#A8AFB8"]};
const msColor="#1B9E77";
const todayWeek=1.5;
const legend=["White ticks inside a bar = 1 week","Pilot = limited early users"];
const lullLabel="Show lull periods";
const months=["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
const quarters=[["Q3 2027",0,8,"Pilot","#2F6FDE"],["Q4 2027",8,20,"Pilot","#2F6FDE"],["Q1 2028",20,32,"Stabilise","#1B9E77"],["Q2 2028",32,44,"Live","#1B9E77"]];
// lulls    : [startWeek, endWeek, label]. Calendar lulls drawn as a hatched band across all lanes.
const lulls=[[7,9,"Holiday break A"],[13,14,"Holiday break B"]];
const lanes=[
 {n:"Product A",info:["Module one","Module two","Module three","Messaging link","Analytics"],items:[
  {t:"Build",k:"dev",s:[1,7],d:""},
  {t:"Internal trial",k:"dev",s:[7,9],d:""},
  {t:"UAT + training",k:"uat",s:[10,12],d:""},
  {t:"Group 1 onboarding (manual)",k:"go",s:[11,15],d:""},
  {t:"Messaging integration",k:"go",s:[9,13],d:""},
  {t:"Early access: Group 1 cutover",k:"go",s:[16,17],d:"Users switch over from the legacy tool",ms:1},
  {t:"General release",k:"go",s:[22,22.2],d:"Open to all remaining groups",ms:1}]},
 {n:"Product B",items:[
  {t:"Scoping",k:"dev",s:[10,13],d:""},
  {t:"Internal trial",k:"dev",s:[13,15],d:""},
  {t:"UAT",k:"uat",s:[16,18],d:""},
  {t:"Group 2 cutover",k:"go",s:[18,19],d:"",ms:1}]},
 {n:"Oversight",items:[
  {t:"Publish guidelines",k:"ref",s:[6,19],d:"Sometime in Q4"},
  {t:"UAT + Training",k:"uat",s:[16,18],d:""},
  {t:"Oversight team onboarding",k:"go",s:[18,21],d:"",ms:1},
  {t:"Oversight fully operational",k:"ref",s:[23,42],d:"Oversight team takes over from the interim process"},
  {t:"Summary reports",k:"dev",s:[13,19],d:"Scoping, milestone at end. Contents still TBC",ms:1,tbc:1}]},
 {n:"Infrastructure and rollout",items:[
  {t:"Supplier selection",k:"adm",s:[2,9],d:"",ms:1},
  {t:"Integration layer",k:"dev",s:[14,23],d:""},
  {t:"Security test, readiness check",k:"dev",s:[17,22],d:"",ms:1},
  {t:"8 key systems (2 waves)",k:"roll",s:[23,33],d:"2 waves. W1: systems 1 to 4. W2: systems 5 to 8"},
  {t:"Legacy tool retirement",k:"go",s:[21.8,22],d:"End date not known yet",ms:1,tbc:1}]}
];
