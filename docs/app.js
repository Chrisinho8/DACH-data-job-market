/* ---------------- palette ---------------- */
const CORAL = "#E56743", CLAY = "#D07B55", SAGE = "#6FA37F",
      SLATE = "#6B6558", LINE = "#EDE4D3",
      DEEP  = "#AC4123", AMBER = "#E3A23F", TEAL = "#4E9FA5",
      PLUM  = "#9C6B9E", STEEL = "#5C87A8", MOSS = "#5F977F",
      SAND  = "#CBA55F";

/* Splitting AI into families took the role count from 10 to 15, so a
   10-colour cycle would have repeated. Six more, chosen to stay
   distinguishable in the same muted range.                         */
const ROSE = "#BE5B7E", INDIGO = "#6A6DB0", OLIVE = "#93A04B",
      OCEAN = "#3E7E96", STONE = "#8A857C", RUST  = "#A55A33";

const CATS = [CORAL, STEEL, SAGE, AMBER, PLUM, TEAL,
              CLAY, SAND, MOSS, DEEP,
              ROSE, INDIGO, OLIVE, OCEAN, STONE, RUST];

/* Fixed colour per role, so a role keeps its colour across
   every chart on the page even when the sort order differs. The AI
   families share the warm end of the palette and the data families
   the cool end, which makes the AI block readable as a block.     */
const ROLE_COLOUR = {
  "ai engineer":   CORAL,  "genai / llm":   DEEP,
  "ml engineer":   CLAY,   "mlops":         RUST,
  "ai consultant": AMBER,  "ai research":   SAND,
  "ai / ml":       CORAL,          /* pre-split snapshots */

  "data engineer":      STEEL,  "data analyst":    SAGE,
  "data scientist":     TEAL,   "data architect":  INDIGO,
  "analytics engineer": MOSS,   "dwh / etl":       OCEAN,
  "data governance":    PLUM,   "data consultant": OLIVE,
  "bi developer":       ROSE
};

/* falls back to the cycle for any family the map has not seen */
const rcol = (rf, i) =>
  ROLE_COLOUR[String(rf).toLowerCase()] || CATS[i % CATS.length];

/* The six published AI families, plus two names that only appear in
   older data/ snapshots: "ai / ml" from before the split, and
   "ai (other)" from the window when the vague bucket was still
   published. Both are kept so an old snapshot still totals correctly.
   Anything asking "how much of this is AI" must sum this set, never
   test one string.                                                */
const AI_SET = new Set([
  "ai engineer", "genai / llm", "ml engineer", "mlops",
  "ai consultant", "ai research",
  "ai / ml", "ai (other)"        /* legacy snapshots only */
]);
const isAI = rf => AI_SET.has(String(rf).toLowerCase());

/* Families the pipeline no longer publishes. A current data/ refresh
   contains none of these; they are filtered out rather than trusted to
   be absent, so an old JSON file cannot resurrect a chart series the
   surrounding copy no longer explains.                             */
const RETIRED = new Set(["ai (other)", "ai / ml"]);
const isLive  = rf => !RETIRED.has(String(rf).toLowerCase());
const live    = rows => rows.filter(r => isLive(r.role_family));

/* Tool categories are published as snake_case identifiers. Rewrite
   them for display only; the pipeline values must not change.     */
const SKILL_CAT_LABEL = {
  ml_framework: "ML frameworks",
  mlops:        "MLOps",
  genai:        "Generative AI",
  nlp_cv:       "NLP / computer vision",
  language:     "Languages",
  processing:   "Processing",
  streaming:    "Streaming",
  warehouse:    "Warehouse",
  orchestr:     "Orchestration",
  transform:    "Transformation",
  database:     "Databases",
  cloud:        "Cloud",
  devops:       "DevOps",
  bi:           "BI",
  platform:     "Platform",
  enterprise:   "Enterprise",
  practice:     "Practices",
  legacy:       "Legacy"
};
const scat = c => SKILL_CAT_LABEL[c] || String(c).replace(/_/g, " ");

/* Skills are published as dictionary keys ("ai_agents", "powerbi").
   Display names only; filters and searches keep the keys.          */
const SKILL_LABEL = {
  ai_agents: "AI agents", ai_eval: "AI evaluation", airflow: "Airflow",
  aws: "AWS", azure: "Azure", azureml: "Azure ML", bigquery: "BigQuery",
  cicd: "CI/CD", cv: "Computer vision", databricks: "Databricks",
  datawarehouse: "Data warehousing", dbt: "dbt",
  deeplearning: "Deep learning", docker: "Docker",
  elastic: "Elasticsearch", etl: "ETL", excel: "Excel",
  featurestore: "Feature stores", finetuning: "Fine-tuning",
  flink: "Flink", gcp: "Google Cloud", genai: "GenAI", git: "Git",
  hadoop: "Hadoop", java: "Java", javascript: "JavaScript", jax: "JAX",
  kafka: "Kafka", kubernetes: "Kubernetes", langchain: "LangChain",
  llm: "LLMs", looker: "Looker", mssql: "SQL Server", mysql: "MySQL",
  nlp: "NLP", openai_api: "OpenAI API", oracle: "Oracle", php: "PHP",
  postgres: "PostgreSQL", powerbi: "Power BI",
  prompting: "Prompt engineering", python: "Python", pytorch: "PyTorch",
  qlik: "Qlik", r_lang: "R", rag: "RAG", redshift: "Redshift",
  sagemaker: "SageMaker", sap: "SAP", sklearn: "scikit-learn",
  snowflake: "Snowflake", spark: "Spark", sql: "SQL", ssis: "SSIS",
  synapse: "Synapse", tableau: "Tableau", tensorflow: "TensorFlow",
  terraform: "Terraform", vectordb: "Vector databases",
  vertexai: "Vertex AI"
};
const slab = k => SKILL_LABEL[k] || String(k).replace(/_/g, " ");
/* Generative-AI skills: the "genai" category of skill_demand.json,
   which tops this list up when it loads. */
const GENAI = new Set(["ai_agents", "llm", "genai", "prompting", "rag",
  "openai_api", "ai_eval", "finetuning", "langchain", "vectordb"]);

const CNAME = { de: "Germany", at: "Austria", ch: "Switzerland" };
/* inline SVG flags: the emoji ones do not render on Windows */
const CFLAG = {
  de: '<svg class="fl" viewBox="0 0 15 10" aria-hidden="true">' +
      '<rect width="15" height="10" fill="#262626"/>' +
      '<rect y="3.4" width="15" height="6.6" fill="#CE2029"/>' +
      '<rect y="6.7" width="15" height="3.3" fill="#F0B637"/></svg>',
  at: '<svg class="fl" viewBox="0 0 15 10" aria-hidden="true">' +
      '<rect width="15" height="10" fill="#CE2029"/>' +
      '<rect y="3.4" width="15" height="3.3" fill="#FFFFFF"/></svg>',
  ch: '<svg class="fl fl-ch" viewBox="0 0 10 10" aria-hidden="true">' +
      '<rect width="10" height="10" rx="1.5" fill="#CE2029"/>' +
      '<rect x="4.1" y="2" width="1.8" height="6" fill="#FFFFFF"/>' +
      '<rect x="2" y="4.1" width="6" height="1.8" fill="#FFFFFF"/></svg>',
};
const CCOL  = { de: CORAL,     at: STEEL,     ch: SAGE };
const CORDER = ["de", "at", "ch"];

Chart.defaults.font.family =
  "Inter, system-ui, -apple-system, Segoe UI, sans-serif";
Chart.defaults.color = SLATE;
Chart.defaults.borderColor = LINE;

/* The page runs at html{zoom:.8} on desktop. Chart.js reads the mouse
   from offsetX, which the browser reports in zoomed pixels, while the
   chart lays itself out in unzoomed ones, so the hovered day drifted
   left of the cursor (by a fifth of the chart at the right edge).
   Re-derive the position from clientX and the canvas' on-screen box,
   which always share one coordinate space, before Chart.js uses it.
   Registered once, so it covers every chart on the page.          */
Chart.register({
  id: "zoomSafePointer",
  beforeEvent(chart, args) {
    const e = args.event, n = e && e.native;
    if (!n) return;
    const p = n.touches && n.touches.length ? n.touches[0]
      : n.changedTouches && n.changedTouches.length ? n.changedTouches[0] : n;
    if (p.clientX == null) return;
    const r = chart.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    e.x = (p.clientX - r.left) / r.width * chart.width;
    e.y = (p.clientY - r.top) / r.height * chart.height;
    if (typeof chart.isPointInArea === "function")
      args.inChartArea = chart.isPointInArea(e);
  }
});

/* Time charts hover the slot (day or week) under the cursor, even one
   without data, instead of the nearest point that has some, which
   jumped right across the October outage. */
Chart.Interaction.modes.slot = (chart, e) => {
  const x = chart.scales.x, a = chart.chartArea;
  const n = chart.data.labels.length;
  if (!x || !a || !n || e.x == null || e.x < a.left || e.x > a.right) return [];
  const i = Math.max(0, Math.min(n - 1, Math.round(x.getValueForPixel(e.x))));
  return chart.getSortedVisibleDatasetMetas()
    .filter(m => m.data[i])
    .map(m => ({ element: m.data[i], datasetIndex: m.index, index: i }));
};
/* tooltip at the hovered values, or at the cursor when there are none */
Chart.Tooltip.positioners.slot = (items, pos) => {
  const pts = items
    .map(it => it.element && !it.element.skip ? it.element.tooltipPosition() : null)
    .filter(q => q && isFinite(q.x) && isFinite(q.y));
  if (pts.length) return {
    x: pts.reduce((t, q) => t + q.x, 0) / pts.length,
    y: pts.reduce((t, q) => t + q.y, 0) / pts.length };
  return pos && isFinite(pos.x) ? { x: pos.x, y: pos.y } : false;
};

/* The email link is put together here, so the address never sits
   in the HTML as plain text for spam bots to scrape. */
document.querySelectorAll("a[data-mail]").forEach(a => {
  const [u, d] = a.dataset.mail.split("|");
  a.href = "mailto:" + u + "@" + d;
  a.title = u + "@" + d;
});

/* One request per file: several blocks read the same JSON (history.json
   alone is close to 1 MB), so the promise is shared. Readers must not
   mutate what they get back. */
const _got = {};
const get = f => _got[f] || (_got[f] =
  fetch(`data/${f}.json`).then(r => r.json()).catch(() => null));

const cyc = i => CATS[i % CATS.length];
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/* ---- city display names -------------------------------------------
   The pipeline folds umlauts for matching (ä->ae, ü->ue, ö->oe), so
   the JSON carries "muenchen". Un-folding generically is unsafe
   ("auerbach" is not "äurbach"), so known cities are mapped
   explicitly and everything else is just title-cased per word. */
const CITY_NAMES = {
  muenchen: "München", koeln: "Köln", duesseldorf: "Düsseldorf",
  nuernberg: "Nürnberg", muenster: "Münster", wuerzburg: "Würzburg",
  saarbruecken: "Saarbrücken", fuerth: "Fürth", tuebingen: "Tübingen",
  goettingen: "Göttingen", luebeck: "Lübeck", osnabrueck: "Osnabrück",
  moenchengladbach: "Mönchengladbach", muelheim: "Mülheim",
  guetersloh: "Gütersloh", lueneburg: "Lüneburg", dueren: "Düren",
  huerth: "Hürth", ruesselsheim: "Rüsselsheim", zuerich: "Zürich",
  luedenscheid: "Lüdenscheid", tuttlingen: "Tuttlingen",
  fuessen: "Füssen", muellheim: "Müllheim", pruem: "Prüm",
  guenzburg: "Günzburg", nuertingen: "Nürtingen",
  boeblingen: "Böblingen", goeppingen: "Göppingen",
  luebbecke: "Lübbecke", zuelpich: "Zülpich",
};
const cityName = s => {
  if (!s) return s;
  const k = String(s).toLowerCase();
  if (CITY_NAMES[k]) return CITY_NAMES[k];
  return k.split(/([ -])/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)).join("");
};

/* ---- display names for roles ----------------------------
   The keys are the raw values published by the pipeline and must
   not change. Only the labels shown to a reader are rewritten, so
   nothing downstream of gold breaks.                              */
const ROLE_LABEL = {
  /* the seven AI families that replaced the single "ai / ml" one */
  "ai engineer":        "AI Engineer",
  "genai / llm":        "GenAI / LLM Engineer",
  "ml engineer":        "ML Engineer",
  "mlops":              "MLOps / ML Platform",
  "ai consultant":      "AI Consulting",
  "ai research":        "AI Research",   /* incl. applied scientist */
  /* kept so an older data/ snapshot still renders a sane label if one
     of these ever slips past the RETIRED filter */
  "ai / ml":            "AI/ML (pre-split)",
  "ai (other)":         "AI, role unspecified (retired)",

  "data engineer":      "Data Engineer",
  "data scientist":     "Data Scientist",
  "data analyst":       "Data Analyst",
  "data architect":     "Data Architect",
  "analytics engineer": "Analytics Engineer",
  "dwh / etl":          "Data Warehouse / ETL",
  "data governance":    "Data Governance and Security",
  "data consultant":    "Data Consultant",
  "bi developer":       "BI Developer",
  "all roles":          "All roles"
};
/* Chart.js clips a y-axis label once it needs more than about a
   third of the chart width, which truncated "Data Governance and
   Security". An array of strings renders as stacked lines, so wrap
   long names instead of shortening them.                          */
const wrap = (s, max = 18) => {
  const out = [];
  String(s).split(" ").forEach(w => {
    if (out.length && (out[out.length - 1] + " " + w).length <= max)
      out[out.length - 1] += " " + w;
    else out.push(w);
  });
  return out.length > 1 ? out : out[0];
};

/* falls back to title case for anything the map has not seen */
const rlab = s => ROLE_LABEL[String(s).toLowerCase()] ||
  String(s).split(" ").map(w =>
    w === "/" ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const set = (id, v) => {
  const e = document.getElementById(id);
  if (e) e.textContent = v;
};

function ds(label, data, colour) {
  return { label, data, backgroundColor: colour,
           borderRadius: 3, barPercentage: 0.82 };
}

/* ---- sizing horizontal bar charts ------------------------------
   These charts were laid out by canvas aspect ratio, which fixes the
   height and then divides it by however many rows there happen to be.
   Sixteen roles in a half-width column left about 19px per
   row, and `wrap()` had already turned the longer names into two and
   three line labels needing more than that, so they overprinted each
   other and the axis title.

   Height is now derived from the content: count the lines every label
   actually needs, give each row that much space plus padding, and set
   the container to the total. Adding a family makes the chart taller
   instead of making it illegible.                                */
const ROW_LINE_PX = 15,   /* one line of tick text                 */
      ROW_PAD_PX  = 11,   /* breathing room between rows           */
      ROW_MIN_PX  = 24,   /* a single-line row still needs a bar   */
      CHART_CHROME_PX = 62;  /* x axis ticks + axis title          */

function fitHeight(labels, ax) {
  const rows = labels.reduce((h, l) => h + Math.max(
    ROW_MIN_PX,
    (Array.isArray(l) ? l.length : 1) * ROW_LINE_PX + ROW_PAD_PX), 0);
  return Math.ceil(rows + CHART_CHROME_PX + (ax && ax.x ? 16 : 0));
}

/* Chart.js reads its height from the parent when the aspect ratio is
   off, so give the canvas a parent of its own rather than resizing
   whatever happens to wrap it (usually a column that also holds a
   heading). Idempotent: re-rendering a chart reuses the same box. */
function sizeBox(el, px) {
  let b = el.parentNode;
  if (!b || !b.classList.contains("cbox")) {
    b = document.createElement("div");
    b.className = "cbox";
    el.parentNode.insertBefore(b, el);
    b.appendChild(el);
  }
  b.style.height = px + "px";
  return b;
}

/* ax is optional: { x: "label for the x axis", y: "label for the y axis" }.
   Titles are what a reader needs to know what the numbers mean, so every
   call site passes them.                                              */
function bar(id, labels, datasets, horizontal, stacked, pct, ax) {
  const el = document.getElementById(id);
  /* canvases only: "roles" is also a section id */
  if (!el || el.tagName !== "CANVAS") return;
  const t = s => ({ display: !!s, text: s || "",
                    font: { size: 11.5, weight: "600" }, color: SLATE });
  ax = ax || {};

  /* Single-series horizontal charts are the ones with a row per role
     family, so they are the ones that need content-driven height. A
     stacked chart's rows are countries, and its legend height is not
     something this can measure, so leave those on aspect ratio. */
  const fit = horizontal && datasets.length === 1;
  if (fit) sizeBox(el, fitHeight(labels, ax));

  new Chart(el, {
    type: "bar",
    data: { labels, datasets },
    options: {
      maintainAspectRatio: !fit,
      indexAxis: horizontal ? "y" : "x",
      plugins: {
        legend: { display: datasets.length > 1,
                  labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: pct ? { callbacks: { label: c =>
          `${c.dataset.label}: ${c.raw}%` } } : {}
      },
      /* ax.pick turns a bar into a link into the postings browser, so
         a reader can go from "Data Engineer is the tallest bar" to the
         973 rows that made it tall. Charts without a pick behave as
         before. */
      onClick: (e, els) => {
        if (ax.pick && els.length) ax.pick(els[0].index);
      },
      onHover: (e, els) => {
        const c = e.native && e.native.target;
        if (c) c.style.cursor =
          (ax.pick && els.length) ? "pointer" : "default";
      },
      scales: {
        x: { stacked: !!stacked, max: pct ? 100 : undefined,
             title: t(ax.x),
             grid: { color: LINE, drawBorder: false } },
        y: { stacked: !!stacked, grid: { display: false },
             title: t(ax.y),
             ticks: { autoSkip: false } }
      }
    }
  });
}

function scatter(id, points, xLabel, yLabel, colourFn) {
  const el = document.getElementById(id);
  if (!el) return;
  new Chart(el, {
    type: "bubble",
    data: { datasets: [{
      data: points,
      backgroundColor: points.map(p => colourFn(p)),
      borderColor: "#FAF9F5", borderWidth: 1 }]},
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c =>
          `${c.raw.name}: ${c.raw.x} / ${c.raw.y}` } }
      },
      scales: {
        x: { title: { display: true, text: xLabel },
             grid: { color: LINE } },
        y: { title: { display: true, text: yLabel },
             grid: { color: LINE } }
      }
    }
  });
}

/* ISO date -> DD-MM-YYYY. Anything that is not a plain ISO date is
   passed through untouched rather than mangled. */
function euroDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").slice(0, 10));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function ageColour(d) {
  if (d == null) return "#B8B2A4";
  if (d < 25) return MOSS;
  if (d < 40) return "#9DA97E";
  if (d < 55) return AMBER;
  if (d < 75) return CLAY;
  return DEEP;
}

/* ---- days, weeks and pipeline gaps --------------------------------
   Dates arrive as ISO strings, sometimes with a time part. Everything
   here works on the first ten characters in UTC, so no timezone can
   shift a day. Weeks run Monday to Sunday.                         */
const MON3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = s => String(s || "").slice(0, 10);
const dayTs = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const addDays = (s, n) => new Date(dayTs(s) + n * 864e5).toISOString().slice(0, 10);
const fDay = s => `${+s.slice(8, 10)} ${MON3[+s.slice(5, 7) - 1]}`;
const fDayW = s => `${WD3[new Date(dayTs(s)).getUTCDay()]} ${fDay(s)}`;
const fRange = (a, b) => a === b ? fDay(a)
  : a.slice(5, 7) === b.slice(5, 7) ? `${+a.slice(8, 10)}–${fDay(b)}`
  : `${fDay(a)} – ${fDay(b)}`;
const dayList = (a, b) => {
  const out = [];
  for (let d = a; d <= b; d = addDays(d, 1)) out.push(d);
  return out;
};
const weekNo   = s => Math.floor((dayTs(s) / 864e5 + 3) / 7);  /* Mon-Sun */
const mondayOf = s => addDays(s, -((new Date(dayTs(s)).getUTCDay() + 6) % 7));
const isMonday = s => !!s && new Date(dayTs(s)).getUTCDay() === 1;
const isoWeek  = s => {
  const t = new Date(dayTs(mondayOf(s)) + 3 * 864e5);       /* Thursday */
  return 1 + Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 / 7);
};

/* Why the pipeline stopped. The gaps themselves are read off the run
   history; this list only says why one happened, so every chart can
   label it. Add an entry if it ever happens again.                 */
const OUTAGES = [
  { from: "2026-10-11", to: "2026-10-25", why: "account issues" }
];
const outageIn = (a, b) =>
  OUTAGES.find(o => a <= o.to && b >= o.from) || null;
const noRunLabel = o => `No runs ${fRange(o.from, o.to)} · due to ${o.why}`;

/* Run history: history.json holds one set of rows per daily run, so
   its snapshot dates are exactly the days the pipeline ran. Shared by
   the trend, the new-postings chart and the run calendar.          */
const RUNS = get("history").then(h => {
  if (!Array.isArray(h) || !h.length) return null;
  const days = [...new Set(h.map(r => iso(r.snapshot_date)))].sort();
  const set = new Set(days), first = days[0], last = days[days.length - 1];
  const gaps = [];
  let g = null;
  dayList(first, last).forEach(d => {
    if (set.has(d)) { g = null; return; }
    if (!g) gaps.push(g = { from: d, to: d, n: 0 });
    g.to = d;
    g.n++;
  });
  gaps.forEach(x => x.outage = outageIn(x.from, x.to));
  const ran = d => d < first || d > last || set.has(d);
  const live = {};
  h.forEach(r => {
    if (r.metric === "live_postings" && r.dimension === "all")
      live[iso(r.snapshot_date)] = r.value;
  });
  return { days, set, first, last, gaps, ran, live };
});

/* Shaded boxes for days without a pipeline run. A chart opts in with
   plugins: [NO_RUN] and options.plugins.noRun.bands = [{ a, b, label }],
   a and b being label indices. Painted before the grid so gridlines
   stay on top; the label sits in the padding above the plot.      */
const NO_RUN_FILL = "#F2EADD";
const NO_RUN = {
  id: "noRun",
  beforeDraw(chart, args, o) {
    const bands = (o && o.bands) || [];
    const x = chart.scales.x, a = chart.chartArea;
    if (!bands.length || !x || !a) return;
    const n = chart.data.labels.length;
    const c = i => x.getPixelForValue(i);
    const slot = n > 1 ? Math.abs(c(1) - c(0)) : a.right - a.left;
    const ctx = chart.ctx;
    ctx.save();
    bands.forEach(b => {
      const x0 = Math.max(a.left, c(b.a) - slot / 2);
      const x1 = Math.min(a.right, c(b.b) + slot / 2);
      if (x1 <= x0) return;
      ctx.fillStyle = NO_RUN_FILL;
      ctx.fillRect(x0, a.top, x1 - x0, a.bottom - a.top);
      if (!b.label) return;
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#4A453C";
      ctx.textBaseline = "alphabetic";
      const w = ctx.measureText(b.label).width;
      const tx = Math.max(a.left, Math.min(a.right - w, (x0 + x1 - w) / 2));
      ctx.fillText(b.label, tx, a.top - 8);
    });
    ctx.restore();
  }
};
/* label keys -> bands: each run of keys that had no pipeline run.
   span(k1, k2) turns the first and last key into a day range, so a
   band that covers a known outage gets its reason as a label.      */
function noRunBands(keys, isGap, span) {
  const out = [];
  keys.forEach((k, i) => {
    if (!isGap(k, i)) return;
    const last = out[out.length - 1];
    if (last && last.b === i - 1) last.b = i;
    else out.push({ a: i, b: i });
  });
  out.forEach(b => {
    const o = outageIn(...span(keys[b.a], keys[b.b]));
    b.label = o ? noRunLabel(o) : "";
  });
  return out;
}
/* room above the plot for a band label */
const bandPad = bands => ({ top: bands.some(b => b.label) ? 24 : 8 });

/* ---------------- header ---------------- */


/* ---------------- enhanced KPI block ---------------- */
get("meta").then(m => {
  if (!m) return;
  /* meta.updated arrives ISO (YYYY-MM-DD). The lead panel spells it
     out, with the weekday set quieter than the date itself. */
  if (m.updated) {
    const el = document.getElementById("kpi-when");
    const d = new Date(String(m.updated).slice(0, 10) + "T00:00:00Z");
    if (!el) {
      /* nothing to do */
    } else if (isNaN(d.getTime())) {
      el.textContent = euroDate(m.updated);
    } else {
      const full = ["January", "February", "March", "April", "May",
                    "June", "July", "August", "September", "October",
                    "November", "December"];
      const day = ["Sunday", "Monday", "Tuesday", "Wednesday",
                   "Thursday", "Friday", "Saturday"];
      el.textContent = day[d.getUTCDay()] + " - " + d.getUTCDate() + " "
                       + full[d.getUTCMonth()] + " " + d.getUTCFullYear();
    }
  }
  set("f-mean", Math.round(m.avg_age_days));
  set("f-median", m.median_age_days);
  if (m.updated) set("cav_updated", euroDate(m.updated));

  const ratio = m.median_age_days
    ? (m.avg_age_days / m.median_age_days).toFixed(1) : null;

  const cards = [
    [CORAL, m.live_postings.toLocaleString(), "Live postings",
     "Germany, Austria and Switzerland"],
    [STEEL, m.employers.toLocaleString(), "Employers",
     "advertising at least one data role"],
    [CLAY, Math.round(m.avg_age_days) + " days", "Mean days open",
     ratio ? `${ratio}× the median of ${m.median_age_days} days`
           : ""],
    [SAGE, "…", "Advertised as junior", "loading"],
  ];

  /* one divided row inside the overview panel; the colour each
     measure used to be washed in survives as the dot on its label */
  const render = () => document.getElementById("kpi").innerHTML =
    cards.map(([c, v, lab, sub]) => `
      <div class="ovw-cell" style="--accent:${c}">
        <b>${v}</b>
        <span class="lab">
          <i class="dot" style="background:${c}"></i>${lab}</span>
        <span class="sub2">${sub}</span>
      </div>`).join("");
  render();

  /* the junior card needs role_breakdown, so fill it late */
  get("role_breakdown").then(rb => {
    if (!rb || !rb.length) return;
    const tot = rb.reduce((s, r) => s + r.n_postings, 0);
    const jr  = rb.filter(r => r.seniority === "junior")
                  .reduce((s, r) => s + r.n_postings, 0);
    const slot = cards.findIndex(c => c[2] === "Advertised as junior");
    if (slot < 0) return;
    cards[slot] = [SAGE, (100 * jr / tot).toFixed(1) + "%",
                "Advertised as junior",
                `${jr.toLocaleString()} of ${tot.toLocaleString()} postings`];
    render();
  });
});

/* ---------------- age strip ---------------- */
get("age_distribution").then(d => {
  if (!d || !d.length) return;
  const strip = document.getElementById("agestrip");
  const leg   = document.getElementById("agestriplegend");
  if (!strip) return;

  const order = ["0-7 days", "8-14 days", "15-30 days",
                 "31-60 days", "61-90 days", "90+ days"];
  const cols  = [MOSS, "#9DA97E", AMBER, CLAY, DEEP, "#8C3A22"];
  const rows  = d.slice().sort(
    (a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));

  strip.innerHTML = rows.map((r, i) =>
    `<div style="width:${r.pct}%;background:${cols[i % cols.length]}"
          title="${r.bucket}: ${r.n_postings} postings (${r.pct}%)">
     </div>`).join("");

  leg.innerHTML = rows.map((r, i) =>
    `<span><i style="background:${cols[i % cols.length]}"></i>` +
    `${r.bucket} - ${r.pct}%</span>`).join("");
});

/* ---------------- country comparison ---------------- */
/* AI share is not in country_breakdown, so it is summed out of
   city_role_breakdown: that file's per-country totals match
   country_breakdown exactly, so the two columns agree. */
Promise.all([get("country_breakdown"), get("city_role_breakdown")])
  .then(([d, cr]) => {
  if (!d || !d.length) return;

  const aiPct = {};
  if (cr && cr.length) {
    const tot = {}, ai = {};
    cr.forEach(r => {
      const c = r.country;
      tot[c] = (tot[c] || 0) + r.n_postings;
      if (isAI(r.role_family)) ai[c] = (ai[c] || 0) + r.n_postings;
    });
    Object.keys(tot).forEach(c => {
      if (tot[c]) aiPct[c] = Math.round(1000 * (ai[c] || 0) / tot[c]) / 10;
    });
  }

  const byC = {};
  d.forEach(r => byC[r.country] = r);
  const rows = CORDER.filter(c => byC[c]).map(c => byC[c]);
  if (!rows.length) return;

  document.getElementById("ctrycards").innerHTML = rows.map(r => `
    <div class="cc">
            <h4>${CFLAG[r.country] || ""} ${CNAME[r.country] || r.country}</h4>
      <div class="n">${r.n_postings.toLocaleString()}</div>
      <p class="sub">live postings from
         ${(r.employers || 0).toLocaleString()} employers</p>
      <dl>
        <dt>Mean age</dt><dd>${Math.round(r.avg_age_days)} days</dd>
        <dt>Open &gt; 60 days</dt><dd>${r.pct_over_60d}%</dd>
        <dt>AI roles</dt><dd>${aiPct[r.country] ?? "-"}%</dd>
        <dt>In English</dt><dd>${r.pct_english}%</dd>
        <dt>Salary shown</dt><dd>${r.pct_with_salary ?? "-"}%</dd>
      </dl>
    </div>`).join("");

});

/* ---------------- age distribution ---------------- */
get("age_distribution").then(d => {
  if (!d) return;
  const order = ["0-7 days","8-14 days","15-30 days",
                 "31-60 days","61-90 days","90+ days"];
  d.sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));
  const cols = [MOSS, "#9DA97E", AMBER, CLAY, DEEP, "#8C3A22"];
  bar("age", d.map(r => r.bucket),
      [ds("% of live postings", d.map(r => r.pct), cols)],
      false, false, false,
      { x: "days since the posting went live",
        y: "% of live postings" });
});


Promise.all([get("market_summary"), get("role_breakdown")])
  .then(([ms, rb]) => {
  if (!ms || !ms.length) return;
  const m = ms[0];
  set("f-agency", m.pct_agency);

  const ALL  = "All roles";
  const pick = document.getElementById("survpick");

  /* does the published role_breakdown carry survival columns? */
  const hasSurv = Array.isArray(rb) && rb.length &&
                  rb[0].pct_over_30d !== undefined;


  const byRole = {};
  if (hasSurv) live(rb).forEach(r => {
    const k = r.role_family;
    const a = byRole[k] = byRole[k] ||
      { n: 0, d7: 0, d30: 0, d60: 0, d90: 0, age: 0, med: 0 };
    const w = r.n_postings || 0;
    a.n   += w;
    a.d7  += w * (r.pct_over_7d  ?? 0);
    a.d30 += w * (r.pct_over_30d ?? 0);
    a.d60 += w * (r.pct_over_60d ?? 0);
    a.d90 += w * (r.pct_over_90d ?? 0);
    a.age += w * (r.avg_age_days ?? 0);
    a.med += w * (r.median_age_days ?? 0);
  });

  const roles = Object.keys(byRole).sort((a, b) => byRole[b].n - byRole[a].n);

  const stats = role => {
    if (role === ALL) return {
      pts: [
        { x: 0,  y: 100 },
        { x: 7,  y: m.pct_over_7d },
        { x: 30, y: m.pct_over_30d },
        { x: 60, y: m.pct_over_60d },
        { x: 90, y: m.pct_over_90d },
      ],
      mean: Math.round(m.avg_age_days),
      median: m.median_age_days
    };
    const a = byRole[role], n = a.n || 1, r1 = v => Math.round(10 * v / n) / 10;
    return {
      pts: [
        { x: 0,  y: 100 },
        { x: 7,  y: r1(a.d7)  },
        { x: 30, y: r1(a.d30) },
        { x: 60, y: r1(a.d60) },
        { x: 90, y: r1(a.d90) },
      ],
      mean: Math.round(a.age / n),
      median: Math.round(a.med / n)
    };
  };

  let current = ALL, chart = null;

  function draw() {
    const s = stats(current);
    set("f-mean", s.mean);
    set("f-median", s.median);
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("surv"), {
      type: "line",
      data: { datasets: [{
        data: s.pts, borderColor: CORAL, backgroundColor: "#D9775722",
        fill: true, tension: .25, pointRadius: 4,
        pointBackgroundColor: CORAL }]},
      options: {
        aspectRatio: window.innerWidth < 600 ? 1.5 : 2.8,
        plugins: { legend: { display: false },
          tooltip: { callbacks: {
            title: () => current === ALL ? ALL : rlab(current),
            label: c =>
              `${c.raw.y}% still open after ${c.raw.x} days` } } },
        scales: {
          x: { type: "linear", title: { display: true,
               text: "days since posted" }, grid: { color: LINE } },
          y: { title: { display: true, text: "% still listed" },
               min: 0, max: 100, grid: { color: LINE } }
        }
      }
    });
  }

  if (pick && roles.length) {
    const names = [ALL].concat(roles);
    pick.innerHTML = names.map(n =>
      `<button type="button" data-role="${n}"
               title="${n === ALL ? "every posting"
                        : byRole[n].n.toLocaleString() + " postings"}"
               aria-pressed="${n === current}">` +
      `${n === ALL ? ALL : rlab(n)}</button>`).join("");

    pick.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        current = b.dataset.role;
        pick.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-pressed", x.dataset.role === current));
        draw();
      });
    });
  } else if (pick) {
    pick.closest(".mapctl").hidden = true;
  }

  draw();
});

/* ---------------- geography ---------------- */
/* keyed "country|city" because Baden exists in AT, CH and DE */
const GEO = {
  /* ---- Germany ---- */
  "de|berlin":[13.40,52.52], "de|hamburg":[9.99,53.55],
  "de|muenchen":[11.58,48.14], "de|koeln":[6.96,50.94],
  "de|frankfurt":[8.68,50.11], "de|stuttgart":[9.18,48.78],
  "de|duesseldorf":[6.77,51.23], "de|leipzig":[12.37,51.34],
  "de|dortmund":[7.47,51.51], "de|essen":[7.01,51.46],
  "de|bremen":[8.80,53.08], "de|dresden":[13.74,51.05],
  "de|hannover":[9.73,52.38], "de|nuernberg":[11.08,49.45],
  "de|duisburg":[6.76,51.43], "de|bochum":[7.22,51.48],
  "de|wuppertal":[7.15,51.26], "de|bielefeld":[8.53,52.03],
  "de|bonn":[7.10,50.73], "de|muenster":[7.63,51.96],
  "de|karlsruhe":[8.40,49.01], "de|mannheim":[8.47,49.49],
  "de|augsburg":[10.90,48.37], "de|wiesbaden":[8.24,50.08],
  "de|mainz":[8.27,49.99], "de|braunschweig":[10.53,52.27],
  "de|kiel":[10.14,54.32], "de|aachen":[6.08,50.78],
  "de|halle":[11.97,51.48], "de|magdeburg":[11.63,52.13],
  "de|freiburg":[7.85,47.99], "de|krefeld":[6.56,51.33],
  "de|luebeck":[10.69,53.87], "de|erfurt":[11.03,50.98],
  "de|rostock":[12.14,54.09], "de|kassel":[9.50,51.31],
  "de|potsdam":[13.06,52.40], "de|saarbruecken":[6.99,49.24],
  "de|heidelberg":[8.69,49.40], "de|darmstadt":[8.65,49.87],
  "de|regensburg":[12.10,49.02], "de|ingolstadt":[11.43,48.76],
  "de|ulm":[9.99,48.40], "de|jena":[11.59,50.93],
  "de|osnabrueck":[8.05,52.28], "de|walldorf":[8.64,49.31],
  "de|heilbronn":[9.22,49.14], "de|wolfsburg":[10.79,52.42],
  "de|paderborn":[8.75,51.72], "de|koblenz":[7.59,50.36],
  "de|trier":[6.64,49.76], "de|wuerzburg":[9.93,49.79],
  "de|chemnitz":[12.92,50.83], "de|hamm":[7.82,51.68],
  "de|moenchengladbach":[6.44,51.19],
  "de|gelsenkirchen":[7.10,51.52], "de|oldenburg":[8.21,53.14],
  "de|ludwigshafen":[8.44,49.48], "de|leverkusen":[7.00,51.03],
  "de|solingen":[7.08,51.17], "de|neuss":[6.69,51.20],
  "de|siegen":[8.02,50.87], "de|hildesheim":[9.95,52.15],
  "de|gera":[12.08,50.88], "de|schwerin":[11.42,53.63],
  "de|reutlingen":[9.21,48.49], "de|fuerth":[10.99,49.48],
  "de|bremerhaven":[8.58,53.55], "de|offenbach":[8.77,50.10],
  "de|esslingen":[9.31,48.74], "de|boeblingen":[9.01,48.69],
  "de|friedrichshafen":[9.48,47.65], "de|konstanz":[9.17,47.66],
  "de|passau":[13.46,48.57], "de|bayreuth":[11.58,49.95],
  "de|bamberg":[10.89,49.89], "de|goettingen":[9.94,51.53],
  "de|marburg":[8.77,50.80], "de|giessen":[8.68,50.59],
  "de|fulda":[9.68,50.55], "de|cottbus":[14.33,51.76],
  "de|greifswald":[13.38,54.09], "de|erlangen":[11.00,49.60],
  "de|tuebingen":[9.06,48.52], "de|sindelfingen":[9.00,48.71],
  "de|ratingen":[6.85,51.30], "de|ludwigsburg":[9.19,48.90],
  "de|pforzheim":[8.70,48.89], "de|landshut":[12.15,48.54],
  "de|rosenheim":[12.13,47.86], "de|hanau":[8.92,50.13],
  "de|hagen":[7.47,51.36], "de|herne":[7.22,51.54],
  "de|guetersloh":[8.38,51.91], "de|celle":[10.08,52.62],
  "de|flensburg":[9.44,54.78], "de|kaiserslautern":[7.77,49.44],
  "de|zwickau":[12.50,50.72], "de|weimar":[11.33,50.98],
  "de|aschaffenburg":[9.15,49.98], "de|schweinfurt":[10.22,50.05],

  /* ---- Austria ---- */
  "at|wien":[16.37,48.21], "at|graz":[15.44,47.07],
  "at|linz":[14.29,48.31], "at|salzburg":[13.05,47.81],
  "at|innsbruck":[11.40,47.27], "at|klagenfurt":[14.31,46.62],
  "at|villach":[13.85,46.61], "at|wels":[14.03,48.16],
  "at|sankt poelten":[15.62,48.20], "at|st. poelten":[15.62,48.20],
  "at|st poelten":[15.62,48.20], "at|dornbirn":[9.74,47.41],
  "at|wiener neustadt":[16.25,47.81], "at|steyr":[14.42,48.04],
  "at|feldkirch":[9.60,47.24], "at|bregenz":[9.75,47.50],
  "at|leonding":[14.25,48.28], "at|klosterneuburg":[16.32,48.31],
  "at|krems":[15.61,48.41], "at|traun":[14.24,48.22],
  "at|amstetten":[14.87,48.12], "at|kufstein":[12.17,47.58],
  "at|hallein":[13.10,47.68], "at|schwechat":[16.47,48.14],
  "at|eisenstadt":[16.52,47.85], "at|baden":[16.23,48.01],
  "at|moedling":[16.29,48.09], "at|voecklabruck":[13.66,48.01],
  "at|hagenberg":[14.51,48.37],
  "at|wolfsberg":[14.84,46.84], "at|leoben":[15.09,47.38],
  "at|kapfenberg":[15.29,47.44], "at|bruck":[15.28,47.41],
  "at|lustenau":[9.66,47.43], "at|hohenems":[9.69,47.36],
  "at|ried":[13.49,48.21], "at|braunau":[13.04,48.26],
  "at|spittal":[13.50,46.80], "at|zell am see":[12.79,47.32],

  /* ---- Switzerland ---- */
  "ch|zuerich":[8.54,47.38], "ch|genf":[6.14,46.20],
  "ch|geneve":[6.14,46.20], "ch|geneva":[6.14,46.20],
  "ch|basel":[7.59,47.56], "ch|bern":[7.45,46.95],
  "ch|lausanne":[6.63,46.52], "ch|winterthur":[8.73,47.50],
  "ch|luzern":[8.31,47.05], "ch|sankt gallen":[9.38,47.42],
  "ch|st. gallen":[9.38,47.42], "ch|st gallen":[9.38,47.42],
  "ch|lugano":[8.95,46.00], "ch|biel":[7.25,47.14],
  "ch|thun":[7.63,46.76], "ch|koeniz":[7.41,46.92],
  "ch|schaffhausen":[8.63,47.70], "ch|fribourg":[7.16,46.80],
  "ch|freiburg":[7.16,46.80], "ch|chur":[9.53,46.85],
  "ch|neuchatel":[6.93,46.99], "ch|sion":[7.36,46.23],
  "ch|zug":[8.52,47.17], "ch|baar":[8.53,47.20],
  "ch|rotkreuz":[8.43,47.14], "ch|duebendorf":[8.62,47.40],
  "ch|kloten":[8.58,47.45], "ch|wallisellen":[8.60,47.41],
  "ch|opfikon":[8.57,47.43], "ch|aarau":[8.05,47.39],
  "ch|olten":[7.90,47.35], "ch|solothurn":[7.54,47.21],
  "ch|wetzikon":[8.80,47.32], "ch|rapperswil":[8.82,47.23],
  "ch|zollikon":[8.58,47.34], "ch|bellinzona":[9.02,46.19],
  "ch|vernier":[6.09,46.21], "ch|lancy":[6.11,46.19],
  "ch|meyrin":[6.08,46.23], "ch|nyon":[6.24,46.38],
  "ch|morges":[6.50,46.51], "ch|yverdon":[6.64,46.78],
  "ch|montreux":[6.91,46.43], "ch|sierre":[7.53,46.29],
  "ch|martigny":[7.07,46.10], "ch|wil":[9.05,47.46],
  "ch|frauenfeld":[8.90,47.56], "ch|kreuzlingen":[9.17,47.65],
  "ch|arbon":[9.43,47.52], "ch|horgen":[8.60,47.26],
  "ch|waedenswil":[8.67,47.23], "ch|uster":[8.72,47.35],
  "ch|volketswil":[8.69,47.39], "ch|regensdorf":[8.47,47.43],
  "ch|buelach":[8.54,47.52], "ch|baden":[8.31,47.47],
  "ch|liestal":[7.73,47.48], "ch|allschwil":[7.54,47.55],
  "ch|reinach":[7.59,47.49], "ch|pratteln":[7.69,47.52],
  "ch|muttenz":[7.65,47.52], "ch|kaiseraugst":[7.73,47.54],
  "ch|schlieren":[8.45,47.40], "ch|dietikon":[8.40,47.40],
  "ch|thalwil":[8.56,47.29], "ch|kuesnacht":[8.58,47.32]
};

/* ---------------- map geometry ----------------
   Borders are Natural Earth (public domain): the three countries, their
   neighbours and the big lakes, pre-projected into a 600 x 727 frame
   (Lambert azimuthal equal-area centred on 10.5°E 51.2°N), the same
   frame as the 2 Nov results report. MAP_PLACES is that report's place
   table (GeoNames coordinates, CC BY 4.0), keyed the way this page keys
   cities, so districts and cantons get drawn at their main town. GEO
   above is the fallback for any place MAP_PLACES does not know.    */
const MAP = {
  w: 600, h: 727,
  lab: {"de": [243, 350.9], "at": [470.7, 596.9], "ch": [116, 658.3]},
  land: [
    {id:"CHE",c:"ch",d:"M199.8,587.2L201.4,588.2L205,591.7L204.1,597.4L199.8,606.6L197.4,614.1L197.1,619.8L197.5,622.5L198.2,622.5L202.3,623L204.4,623L210.9,624.6L216.1,626.9L217.1,629.4L217.7,632.3L223.9,636.4L231.1,639L233.5,638.2L242.4,628.8L245.8,630.4L247.9,635.4L247.8,638L245.3,648L244.9,653.3L247,656.9L247.2,659.6L246.6,662.1L243.1,662.3L238.3,661L234.2,656.6L231.2,657.1L228.5,658.2L227.2,662.3L225.9,667.2L226.3,669.9L228.2,672L229.6,676.4L230.7,682.1L231.5,684.8L230.6,686L228,686.7L225.9,685.9L222.3,679.1L220.6,676.4L217.7,675.9L212.6,677.6L204.7,681.3L201.5,681.3L198.9,680.5L196.4,677.2L194.3,670.9L193.7,666.9L192.2,667L187.2,665.8L184.9,667.3L184.7,673.7L184.1,681.7L181.5,686.9L174.3,695.7L171.7,699.5L170.6,702.3L170.3,704.8L171.3,709L172.7,713L171.4,715.3L167.7,716.4L165.1,713.9L164.2,709.6L158.6,703.5L161.3,698.6L160.9,697.3L151.5,694.5L147.6,690.7L142.1,683.9L141.1,681.1L141.6,671.9L141.3,669.7L140.6,668.6L137.9,668.5L134,671.6L130.3,676.3L122.9,681.4L122.2,682.6L124.4,687.9L124.2,689.9L118.1,698.1L116.9,700.8L109.2,705.8L105.7,707.6L95.4,703.4L92.6,702.8L87.8,705.2L81.1,707.4L70.4,709.3L66.6,707.4L64.8,705.6L64,703L61.6,698.4L58.7,695.7L56.8,692.7L54.1,689.4L52.5,686.6L55.3,678.3L53.7,675.3L53,671L53.6,668.2L52.7,667.4L43.3,665.3L35.4,665.4L29.6,667.9L24.7,672.3L24.1,673.3L24.4,674.1L26.4,678.6L22.3,682.9L16.1,686L11.8,686.1L10,685.3L10.2,680.5L13.8,678.9L17.2,675.9L18.5,671.5L19.1,668.4L16,664.4L16.5,662.1L18.8,657.9L20.3,654L22.1,650.8L28.9,645.6L35.8,640.5L37.1,634.7L38,627.5L39,625.9L48,622.1L50.3,620.5L51.6,618.1L58.9,610.4L66.1,602.8L67.6,600.2L68.8,598.7L68.8,597.4L68,596.4L64.8,595.5L63.9,593L67.6,588.6L72.1,586.1L76.4,586.2L78,587.6L77.9,589.1L79.7,590.8L82.9,591.4L86.9,591L90.9,589.5L93.6,585.6L95.1,582.6L101.5,579.4L105.6,581.3L117.4,582.2L126.1,581.6L131.5,579.4L138.2,579.6L142.7,581L143.5,580.9L144.7,580.6L146,579.4L150.2,578.6L150.8,577.6L150.7,576.5L149.9,575.9L144.7,576.3L142.8,575.4L142.3,573.5L144.1,570.2L147.9,567.6L151.2,567L153.5,567.8L159,573L160.4,573.2L161.2,572.3L162.4,571.8L164.3,572.8L166.5,576L166.8,576.5L179.6,575.7L182.4,575.7L190.9,581.4Z"},
    {id:"SVK",c:"",d:"M600,536.8L598.8,535.8L597.9,535.7L596.6,535L591.3,534.9L590,535.5L586.6,533.2L585.4,529.9L579.8,521.6L573.1,507.7L572.6,503.6L574.3,498.6L576,494.9L576,492L576.2,491.2L577.3,485.1L580.5,476.8L583.7,471.9L586.2,470.2L591.8,471L600,471.3L600,536.8Z"},
    {id:"SVN",c:"",d:"M470.2,727L469.5,725L468.2,724.6L466.4,725.6L465.9,727L429.8,727L429.8,727L428.7,724.8L422.5,718.8L419.3,716.6L415,715.2L414.2,713.6L416.1,703.7L415.4,702.4L410.5,703L409.3,702.1L408.9,700.4L409.1,698L412.2,694.1L415.7,690.6L416.6,688.7L416.4,687.2L411.7,685.9L408.9,684.5L406.6,684L405.1,684.9L403.9,684L402.7,681.3L403.7,676.9L407.7,672.8L412,669.1L415.8,666.4L418,665.2L418.9,660.8L421.2,661.1L425.8,661.2L431,661.9L435.9,662.9L440.1,664.3L449.1,665.4L457.2,666L459.6,666.8L461.6,666.6L464.1,667.8L465.5,666.7L466.5,664.9L470.7,662.5L474.6,659.6L477.2,655.9L478.7,653.1L481.3,651L484.2,650.3L486.9,649.1L498.1,647.1L509.9,647.4L515.3,645.1L519.6,641.4L526.3,640L526.6,640L536.8,641.8L537.4,640.3L537.8,639.6L537.1,632.3L540,628.7L542.8,627.1L552.8,626.8L554.3,628.9L555.1,632.4L556.3,636.9L558.1,638.1L559.1,639.9L559.2,643.1L561.4,645.3L566.5,651.5L567.2,653.1L567.2,653.1L562.3,651.6L556.7,651.3L555.7,652.4L553.6,653.6L552.6,655.5L554,662.7L552.7,664L546.3,663.8L544.2,664.8L541.2,670.1L537.8,672.5L533.3,674.3L530.1,676.4L526,678.3L522.5,679.5L521.2,681.8L520.5,684.3L520.9,686.6L524.9,691L525.7,695.9L525.7,702L525.1,705.3L523.8,707.5L514.9,710.9L505.8,716.5L505.6,717.7L510.2,721.8L510.5,722.9L507.1,725.7L507,727L470.2,727Z"},
    {id:"POL",c:"",d:"M600,372.9L599,372.6L597.3,371L596.8,369.6L600,367.8L600,372.9ZM600,358.9L599.1,359.7L594.4,361.7L589.9,362.8L587.7,363L574,354.8L565.4,352.7L560.5,352.3L560,353.3L562.7,358.4L567.1,364.5L567.1,366.3L562.7,369.3L560.2,370.7L557.3,373.2L555,376.6L552.8,378.2L550.8,378L548.6,376.7L542.5,367.5L535.3,360.6L534.4,359L532.2,358.8L529.2,357.4L528,355.2L529.3,352.7L531.2,350.4L534.6,348.8L535.6,347.4L536.1,345.5L537.3,343L536.8,342.1L534.1,339.5L530.1,337.2L519.8,340L517.1,341.6L515.3,339.9L513.9,337.3L511.2,337L507.5,334.9L503,332.8L498.8,332.4L489.9,329.6L486.5,329.6L484.5,328.5L482.3,326.1L480.4,323.4L479.2,317.7L472.6,315.4L466.2,314.2L465.8,315.1L466.4,320.8L466.3,324L462.2,326.1L458,326.6L458.2,325.6L462.6,314.8L464.4,308.1L466.2,295.9L462.6,286.6L461.5,282.2L459.9,280.2L451.1,276.1L450.3,274.5L451.3,268.2L450.5,265.6L448.2,262.9L445.2,257.5L443.9,252.9L447.1,247.1L447.7,243L448.9,237.4L449.8,234.3L449.9,233.4L447.6,231.4L446.8,228.4L447.2,224L445.8,220.8L442.7,218.8L440.6,216.2L439.5,212.7L439.9,207.2L441.8,199.7L436.4,191L423.8,181.2L417.7,174.2L418,170L420.3,166.1L424.7,162.4L427.8,156.2L429.4,149L429.4,147.6L429.2,142.5L422.9,121.9L421.8,116.8L420.8,110.5L420.4,108.8L431,112.7L435.5,114.9L434.8,112.2L433.8,109.8L434.1,106.2L433.6,100.9L424,98.7L417.8,98.1L416.9,94.5L417.4,92L419.2,93.4L425.3,93.6L439.8,85.6L464.9,74.8L491.6,64.2L497.9,62.8L504.2,60.4L506.3,57L508.5,54.6L511.8,48.6L519.2,39L533.3,34.5L538.3,29.8L549.1,22.9L574,13.8L584.5,11.3L594.9,10L600,12.2L600,358.9Z"},
    {id:"NLD",c:"",d:"M0,162.7L14.3,153.4L18.9,144.7L23.1,140.8L39.2,133.6L48,131.7L61.3,131.9L70.9,131L82.4,131L86.6,136.3L88.9,140.1L92.9,142.3L99.2,144L98.5,151.2L97.9,165.6L97.4,168.1L94.2,174L90.6,184.7L89.5,191.8L88.5,193.2L76.2,192.5L74.4,193.7L74.1,195.2L74.6,197.1L74.2,198.9L73.2,200.3L73.6,202.7L75.6,205.5L79.4,207.4L83.6,207.7L85.7,207.5L87.2,209.5L88.6,212.6L88.3,216.3L87.5,221.2L85.3,225.8L79.3,230.8L76.6,232.6L74.2,233.4L73,234.8L72.3,236.5L72.4,238.1L76.2,242.6L76.1,243.5L74.8,245.7L73.1,247.7L62.3,251.5L58,250.9L55.4,253L54.6,253.3L51.9,251.2L45.9,248.5L43.5,249.2L42.2,250.4L38.2,251.7L35.3,253.9L35.1,257L39.5,265.2L41.2,266.9L41.1,269.8L43.2,273.7L45.4,278.5L45.5,281.5L45.1,284.5L43.5,288.7L38.6,298.4L38.5,300.3L38.8,301.8L40.2,302.3L41.3,303.1L40.9,304.4L32.4,310.8L31.3,312L27.9,311.4L27.3,312.5L27.6,314.4L28.9,316.2L31.7,317.2L34.1,319.1L35.9,322.7L32.5,334.3L32.5,334.3L27.6,333.8L23.1,333.4L20.7,332.8L18.2,331.5L18.2,331.5L17.1,329.1L15.9,326.1L16.4,324.4L21,319.7L21.7,318.3L21.3,317.5L21.9,315.4L25.7,308.1L26.3,305.2L25,303L22.9,301.6L16.2,298.9L13.1,295.6L11.8,292.8L10.3,291.9L8,292.7L2.3,293.3L0,292.4L0,162.7ZM60.8,124.5L54.2,126.8L52.7,126.1L53.2,125.4L58.8,124.1ZM42.2,127.4L33.1,128.1L30.1,127L29.7,126L32.2,125.7L39.8,126L42.1,126.9ZM0,136.2L0.3,136L4,136.4L4,136.4L0,138.7L0,136.2ZM14.3,131.2L10,131.5L8.2,130.3L18.6,128L25.2,127.5L26.3,128ZM79.3,120L75.1,120.1L76.4,118.1L80.3,116.8L82.4,116.9Z"},
    {id:"LUX",c:"",d:"M35.6,382.7L35.1,384.7L34.9,389.2L36,393.9L39,398.6L41.3,402L44.6,404.8L50.2,407.6L52.4,408.3L52.6,411.7L51.9,415.2L49.8,417.1L47.8,419.8L46.2,423.2L44.4,429.7L43.9,434.3L40.7,432.2L39,430.8L36,430.3L32.9,431.2L30.5,433.4L27.4,433.9L24.8,433L23.4,431.2L22.1,430.2L18.3,428.8L16.8,426.1L18.2,425L19.4,423.2L20.5,420.6L21.8,418.3L18.4,411.4L17.8,409.3L14.9,405.3L15.1,403.4L15.9,401.6L15.8,400.2L16.4,396.9L18.8,393.9L20.5,390L23.2,384.8L29,378.7L32.7,379.9L34.4,380L35.3,382.4Z"},
    {id:"LIE",c:"",d:"M202.3,623L198.2,622.5L197.5,622.5L197.1,619.8L197.4,614.1L199.8,606.6L200.2,607.8L200.5,609.4L200.9,611.1L201.1,613.2L202,615.3L203.5,617.3L203.9,619.2L203.1,621.6Z"},
    {id:"ITA",c:"",d:"M424.7,727L417.5,718.3L413.8,718.5L409,723.3L395,719.2L392.4,721.2L390.6,725L388.6,727L57.7,727L57.7,727L56.4,724.8L52.6,721.6L51.9,719.2L51.9,716.2L52.9,713.6L60.3,709.8L64.8,705.6L64.8,705.6L66.6,707.4L70.4,709.3L81.1,707.4L87.8,705.2L92.6,702.8L95.4,703.4L105.7,707.6L109.2,705.8L116.9,700.8L118.1,698.1L124.2,689.9L124.4,687.9L122.2,682.6L122.9,681.4L130.3,676.3L134,671.6L137.9,668.5L140.6,668.6L141.3,669.7L141.6,671.9L141.1,681.1L142.1,683.9L147.6,690.7L151.5,694.5L160.9,697.3L161.3,698.6L158.6,703.5L164.2,709.6L165.1,713.9L167.7,716.4L171.4,715.3L172.7,713L171.3,709L170.3,704.8L170.6,702.3L171.7,699.5L174.3,695.7L181.5,686.9L184.1,681.7L184.7,673.7L184.9,667.3L187.2,665.8L192.2,667L193.7,666.9L194.3,670.9L196.4,677.2L198.9,680.5L201.5,681.3L204.7,681.3L212.6,677.6L217.7,675.9L220.6,676.4L222.3,679.1L225.9,685.9L228,686.7L230.6,686L231.5,684.8L230.7,682.1L229.6,676.4L228.2,672L226.3,669.9L225.9,667.2L227.2,662.3L228.5,658.2L231.2,657.1L234.2,656.6L238.3,661L243.1,662.3L246.6,662.1L247.2,659.6L247,656.9L244.9,653.3L245.3,648L247.8,638L249.2,638.8L254.4,638.9L260.2,639.4L263.9,643.5L267.5,644.8L272.7,645.3L276.1,644.7L277.8,643.1L279.8,638.3L283.4,632.4L289.2,629.3L299,628.7L303.9,627.5L309,627.5L312.9,628.3L316.9,628.2L326.9,623.9L337.3,620.4L338.7,620.9L339,622L337.2,624.5L335.4,627.9L336.7,631.7L342.9,639.1L346.3,644.9L349.4,649.2L354.3,651.4L360.6,652.6L365.9,652.9L371.5,654.4L390.8,657.9L400.4,658.6L407.7,658.5L418.9,660.8L418,665.2L415.8,666.4L412,669.1L407.7,672.8L403.7,676.9L402.7,681.3L403.9,684L405.1,684.9L406.6,684L408.9,684.5L411.7,685.9L416.4,687.2L416.6,688.7L415.7,690.6L412.2,694.1L409.1,698L408.9,700.4L409.3,702.1L410.5,703L415.4,702.4L416.1,703.7L414.2,713.6L415,715.2L419.3,716.6L422.5,718.8L428.7,724.8L429.8,727L424.7,727Z"},
    {id:"HUN",c:"",d:"M600,676.4L596.4,674.7L591.1,670L586.9,663.8L579.9,658.5L570.1,654L567.2,653.1L566.5,651.5L561.4,645.3L559.2,643.1L559.1,639.9L558.1,638.1L556.3,636.9L555.1,632.4L554.3,628.9L552.8,626.8L542.8,627.1L550.5,618.2L554.4,615.5L559.3,615.6L560.7,614.7L561.1,613.5L561.7,610.7L561.9,608.1L562.1,605.7L561.4,604.4L559.1,604.1L557.5,598.3L558.5,596L559.6,594.3L557.5,587.2L557.8,584.8L561.5,584.1L564.4,582.3L566.8,580.3L567.3,578.1L569,573.4L566.6,568L555.7,565.2L555,563.9L557.4,562.1L559.8,559.7L561.2,557.8L563.2,557.4L566.2,558L571.7,561.6L573.7,562L575.5,560.7L577.5,560.3L583.2,559.9L587.9,558.6L586.4,554.4L586.2,551.3L585.2,548.9L585.4,546.1L587.2,543.8L587.3,539L590,535.5L591.3,534.9L596.6,535L597.9,535.7L598.8,535.8L600,536.8L600,676.4Z"},
    {id:"DEU",c:"de",d:"M199.8,587.2L190.9,581.4L182.4,575.7L179.6,575.7L166.8,576.5L166.5,576L164.3,572.8L162.4,571.8L161.2,572.3L160.4,573.2L159,573L153.5,567.8L151.2,567L147.9,567.6L144.1,570.2L142.3,573.5L142.8,575.4L144.7,576.3L149.9,575.9L150.7,576.5L150.8,577.6L150.2,578.6L146,579.4L144.7,580.6L143.5,580.9L142.7,581L138.2,579.6L131.5,579.4L126.1,581.6L117.4,582.2L105.6,581.3L101.5,579.4L98.9,578.2L97.3,573L98,565.4L101.2,555.4L102.3,548.1L101.3,543.3L103.2,536.3L108.1,527L111.5,517.2L113.4,506.8L115.8,500.1L120.2,495.5L130.8,482.5L131.7,481.5L131.6,474.8L128.9,473.8L125,471.7L115,469L105.6,467.1L101.4,465.1L97.9,459.9L95.5,459.7L90.9,461.4L85.2,462.3L81.1,461.1L78.5,461.2L77,462L76.4,461.2L75.5,456.8L73.4,455.6L70.1,454.4L68,454.8L66.5,456.8L64.2,458.2L62.2,457.6L56.3,447.4L54.8,445.1L54.5,443L53.1,439.2L49.5,435.4L45.8,434L43.9,434.3L44.4,429.7L46.2,423.2L47.8,419.8L49.8,417.1L51.9,415.2L52.6,411.7L52.4,408.3L50.2,407.6L44.6,404.8L41.3,402L39,398.6L36,393.9L34.9,389.2L35.1,384.7L35.6,382.7L35.9,381.3L39,374.3L48.6,368.5L47.9,362L48,358.1L45.9,355.4L41.5,354.1L40.4,352.2L40,350.4L43.5,346.7L39.8,343.4L38.3,340.1L33,335.7L32.5,334.3L35.9,322.7L34.1,319.1L31.7,317.2L28.9,316.2L27.6,314.4L27.3,312.5L27.9,311.4L31.3,312L32.4,310.8L40.9,304.4L41.3,303.1L40.2,302.3L38.8,301.8L38.5,300.3L38.6,298.4L43.5,288.7L45.1,284.5L45.5,281.5L45.4,278.5L43.2,273.7L41.1,269.8L41.2,266.9L39.5,265.2L35.1,257L35.3,253.9L38.2,251.7L42.2,250.4L43.5,249.2L45.9,248.5L51.9,251.2L54.6,253.3L55.4,253L58,250.9L62.3,251.5L73.1,247.7L74.8,245.7L76.1,243.5L76.2,242.6L72.4,238.1L72.3,236.5L73,234.8L74.2,233.4L76.6,232.6L79.3,230.8L85.3,225.8L87.5,221.2L88.3,216.3L88.6,212.6L87.2,209.5L85.7,207.5L83.6,207.7L79.4,207.4L75.6,205.5L73.6,202.7L73.2,200.3L74.2,198.9L74.6,197.1L74.1,195.2L74.4,193.7L76.2,192.5L88.5,193.2L89.5,191.8L90.6,184.7L94.2,174L97.4,168.1L97.9,165.6L98.5,151.2L99.2,144L97.3,140.5L93,136.5L94.3,128.8L96.1,122.8L100.9,115.5L104.6,113.6L120.2,113.1L137.4,114.2L144.2,125.7L141.4,131.4L145.5,134.2L147.5,133.3L149.2,128.3L150.4,122.8L151.9,121.1L157.1,125.4L158.9,128.3L158.8,137.5L161.1,125.1L159.9,116.4L161.1,108L163.4,103.6L165.4,100.9L177.9,104.2L191.8,102.9L197,106.3L208.7,122.7L212.7,125.4L217.7,126.3L210.8,122.8L196.6,102.8L192.4,100.2L185.8,99.4L181.7,97.4L179.1,94.3L178.4,91.6L179,71.7L176.6,68.7L173.4,67.5L171.4,68.9L167.4,68.8L166.6,64.2L167.7,60.9L175.9,58.8L181.4,55.9L181.7,50.5L178.4,46.1L174.5,38.2L170,30.8L169.6,22.2L169.7,22.2L177.9,22.6L179.9,22.9L192.3,27.2L195.3,30.1L199.1,30.2L206.1,27.7L211.3,26.7L213.2,28.3L216.1,29L216.7,29L217,30.4L223.4,32.5L226.1,35.8L229.1,40.7L229.3,47.8L225.4,52.9L222.2,56.1L234.4,55L235.6,57.9L237.4,61.1L244.1,58.8L260.6,68.2L270.6,63.6L273.2,63.3L275.5,70.8L273.1,78.5L264.2,86.6L266.2,91.6L269.1,92.7L277.5,91.6L290.8,96.4L293.6,94.8L304.2,83.3L308.4,80.8L322.5,78.7L325,74.3L330.6,69.7L334.1,64.8L342.7,55.3L351.8,56.7L357.1,58.3L363,59L368.6,68.6L382.5,79L394.8,77.5L399.7,87.6L402.2,100.2L406.2,104L409.7,106.4L420,108.6L420.4,108.8L420.8,110.5L421.8,116.8L422.9,121.9L429.2,142.5L429.4,147.6L429.4,149L427.8,156.2L424.7,162.4L420.3,166.1L418,170L417.7,174.2L423.8,181.2L436.4,191L441.8,199.7L439.9,207.2L439.5,212.7L440.6,216.2L442.7,218.8L445.8,220.8L447.2,224L446.8,228.4L447.6,231.4L449.9,233.4L449.8,234.3L448.9,237.4L447.7,243L447.1,247.1L443.9,252.9L445.2,257.5L448.2,262.9L450.5,265.6L451.3,268.2L450.3,274.5L451.1,276.1L459.9,280.2L461.5,282.2L462.6,286.6L466.2,295.9L464.4,308.1L462.6,314.8L458.2,325.6L458,326.6L457.5,327.9L456.1,329.8L454.1,330.2L450.9,329L448.6,327.4L448.9,322.8L447.5,322.6L445.6,319.9L444.8,317L442.9,315.9L436.1,315L433.7,314.2L432,314.9L430.8,317.1L431.7,319L433.1,320.8L437,323.5L436.7,324.7L428.7,328L423.8,331.2L419.2,333L414.5,336.3L405.1,340.2L398.2,341.4L396.7,342.3L394.4,348.2L392.6,349.5L390.9,348.9L389.6,348L388,348.9L386.4,350.9L384.6,351.7L383.1,351.7L380.5,356.9L372.6,358.7L371.7,361.4L370.4,364.4L369.2,365.2L365.6,364.1L360.5,363.6L357.7,365.4L354.3,366.4L350.1,366.8L345.5,370.3L341,376.2L338.6,381.5L337.2,383.3L334.9,378.5L332,375.3L330,373.6L328.3,373.6L327.9,374.4L327.9,376.9L329.9,381.1L332.2,383.9L332.7,386L334,389.8L337.4,394L342.8,397.2L346.5,400.4L349.3,404.9L349.4,406.3L348.7,408.1L347.5,409.9L346.5,412.3L343.6,417L344.6,419L347,421.4L349.3,424.4L352.1,429.3L356.2,437.9L358.7,441.4L362.1,445L365.5,447.7L370.6,447.5L376.1,452.7L382.2,460.2L386.7,463.6L389.8,464.6L392.4,467.3L394.8,471.2L395.8,473.5L397.8,475.1L403.2,474.6L410.4,480.7L414.8,485.1L417.2,488.8L416.7,490.3L416.7,495L416.9,499.9L416.4,502.5L413.4,506.1L411.8,506.9L411,507.7L401.3,503.6L400.6,504.4L400,505L398,518.1L396.3,520.7L393.7,523.1L388.4,525.5L384.6,526.6L381.7,527.8L372.5,533.6L368.3,537L365.7,541.2L365.7,543.6L370.6,550.4L376.1,557.4L376.3,563.8L374.1,568.6L373.7,570.4L375.2,571.1L378.2,571.2L380.7,572L381.9,575.3L381.8,581.1L381.1,586.6L380.3,588.9L377.9,589.1L373.2,586.9L369.5,584.3L368.1,582.7L368,580.7L368.7,579.4L367.3,576.9L362.9,574.8L358.2,575.9L354.7,577.6L352.5,577.5L350,575.4L346.2,573.8L341.3,572.8L338.2,571.7L337.6,572.4L338.1,577.2L337.2,579.3L313.1,582.5L305.7,585.2L300.4,588.6L296.4,590.1L295.5,592.2L291.6,594.9L287.1,595.8L286.1,595L283.2,596.2L278.3,597.5L275.2,597.1L273.7,594.9L270.6,591.6L269.4,589.3L269.5,587.8L262.8,587.5L258.5,585.8L249.4,586.2L247.1,585.4L246.7,586.3L245.3,595.7L243.5,599.6L240.6,603.7L236.8,605.9L233.8,606.3L234,603.4L234.7,599.8L232.6,599L229.4,598.6L227.8,597.5L228.2,594.8L227.5,593.2L226.2,591.3L223,588.9L216.1,585.2L211.5,583.4L209.7,585.3L206.4,587.2L201.1,586.5ZM393.4,60L394.7,65.1L393.6,67.8L388.4,63.6L383.4,63.9L380.6,70.7L378.4,71.1L370.4,65.3L369,62.4L368.7,59.9L369.5,51.3L369.2,48.6L371.5,45.5L371.7,41.3L375.9,36.6L379.7,36.3L381,40.1L382.9,42.6L389.5,45.3L390.5,46.6L391.2,48.4L388.3,52.1L387.4,54L388.5,57ZM417.4,92L416.9,94.5L417.8,98.1L415.9,97.9L410.4,99.1L404.8,98.1L403.5,93.6L404.2,89.1L401.9,86.2L399.7,84.5L399.3,82L399.5,79.3L409.3,86ZM285.2,60.2L278.3,60.4L275.7,57.4L273,56.6L274.4,52.8L276.3,51.5L282.9,53.9L285,58.7ZM153.4,30.7L152.3,32.2L153.2,21.4L158.3,10L160.3,10.3L158.2,13.4L157.5,15.5L156.5,19.9L156.8,22.1L167.8,23.1L166.5,25L155.3,26.1ZM165.6,36.7L163.9,38.6L159.7,38.2L157.3,36.4L158.2,34.5L160.4,33.2L162.3,33L165.1,34Z"},
    {id:"FRA",c:"",d:"M0,424.4L2.7,427.3L4.4,427.4L7.9,426.3L12.9,425.8L16.8,426.1L18.3,428.8L22.1,430.2L23.4,431.2L24.8,433L27.4,433.9L30.5,433.4L32.9,431.2L36,430.3L39,430.8L40.7,432.2L43.9,434.3L45.8,434L49.5,435.4L53.1,439.2L54.5,443L54.8,445.1L56.3,447.4L62.2,457.6L64.2,458.2L66.5,456.8L68,454.8L70.1,454.4L73.4,455.6L75.5,456.8L76.4,461.2L77,462L78.5,461.2L81.1,461.1L85.2,462.3L90.9,461.4L95.5,459.7L97.9,459.9L101.4,465.1L105.6,467.1L115,469L125,471.7L128.9,473.8L131.6,474.8L131.7,481.5L130.8,482.5L120.2,495.5L115.8,500.1L113.4,506.8L111.5,517.2L108.1,527L103.2,536.3L101.3,543.3L102.3,548.1L101.2,555.4L98,565.4L97.3,573L98.9,578.2L101.5,579.4L101.5,579.4L95.1,582.6L93.6,585.6L90.9,589.5L86.9,591L82.9,591.4L79.7,590.8L77.9,589.1L78,587.6L76.4,586.2L72.1,586.1L67.6,588.6L63.9,593L64.8,595.5L68,596.4L68.8,597.4L68.8,598.7L67.6,600.2L66.1,602.8L58.9,610.4L51.6,618.1L50.3,620.5L48,622.1L39,625.9L38,627.5L37.1,634.7L35.8,640.5L28.9,645.6L22.1,650.8L20.3,654L18.8,657.9L16.5,662.1L16,664.4L19.1,668.4L18.5,671.5L17.2,675.9L13.8,678.9L10.2,680.5L10,685.3L11.8,686.1L16.1,686L22.3,682.9L26.4,678.6L24.4,674.1L24.1,673.3L24.7,672.3L29.6,667.9L35.4,665.4L43.3,665.3L52.7,667.4L53.6,668.2L53,671L53.7,675.3L55.3,678.3L52.5,686.6L54.1,689.4L56.8,692.7L58.7,695.7L61.6,698.4L64,703L64.8,705.6L60.3,709.8L52.9,713.6L51.9,716.2L51.9,719.2L52.6,721.6L56.4,724.8L57.7,727L0,727Z"},
    {id:"DNK",c:"",d:"M321.5,0L319.9,0.6L319,9.7L319.5,16.8L319.4,22L318.7,29.2L310.5,32.7L304.9,21.8L304.8,17.5L303.1,12.4L302.8,8L300.8,1.1L296,0L321.5,0ZM287.1,0L285.7,0.4L284.8,0L287.1,0ZM212.7,0L206.6,6.6L204.3,12.4L209.5,12.4L212.7,13.8L214.6,15.6L216.5,18.1L215.3,21.1L216.7,29L216.7,29L216.1,29L213.2,28.3L211.3,26.7L206.1,27.7L199.1,30.2L195.3,30.1L192.3,27.2L179.9,22.9L177.9,22.6L169.7,22.2L169.6,22.2L169.4,15.9L168.5,11.3L165.8,4.4L170.1,2.9L170,0L212.7,0ZM263.7,0L263.8,0.2L262.8,5.5L255.7,11.8L247.8,12.1L239.5,9L227.9,3.2L227,0L263.7,0ZM288.2,23.9L296.1,28.5L301.4,28.2L305,30.1L305.9,33.1L306.3,39.9L302.6,41.9L298.4,41.3L292.7,44L273.9,33.1L274.1,23.9L274.9,20.3L283.7,19.3ZM260.6,34.9L258.7,35.3L256,29.1L255.6,27.2L258.7,23.2L260.8,18.7L265.9,11.8L268.9,3.6L270,3.8L268.7,11L262,31.1ZM340.4,17.2L338.8,18.4L332,17.7L324.5,23.2L321.6,21.6L322.6,18.2L323.4,16.9L325.9,15.4L327.6,13.3L328.1,10L329.8,11.7L334.5,12.3L336.8,13.3L338.8,14.8ZM249.6,27.5L246.6,28.3L243.2,26.6L237.7,20.3L237.1,18.6L239.9,19.7L243.5,23L246.5,23.7L250.5,26.5ZM230.9,24.5L226.3,25.5L224,23.6L219.7,22.9L218.3,11.1L218.7,10.4L220.9,11.2L228.2,16.8L230.8,22.8ZM453.3,0L453.6,2.8L451.8,7.9L451.8,7.9L450.2,9.3L442.8,7.6L433.7,2.8L433.9,0L453.3,0Z"},
    {id:"CZE",c:"",d:"M600,471.3L591.8,471L586.2,470.2L583.7,471.9L580.5,476.8L577.3,485.1L576.2,491.2L574.8,489.6L572,483.5L569.4,482.9L565.9,482.6L563.2,481.9L557.3,478.7L554.3,477.9L551,477.8L548,480.2L545.8,482.9L538.4,483.5L530.1,482.9L517.9,475.4L514.8,475.6L511.6,476.2L506.4,474.6L496.2,469.8L491.5,468.8L488.6,469.8L486.1,471.2L484.2,471.4L483,469.7L479.2,467.8L475.5,467.8L474.5,469.1L474,481.1L473,485.5L467.9,485.6L466.2,487.8L462.5,493.7L462.1,499.3L455.1,498.6L451.7,497.9L448.9,498.8L445.8,502L436.8,502.3L429.6,500.8L426.3,494.1L422.9,491.5L418.7,489.2L417.2,488.8L414.8,485.1L410.4,480.7L403.2,474.6L397.8,475.1L395.8,473.5L394.8,471.2L392.4,467.3L389.8,464.6L386.7,463.6L382.2,460.2L376.1,452.7L370.6,447.5L365.5,447.7L362.1,445L358.7,441.4L356.2,437.9L352.1,429.3L349.3,424.4L347,421.4L344.6,419L343.6,417L346.5,412.3L347.5,409.9L348.7,408.1L349.4,406.3L349.3,404.9L346.5,400.4L342.8,397.2L337.4,394L334,389.8L332.7,386L332.2,383.9L329.9,381.1L327.9,376.9L327.9,374.4L328.3,373.6L330,373.6L332,375.3L334.9,378.5L337.2,383.3L338.6,381.5L341,376.2L345.5,370.3L350.1,366.8L354.3,366.4L357.7,365.4L360.5,363.6L365.6,364.1L369.2,365.2L370.4,364.4L371.7,361.4L372.6,358.7L380.5,356.9L383.1,351.7L384.6,351.7L386.4,350.9L388,348.9L389.6,348L390.9,348.9L392.6,349.5L394.4,348.2L396.7,342.3L398.2,341.4L405.1,340.2L414.5,336.3L419.2,333L423.8,331.2L428.7,328L436.7,324.7L437,323.5L433.1,320.8L431.7,319L430.8,317.1L432,314.9L433.7,314.2L436.1,315L442.9,315.9L444.8,317L445.6,319.9L447.5,322.6L448.9,322.8L448.6,327.4L450.9,329L454.1,330.2L456.1,329.8L457.5,327.9L458,326.6L462.2,326.1L466.3,324L466.4,320.8L465.8,315.1L466.2,314.2L472.6,315.4L479.2,317.7L480.4,323.4L482.3,326.1L484.5,328.5L486.5,329.6L489.9,329.6L498.8,332.4L503,332.8L507.5,334.9L511.2,337L513.9,337.3L515.3,339.9L517.1,341.6L519.8,340L530.1,337.2L534.1,339.5L536.8,342.1L537.3,343L536.1,345.5L535.6,347.4L534.6,348.8L531.2,350.4L529.3,352.7L528,355.2L529.2,357.4L532.2,358.8L534.4,359L535.3,360.6L542.5,367.5L548.6,376.7L550.8,378L552.8,378.2L555,376.6L557.3,373.2L560.2,370.7L562.7,369.3L567.1,366.3L567.1,364.5L562.7,358.4L560,353.3L560.5,352.3L565.4,352.7L574,354.8L587.7,363L589.9,362.8L594.4,361.7L599.1,359.7L600,358.9L600,367.8L600,367.8L596.8,369.6L597.3,371L599,372.6L600,372.9L600,471.3Z"},
    {id:"HRV",c:"",d:"M465.9,727L466.4,725.6L468.2,724.6L469.5,725L470.2,727L465.9,727ZM507,727L507.1,725.7L510.5,722.9L510.2,721.8L505.6,717.7L505.8,716.5L514.9,710.9L523.8,707.5L525.1,705.3L525.7,702L525.7,695.9L524.9,691L520.9,686.6L520.5,684.3L521.2,681.8L522.5,679.5L526,678.3L530.1,676.4L533.3,674.3L537.8,672.5L541.2,670.1L544.2,664.8L546.3,663.8L552.7,664L554,662.7L552.6,655.5L553.6,653.6L555.7,652.4L556.7,651.3L562.3,651.6L567.2,653.1L570.1,654L579.9,658.5L586.9,663.8L591.1,670L596.4,674.7L600,676.4L600,727Z"},
    {id:"BEL",c:"",d:"M0,292.4L2.3,293.3L8,292.7L10.3,291.9L11.8,292.8L13.1,295.6L16.2,298.9L22.9,301.6L25,303L26.3,305.2L25.7,308.1L21.9,315.4L21.3,317.5L21.7,318.3L21,319.7L16.4,324.4L15.9,326.1L17.1,329.1L18.2,331.5L18.2,331.5L20.7,332.8L23.1,333.4L27.6,333.8L32.5,334.3L33,335.7L38.3,340.1L39.8,343.4L43.5,346.7L40,350.4L40.4,352.2L41.5,354.1L45.9,355.4L48,358.1L47.9,362L48.6,368.5L39,374.3L35.9,381.3L35.6,382.7L35.3,382.4L34.4,380L32.7,379.9L29,378.7L23.2,384.8L20.5,390L18.8,393.9L16.4,396.9L15.8,400.2L15.9,401.6L15.1,403.4L14.9,405.3L17.8,409.3L18.4,411.4L21.8,418.3L20.5,420.6L19.4,423.2L18.2,425L16.8,426.1L12.9,425.8L7.9,426.3L4.4,427.4L2.7,427.3L0,424.4L0,292.4Z"},
    {id:"AUT",c:"at",d:"M199.8,606.6L204.1,597.4L205,591.7L201.4,588.2L199.8,587.2L201.1,586.5L206.4,587.2L209.7,585.3L211.5,583.4L216.1,585.2L223,588.9L226.2,591.3L227.5,593.2L228.2,594.8L227.8,597.5L229.4,598.6L232.6,599L234.7,599.8L234,603.4L233.8,606.3L236.8,605.9L240.6,603.7L243.5,599.6L245.3,595.7L246.7,586.3L247.1,585.4L249.4,586.2L258.5,585.8L262.8,587.5L269.5,587.8L269.4,589.3L270.6,591.6L273.7,594.9L275.2,597.1L278.3,597.5L283.2,596.2L286.1,595L287.1,595.8L291.6,594.9L295.5,592.2L296.4,590.1L300.4,588.6L305.7,585.2L313.1,582.5L337.2,579.3L338.1,577.2L337.6,572.4L338.2,571.7L341.3,572.8L346.2,573.8L350,575.4L352.5,577.5L354.7,577.6L358.2,575.9L362.9,574.8L367.3,576.9L368.7,579.4L368,580.7L368.1,582.7L369.5,584.3L373.2,586.9L377.9,589.1L380.3,588.9L381.1,586.6L381.8,581.1L381.9,575.3L380.7,572L378.2,571.2L375.2,571.1L373.7,570.4L374.1,568.6L376.3,563.8L376.1,557.4L370.6,550.4L365.7,543.6L365.7,541.2L368.3,537L372.5,533.6L381.7,527.8L384.6,526.6L388.4,525.5L393.7,523.1L396.3,520.7L398,518.1L400,505L400.6,504.4L401.3,503.6L411,507.7L411.8,506.9L413.4,506.1L416.4,502.5L416.9,499.9L416.7,495L416.7,490.3L417.2,488.8L418.7,489.2L422.9,491.5L426.3,494.1L429.6,500.8L436.8,502.3L445.8,502L448.9,498.8L451.7,497.9L455.1,498.6L462.1,499.3L462.5,493.7L466.2,487.8L467.9,485.6L473,485.5L474,481.1L474.5,469.1L475.5,467.8L479.2,467.8L483,469.7L484.2,471.4L486.1,471.2L488.6,469.8L491.5,468.8L496.2,469.8L506.4,474.6L511.6,476.2L514.8,475.6L517.9,475.4L530.1,482.9L538.4,483.5L545.8,482.9L548,480.2L551,477.8L554.3,477.9L557.3,478.7L563.2,481.9L565.9,482.6L569.4,482.9L572,483.5L574.8,489.6L576.2,491.2L576,492L576,494.9L574.3,498.6L572.6,503.6L573.1,507.7L579.8,521.6L585.4,529.9L586.6,533.2L590,535.5L587.3,539L587.2,543.8L585.4,546.1L585.2,548.9L586.2,551.3L586.4,554.4L587.9,558.6L583.2,559.9L577.5,560.3L575.5,560.7L573.7,562L571.7,561.6L566.2,558L563.2,557.4L561.2,557.8L559.8,559.7L557.4,562.1L555,563.9L555.7,565.2L566.6,568L569,573.4L567.3,578.1L566.8,580.3L564.4,582.3L561.5,584.1L557.8,584.8L557.5,587.2L559.6,594.3L558.5,596L557.5,598.3L559.1,604.1L561.4,604.4L562.1,605.7L561.9,608.1L561.7,610.7L561.1,613.5L560.7,614.7L559.3,615.6L554.4,615.5L550.5,618.2L542.8,627.1L540,628.7L537.1,632.3L537.8,639.6L537.4,640.3L536.8,641.8L526.6,640L526.3,640L519.6,641.4L515.3,645.1L509.9,647.4L498.1,647.1L486.9,649.1L484.2,650.3L481.3,651L478.7,653.1L477.2,655.9L474.6,659.6L470.7,662.5L466.5,664.9L465.5,666.7L464.1,667.8L461.6,666.6L459.6,666.8L457.2,666L449.1,665.4L440.1,664.3L435.9,662.9L431,661.9L425.8,661.2L421.2,661.1L418.9,660.8L407.7,658.5L400.4,658.6L390.8,657.9L371.5,654.4L365.9,652.9L360.6,652.6L354.3,651.4L349.4,649.2L346.3,644.9L342.9,639.1L336.7,631.7L335.4,627.9L337.2,624.5L339,622L338.7,620.9L337.3,620.4L326.9,623.9L316.9,628.2L312.9,628.3L309,627.5L303.9,627.5L299,628.7L289.2,629.3L283.4,632.4L279.8,638.3L277.8,643.1L276.1,644.7L272.7,645.3L267.5,644.8L263.9,643.5L260.2,639.4L254.4,638.9L249.2,638.8L247.8,638L247.9,635.4L245.8,630.4L242.4,628.8L233.5,638.2L231.1,639L223.9,636.4L217.7,632.3L217.1,629.4L216.1,626.9L210.9,624.6L204.4,623L202.3,623L203.1,621.6L203.9,619.2L203.5,617.3L202,615.3L201.1,613.2L200.9,611.1L200.5,609.4L200.2,607.8Z"}
  ],
  lakes: "M31.5,202.9L31.5,202.9L31.5,202.9L31.5,202.9L33.2,200.2L33.2,197.6L31.8,195.3L29,193.8L25.5,193.1L19.8,195.1L11.9,199.7L1.6,207.5L2.2,209.1L4.8,211.2L13.1,214.5L16.6,214.4L19,212.9L22.7,209.2L28.6,205.5ZM0,188.5L1.6,188.5L6.6,185.6L7.2,181L3.7,176.5L1.8,172.5L1,168.6L0,165.6L4.1,162.6L9.8,158.4L15,155.9L15.8,157.7L15.8,168.3L16,170.5L17.5,171.9L21.7,173.1L26.7,173L27,175.6L24.9,178.2L24.5,180L23.9,185.6L24,187.6L25.5,189.9L33.8,192L35.1,195.6L35.1,195.6L35.1,195.6L35.1,195.6L35.1,195.6L34.8,201.6L31.1,205.7L16.2,218.2L8,214.6L0,211.5L0,188.5ZM58.9,666.5L58.4,668.7L57.2,670L47.8,668.2L37.3,668.7L30.2,670.4L20.1,681.8L18.8,681.8L20.6,674.4L31.1,663.1L44.2,658.3L56.1,663.8L58.9,666.5L58.9,666.5ZM210.5,587.1L209.9,588L208.2,588.7L201.4,588.2L196.1,587.9L185.8,581.4L182.4,575.7L179,567.9L179.9,567.2L185,571L192.2,575.4L199.4,579.5L206.1,584.1L210.5,587.1L210.5,587.1L210.5,587.1ZM179.6,575.7L179.6,575.7L179.6,575.7L166.8,576.5L170.4,574.3L172.1,573.1L171.9,571L173,569.3L177.9,572.2Z"
};

const MAP_PLACES = {
  "de|berlin":[385.6,202.7],"de|muenchen":[305.2,540.2],"de|hamburg":[227.2,126.7],
  "de|koeln":[79.4,322.8],"de|frankfurt":[161.3,388.3],"at|wien":[549.2,523.4],
  "ch|zuerich":[149.2,598.3],"de|stuttgart":[183.6,490.7],"de|duesseldorf":[72.3,300.3],
  "de|essen":[84.2,283],"de|karlsruhe":[145.2,472.5],"de|hannover":[214.5,216.9],
  "de|muenster":[114.9,245.6],"ch|genf":[19.5,682],"ch|kanton genf":[19.5,682,"genf"],
  "de|nuernberg":[279,439.8],"de|leipzig":[339.6,294.7],"de|bonn":[85.7,338.3],
  "de|heidelberg":[160.3,442.4],"de|rhein-neckar-kreis":[160.3,442.4,"heidelberg"],
  "de|dortmund":[106,279.5],"de|dresden":[405.8,314.5],"de|ulm":[224.5,520.6],
  "de|mannheim":[149.3,435.9],"ch|luzern":[135.9,622.1],"ch|kanton luzern":[135.9,622.1,"luzern"],
  "de|main-taunus-kreis":[149.7,390],"de|bremen":[172.5,162.2],"ch|basel":[99.2,581.9],
  "de|augsburg":[270.5,522.7],"ch|bern":[90.8,628.4],"ch|dietikon":[141.5,595.4],
  "de|ostalbkreis":[229.8,487],"de|braunschweig":[251.5,225.1],"de|reutlingen":[184.6,513],
  "de|aachen":[37,332.6],"de|paderborn":[167.6,265.9],"ch|baden":[136.8,589.8],
  "de|wiesbaden":[139.7,390],"de|ravensburg":[204.5,567.5],"de|mainz":[141.2,398],
  "de|erlangen":[275.4,429.4],"de|erlangen-hoechstadt":[275.4,429.4,"erlangen"],
  "de|oldenburg":[145.4,156.6],"at|graz":[507.8,613.9],"de|coburg":[272.9,378.4],
  "de|heilbronn":[186.3,463.4],"de|bochum":[94,281.6],"de|koblenz":[107.9,368.4],
  "de|mettmann":[81.7,298.7],"de|bodenseekreis":[197.5,577],"de|guetersloh":[150.2,251.1],
  "de|darmstadt":[159.2,406.9],"de|darmstadt-dieburg":[159.2,406.9,"darmstadt"],
  "de|kiel":[234,67.8],"de|jena":[302.8,326.9],"ch|buelach":[149,586.4],
  "de|gross-gerau":[151,402.9],"at|linz":[442.8,522.8],"at|urfahr":[442.8,522.8,"linz"],
  "de|kleve":[44.2,255.5],"ch|ouest lausannois":[44.3,657.5],"de|pforzheim":[159.7,482.4],
  "de|main-kinzig-kreis":[186.1,382.3],"de|borken":[78.3,253.1],"ch|lausanne":[46.5,659.4],
  "de|rosenheim":[333.5,561.2],"de|rostock":[323.9,84.8],"de|bautzen":[438.7,303.1],
  "de|siegen-wittgenstein":[130.9,329.4],"de|freiburg":[114.8,549],"de|erfurt":[276,323.5],
  "de|offenbach":[165.3,389.6],"ch|zug":[147.1,613.1],"de|starnberg":[293.5,550.8],
  "de|wuppertal":[90,298.6],"de|duisburg":[72.4,284.3],"de|saarbruecken":[76.1,452.8],
  "de|ludwigsburg":[184.5,481.9],"de|rhein-erft-kreis":[64.5,320.4],"de|boeblingen":[175.1,498.2],
  "ch|greyerz":[69.2,652.7],"de|hochtaunuskreis":[158.3,379.7],"de|kaiserslautern":[114.7,438.3],
  "de|rhein-kreis neuss":[67.7,302],"de|osnabrueck":[135.7,222.6],"de|wuerzburg":[223.2,413.9],
  "de|lippe":[173.6,249.3],"at|innsbruck":[296.7,607.3],"de|barnim":[403.6,178.1],
  "de|emsland":[101.6,189.4],"de|goettingen":[223.3,280.9],"de|pinneberg":[218.4,118.4],
  "de|vorpommern-ruegen":[365.6,66.7],"de|bielefeld":[157.8,241.6],"de|cloppenburg":[137,178.7],
  "de|ebersberg":[325.4,544.5],"ch|winterthur":[158.5,587.9],"de|soest":[136.6,276],
  "de|potsdam":[369.9,212.8],"de|kassel":[202.5,297.3],"de|trier":[59.7,412],
  "de|bad kreuznach":[120.5,408.1],"ch|thun":[99.3,643.8],"de|bamberg":[270,405.9],
  "de|chemnitz":[367.5,332.5],"de|stormarn":[244.6,106.8],"de|recklinghausen":[93.6,271.4],
  "de|unna":[116.7,278.2],"de|rhein-lahn-kreis":[114.4,370.1],"de|herford":[164.5,235.6],
  "de|minden-luebbecke":[176.1,222.5],"de|warendorf":[131.9,247.1],"de|tuebingen":[176.9,510.5],
  "ch|sursee":[126,612.6],"de|wunsiedel im fichtelgebirge":[324.1,394.5],
  "de|landsberg am lech":[269.8,547.4],"de|schwerin":[291.7,120.5],
  "de|muehldorf am inn":[353.2,530.9],"de|biberach":[214,543.8],"de|wesel":[66.4,266.1],
  "ch|hochdorf":[135.4,613.1],"de|landau in der pfalz":[131.3,457.6],"de|neu-ulm":[225.4,521],
  "at|villach":[426.8,653.5],"de|bayreuth":[303.3,401.8],"ch|imboden":[195.3,639.9],
  "de|magdeburg":[303.4,235],"de|gera":[326.5,330.2],"de|schwarzwald-baar-kreis":[147.7,545],
  "de|steinfurt":[101.9,230.7],"de|hassberge":[251,395.6],"de|rheingau-taunus-kreis":[131.3,385.4],
  "de|maerkischer":[112.8,302.4],"ch|hoefe":[157.6,611.6],"de|hagen":[105.8,291.3],
  "de|hildesheim":[224.5,233.8],"at|klagenfurt am woerthersee":[450.3,651.3],
  "de|gelsenkirchen":[88.4,279.5],"de|euskirchen":[70.5,343.3],"de|donau-ries":[264.4,496.2],
  "ch|march":[164.6,612],"de|wolfsburg":[263.1,213],"de|leverkusen":[81.4,315.5],
  "de|baden-baden":[136.4,491.2],"de|vorpommern-greifswald":[379.6,82.8],
  "de|steinburg":[205.9,98.2],"de|halle":[320.7,284.3],"at|salzburg":[381,564.2],
  "de|rhein-sieg-kreis":[91.3,333.6],"de|flensburg":[203.3,31.7],"de|heinsberg":[39.1,310.7],
  "at|schwaz":[313,600.2],"de|stade":[203.8,122.7],"ch|lenzburg":[129.8,596],
  "de|coesfeld":[93.3,246.2],"de|grafschaft bentheim":[90.3,208.8],
  "de|muelheim an der ruhr":[77.8,284.6],"de|neumuenster":[227.1,86.7],"ch|arlesheim":[101.4,587],
  "de|gifhorn":[252.7,208.7],"de|wesermarsch":[158.1,142.2],"de|lichtenfels":[277.7,387],
  "de|segeberg":[241.6,97.2],"de|giessen":[161.8,352.3],"de|ennepe-ruhr-kreis":[97.1,296.6],
  "de|schwaebisch hall":[212.2,466],"ch|uster":[158,600],"ch|oberaargau":[109.7,608.6],
  "de|hameln-pyrmont":[196.6,237],"de|fuerth":[274.5,438.2],"at|zell am see":[369.5,601.1],
  "de|rheinisch-bergischer":[88.3,319.3],"de|northeim":[226.6,267.7],"ch|solothurn":[96.2,608.7],
  "de|erding":[321.8,527.1],"de|miesbach":[318.8,566.7],"at|baden":[543.4,539.4],
  "de|celle":[230.8,197.7],"ch|horgen":[151.5,606.5],"de|amberg-sulzbach":[318,440.2],
  "de|fulda":[210.2,355.9],"ch|lavaux-oron":[51.5,661.8],"de|goslar":[246.9,252.7],
  "de|ahrweiler":[85.8,353],"de|weilheim-schongau":[283.9,563.1],"ch|see-gaster":[163.1,609.4],
  "de|guenzburg":[239,516.3],"de|zollernalbkreis":[166.5,529.2],"de|holzminden":[200.5,258.2],
  "ch|appenzell innerrhoden":[193.7,601.9],"de|bergstrasse":[157.8,424.5],
  "de|cottbus":[431.3,259.2],"ch|mendrisio":[169.2,713.4],"de|cuxhaven":[169,101.5],
  "ch|praettigau-davos":[215.5,642.5],"de|brandenburg an der havel":[345.9,212.2],
  "de|dithmarschen":[187.4,76.8],"de|ortenaukreis":[120.8,512.7],"de|kempten":[240.7,572],
  "de|oberbergischer":[109.2,317],"at|liezen":[442.9,579.4],"de|goeppingen":[207.5,497.1],
  "de|viersen":[54,297],"at|wels":[430.4,534.1],"ch|meilen":[154,605.6],"de|calw":[161.5,495.5],
  "at|bregenz":[211.3,589],"de|goerlitz":[465.3,303.5],"de|hamm":[123.3,267.5],
  "ch|bellinzona":[171.6,688.7],"de|regen":[382.1,474.5],"de|aschaffenburg":[184,399.4],
  "de|garmisch-partenkirchen":[281.1,589.9],"at|sankt johann im pongau":[390.2,598.3],
  "ch|willisau":[119.8,616.1],"de|dingolfing-landau":[350.9,500.7],"de|ansbach":[254.9,451.4],
  "de|ostholstein":[255.3,82.1],"de|sigmaringen":[185.4,543.8],"de|krefeld":[61.9,291.1],
  "ch|rheinfelden":[110.6,582.7],"at|bludenz":[215,615.7],"de|vogtlandkreis":[329.9,359.4],
  "de|maerkisch-oderland":[430.7,199.9],"at|moedling":[545.8,533],"de|suhl":[259.7,351.7],
  "de|rems-murr-kreis":[190.7,487],"de|bottrop":[80.5,277.7],"de|gotha":[260,325.8],
  "ch|frauenfeld":[167.6,584.1],"ch|pfaeffikon":[160.7,611.2],"ch|jura-nord vaudois":[48,639.4],
  "de|konstanz":[182,576.5],"de|regensburg":[330.6,472.7],"de|saarpfalz-kreis":[92.8,446.4],
  "de|luebeck":[258.7,102.4],"de|marburg-biedenkopf":[166.8,335.4],
  "de|neuburg-schrobenhausen":[284.9,495],"de|ingolstadt":[296.8,492.3],"de|freising":[313.7,519.7],
  "ch|weinfelden":[178,583.6],"de|zwickau":[346.4,341.4],"de|salzgitter":[246.3,233.4],
  "de|hochsauerlandkreis":[144.5,293.5],"de|oberallgaeu":[239,588],"at|grieskirchen":[420,529.5],
  "ch|plessur":[199.6,638.8],"de|worms":[144.3,424.8],"ch|aarau":[123.1,595.5],
  "ch|olten":[115.6,598.5],"de|vulkaneifel":[70.8,378.7],"de|lindau":[208.1,585.6],
  "ch|nyon":[25.2,668.4],"de|main-tauber-kreis":[208.8,426.7],
  "de|rhein-hunsrueck-kreis":[104,396.7]
};

const MAP_SEATS = {
  "de|main-taunus-kreis":"D:Hofheim am Taunus","de|ostalbkreis":"D:Aalen",
  "de|bodenseekreis":"D:Friedrichshafen","ch|ouest lausannois":"D:Renens",
  "de|main-kinzig-kreis":"D:Gelnhausen","de|siegen-wittgenstein":"D:Siegen",
  "de|rhein-erft-kreis":"D:Bergheim","ch|greyerz":"D:Bulle",
  "de|hochtaunuskreis":"D:Bad Homburg vor der H\u00f6he","de|rhein-kreis neuss":"D:Neuss",
  "de|lippe":"D:Detmold","de|barnim":"D:Eberswalde","de|emsland":"D:Meppen",
  "de|vorpommern-ruegen":"D:Stralsund","de|stormarn":"D:Bad Oldesloe",
  "de|rhein-lahn-kreis":"D:Bad Ems","de|minden-luebbecke":"D:Minden",
  "de|wunsiedel im fichtelgebirge":"D:Wunsiedel","ch|imboden":"D:Domat",
  "de|schwarzwald-baar-kreis":"D:Villingen-Schwenningen","de|hassberge":"D:Ha\u00dffurt",
  "de|rheingau-taunus-kreis":"D:Bad Schwalbach","de|maerkischer":"D:L\u00fcdenscheid",
  "ch|hoefe":"D:Wollerau","de|donau-ries":"D:Donauw\u00f6rth","ch|march":"D:Lachen",
  "de|vorpommern-greifswald":"D:Greifswald","de|steinburg":"D:Itzehoe",
  "de|rhein-sieg-kreis":"D:Siegburg","de|grafschaft bentheim":"D:Nordhorn",
  "de|wesermarsch":"D:Brake (Unterweser)","de|segeberg":"D:Bad Segeberg",
  "de|ennepe-ruhr-kreis":"D:Schwelm","ch|oberaargau":"D:Langenthal","de|hameln-pyrmont":"D:Hameln",
  "de|rheinisch-bergischer":"D:Bergisch Gladbach","de|amberg-sulzbach":"D:Amberg",
  "ch|lavaux-oron":"D:Cully","de|ahrweiler":"D:Bad Neuenahr-Ahrweiler",
  "de|weilheim-schongau":"D:Weilheim","ch|see-gaster":"D:Rapperswil",
  "de|zollernalbkreis":"D:Balingen","ch|appenzell innerrhoden":"C:Appenzell",
  "de|bergstrasse":"D:Heppenheim an der Bergstrasse","ch|praettigau-davos":"D:Davos",
  "de|dithmarschen":"D:Heide","de|ortenaukreis":"D:Offenburg","de|oberbergischer":"D:Gummersbach",
  "de|dingolfing-landau":"D:Dingolfing","de|ostholstein":"D:Eutin","de|vogtlandkreis":"D:Plauen",
  "de|maerkisch-oderland":"D:Seelow","de|rems-murr-kreis":"D:Waiblingen",
  "ch|jura-nord vaudois":"D:Yverdon-les-Bains","de|saarpfalz-kreis":"D:Homburg",
  "de|marburg-biedenkopf":"D:Marburg an der Lahn",
  "de|neuburg-schrobenhausen":"D:Neuburg an der Donau","de|hochsauerlandkreis":"D:Meschede",
  "de|oberallgaeu":"D:Sonthofen","ch|plessur":"D:Chur","de|vulkaneifel":"D:Daun",
  "de|main-tauber-kreis":"D:Tauberbischofsheim","de|rhein-hunsrueck-kreis":"D:Simmern"
};

const W = MAP.w, H = MAP.h;

/* lon/lat -> the map frame, for GEO entries. Fitted against the report's
   own place positions; worst case about 1px off. */
function lambert(lon, lat) {
  const r = Math.PI / 180, l = (lon - 10.5) * r, p = lat * r, p0 = 51.2 * r;
  const k = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(p) +
                           Math.cos(p0) * Math.cos(p) * Math.cos(l)));
  const X = k * Math.cos(p) * Math.sin(l);
  const Y = k * (Math.cos(p0) * Math.sin(p) -
                 Math.sin(p0) * Math.cos(p) * Math.cos(l));
  return [+(4382.009 * X + 250.268).toFixed(1),
          +(-4382.009 * Y + 306.543).toFixed(1)];
}
const mapXY = key => MAP_PLACES[key] ||
  (GEO[key] ? lambert(GEO[key][0], GEO[key][1]) : null);

/* Land keeps a faint wash of each country's bubble colour, so the three
   countries still read apart on the white base the report uses. */
const LAND_FILL = { de: "#FFFAF7", at: "#F6F9FC", ch: "#F6FAF7" };

/* strip administrative suffixes before the coordinate lookup */
const nk = s => String(s)
  .toLowerCase()
  .replace(/\s*\(.*?\)\s*$/g, "")
  .replace(/\s+(kreis|stadt|region|landkreis|bezirk|kanton)$/g, "")
  .replace(/\s+/g, " ")
  .trim();



/* ---------------- map, filterable by role ----------------
   Reads city_role_breakdown.json when the pipeline publishes it.
   Falls back to city_breakdown.json (all roles combined) so the
   page still works before that table exists.               */
(function () {
  const svg = document.getElementById("map");
  const pick = document.getElementById("rolepick");
  const tip = document.getElementById("maptip");
  if (!svg) return;

  const ns = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  };
  let byRole = null;          /* { role: [rows] } or null */
  let current = "All roles";
  let mode = "bubbles";       /* "bubbles" | "heat" */

  /* ---- base map, drawn once: neighbours, the three countries, lakes,
     country names. Everything data-driven goes on top of it. ---- */
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const base = el("g", { class: "base" });
  MAP.land.filter(l => !l.c).forEach(l =>
    el("path", { d: l.d, class: "nb" }, base));
  MAP.land.filter(l => l.c).forEach(l =>
    el("path", { d: l.d, class: "dach", fill: LAND_FILL[l.c] }, base));
  el("path", { d: MAP.lakes, class: "lake" }, base);
  CORDER.forEach(c => {
    const t = el("text", { class: "clab", x: MAP.lab[c][0], y: MAP.lab[c][1],
                           "text-anchor": "middle" }, base);
    t.textContent = CNAME[c].toUpperCase();
  });

  /* ---- merge raw rows into one entry per country+city ---- */
  function merge(rows) {
    const acc = {};
    rows.forEach(r => {
      const c = r.country || "de";
      const k = `${c}|${nk(r.city)}`;
      acc[k] = acc[k] || { key: k, country: c, city: nk(r.city),
                           n: 0, wage: 0 };
      acc[k].n    += r.n_postings;
      acc[k].wage += r.n_postings * (r.avg_age_days || 0);
    });
    return Object.values(acc).map(m => ({
      key: m.key, country: m.country,
      city: m.city === "unknown" ? "not specified" : m.city,
      n_postings: m.n,
      avg_age_days: +(m.wage / m.n).toFixed(1),
    }));
  }

  /* One circle per spot on the map. A canton listed next to its own
     city (Kanton Genf + Genf), or a district next to its main town,
     shares one position, so those rows are added into one circle
     instead of being drawn as two discs on top of each other. */
  function place(rows) {
    const at = {};
    rows.forEach(r => {
      const p = mapXY(r.key);
      if (!p) return;
      const k = p[0] + "," + p[1];
      const a = at[k] = at[k] || { x: p[0], y: p[1], canon: p[2] || null,
        country: r.country, n_postings: 0, wage: 0, members: [] };
      a.n_postings += r.n_postings;
      a.wage += r.n_postings * r.avg_age_days;
      a.members.push(r);
    });
    return Object.values(at).map(a => {
      a.members.sort((m, n) => n.n_postings - m.n_postings);
      a.avg_age_days = a.wage / a.n_postings;
      a.city = a.canon || a.members[0].city;
      a.key = a.members[0].key;
      a.seat = a.members.length === 1 ? MAP_SEATS[a.key] : null;
      return a;
    }).sort((a, b) => b.n_postings - a.n_postings);
  }

  function showTip(e, r) {
    if (!tip) return;
    const seat = r.seat ? `<br>${r.seat[0] === "C" ? "Canton" : "District"},` +
      ` drawn at ${esc(r.seat.slice(2))}` : "";
    const both = r.members && r.members.length > 1
      ? "<br>Combined: " + r.members.map(m =>
          `${esc(cityName(m.city))} (${m.n_postings})`).join(", ") : "";
    tip.innerHTML =
      `<b>${esc(cityName(r.city))}</b>` +
      `${CNAME[r.country] || r.country}<br>` +
      `<em>${r.n_postings.toLocaleString()}</em> ` +
      `posting${r.n_postings === 1 ? "" : "s"}` +
      ` · avg ${Math.round(r.avg_age_days)} days open` +
      (current !== "All roles" ? `<br>${esc(rlab(current))}` : "") +
      seat + both;
    tip.style.opacity = 1;
    moveTip(e);
  }
  /* The page ships at html{zoom:.8}, which also scales position:fixed
     children, while clientX/clientY stay in unzoomed viewport pixels.
     Dividing by the computed zoom puts the tooltip back under the
     cursor; it reads 1 on browsers that ignore zoom.               */
  function rootZoom() {
    const z = parseFloat(
      getComputedStyle(document.documentElement).zoom);
    return (z && isFinite(z) && z > 0) ? z : 1;
  }
  function moveTip(e) {
    if (!tip) return;
    const pad = 14, z = rootZoom();
    const cx = e.clientX / z, cy = e.clientY / z;
    const vw = window.innerWidth / z, vh = window.innerHeight / z;
    let x = cx + pad, y = cy + pad;
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    if (x + w > vw - 8) x = cx - w - pad;
    if (y + hh > vh - 8) y = cy - hh - pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  function hideTip() { if (tip) tip.style.opacity = 0; }

  /* ---- heat surface -------------------------------------------
     A kernel density estimate rather than a pile of translucent
     discs. Every city drops a Gaussian onto a 9px grid, the grid is
     normalised against its own peak and painted through a six-stop
     cold-to-hot ramp, and a single blur smooths the cells.
     Neighbouring cities therefore sum, so the Rhine-Ruhr corridor
     reads as one hot region instead of eight overlapping circles.
     Cells outside the three countries are dropped, so the surface
     never bleeds into the sea or into France. Transparent hit
     circles sit on top, so the tooltip behaves as in bubble mode. */
  const HEAT = [[0, "#EDEAE2"], [.15, "#9FB4C4"], [.35, "#6E8CA0"],
                [.55, "#C7A87C"], [.75, "#D97757"], [1, "#A63C22"]];
  const CELL = 9, SIG = 22;
  const GX = Math.ceil(W / CELL) + 1, GY = Math.ceil(H / CELL) + 1;

  const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  function ramp(t) {
    for (let i = 1; i < HEAT.length; i++) {
      if (t <= HEAT[i][0]) {
        const u = (t - HEAT[i - 1][0]) / (HEAT[i][0] - HEAT[i - 1][0]);
        const A = hx(HEAT[i - 1][1]), B = hx(HEAT[i][1]);
        return "rgb(" + A.map((v, k) =>
          Math.round(v + (B[k] - v) * u)).join(",") + ")";
      }
    }
    return HEAT[HEAT.length - 1][1];
  }

  function heatDefs() {
    if (svg.querySelector("#heatdefs")) return;
    const defs = document.createElementNS(ns, "defs");
    defs.setAttribute("id", "heatdefs");
    const f = document.createElementNS(ns, "filter");
    f.setAttribute("id", "heatblur");
    f.setAttribute("x", "-8%");  f.setAttribute("y", "-8%");
    f.setAttribute("width", "116%"); f.setAttribute("height", "116%");
    const b = document.createElementNS(ns, "feGaussianBlur");
    b.setAttribute("stdDeviation", "6");
    f.appendChild(b);
    defs.appendChild(f);
    svg.insertBefore(defs, svg.firstChild);
  }

  /* which grid cells fall on DACH land, computed once by testing the
     border paths themselves on a throwaway canvas */
  let LAND = null;
  function landMask() {
    if (LAND) return LAND;
    const cx = document.createElement("canvas").getContext("2d");
    const paths = MAP.land.filter(l => l.c).map(l => new Path2D(l.d));
    LAND = new Uint8Array(GX * GY);
    for (let j = 0; j < GY; j++)
      for (let i = 0; i < GX; i++)
        LAND[j * GX + i] = paths.some(p =>
          cx.isPointInPath(p, i * CELL, j * CELL)) ? 1 : 0;
    return LAND;
  }

  /* ---- redraw the map and the ranking table ---- */
  let lastRows = null;

  /* ---- country totals ----------------------------------------
     Counted from the same rows the map draws, not from
     country_breakdown.json, so the strip always agrees with the
     bubbles even when a role is selected. Cities without a map
     position still count here: they are postings, they just have
     no dot. */
  function drawTotals(rows) {
    const box = document.getElementById("ctrytot");
    if (!box) return;

    const n = {};
    rows.forEach(r => n[r.country] = (n[r.country] || 0) + r.n_postings);
    const total = CORDER.reduce((s, c) => s + (n[c] || 0), 0);
    if (!total) { box.innerHTML = ""; return; }

    const label = current === "All roles"
      ? "across all roles" : rlab(current);

    /* data-ab is what the narrow breakpoint shows in place of the
       full name and share, so the chips still say which is which */
    box.innerHTML = CORDER.filter(c => n[c]).map(c =>
      `<div class="c" data-ab="${c.toUpperCase()}"
            title="${CNAME[c]}: ${n[c].toLocaleString()} of ` +
      `${total.toLocaleString()} (${(100 * n[c] / total).toFixed(1)}%)">
         <i style="background:${CCOL[c]}"></i>
         <b>${n[c].toLocaleString()}</b>
         <u>${CFLAG[c] || ""} ${CNAME[c]}</u>
         <s>${(100 * n[c] / total).toFixed(1)}%</s>
       </div>`).join("") +
      `<div class="c tot" data-ab="DACH"
            title="${esc(label)}: ${total.toLocaleString()} postings">
         <b>${total.toLocaleString()}</b>
         <u>DACH total</u>
         <s>${esc(label)}</s>
       </div>`;
  }

  /* A bubble or a table row is a city plus whatever role is selected,
     which is exactly the pair of filters the browser below takes. A
     combined circle opens its biggest member. */
  function drillCity(r) {
    const city = r.members ? r.members[0].city : r.city;
    openPostings({
      city: `${r.country}|${city}`,
      country: r.country,
      family: current === "All roles" ? "" : current
    });
  }

  function draw(rows) {
    if (rows) lastRows = rows;
    rows = lastRows || [];

    drawTotals(rows);

    svg.querySelectorAll(".bub,.lbl,.heat,.hit,.szl").forEach(n => n.remove());

    const d = merge(rows);
    const spots = place(d);

    if (spots.length) {
      const vmax = spots[0].n_postings;
      /* area proportional to postings, as in the report */
      const R = n => Math.max(2.2, 30 * Math.sqrt(n / vmax));

      if (mode === "heat") {
        heatDefs();
        const land = landMask();

        const field = new Float64Array(GX * GY);
        const span = Math.ceil(SIG * 2.5 / CELL);
        spots.forEach(r => {
          const cx = r.x, cy = r.y;
          /* linear weight, not sqrt: Munich's 300 postings must read
             hotter than eight neighbouring towns with 5 each */
          const w = r.n_postings;
          const gx = Math.round(cx / CELL), gy = Math.round(cy / CELL);
          for (let i = gx - span; i <= gx + span; i++) {
            if (i < 0 || i >= GX) continue;
            for (let j = gy - span; j <= gy + span; j++) {
              if (j < 0 || j >= GY) continue;
              const dx = i * CELL - cx, dy = j * CELL - cy;
              field[j * GX + i] +=
                w * Math.exp(-(dx * dx + dy * dy) / (2 * SIG * SIG));
            }
          }
        });

        let fmax = 0;
        for (let i = 0; i < field.length; i++)
          if (field[i] > fmax) fmax = field[i];

        const g = el("g", { class: "heat", filter: "url(#heatblur)" });
        if (fmax > 0) {
          for (let j = 0; j < GY; j++) {
            for (let i = 0; i < GX; i++) {
              const k = j * GX + i;
              if (!land[k]) continue;
              const t = field[k] / fmax;
              if (t < 0.05) continue;
              el("rect", {
                x: i * CELL - CELL / 2, y: j * CELL - CELL / 2,
                width: CELL, height: CELL, fill: ramp(t),
                "fill-opacity": (0.18 + 0.72 * Math.min(1, t * 1.35)).toFixed(2)
              }, g);
            }
          }
        }

        /* transparent hit targets so the tooltip still works */
        spots.forEach(r => {
          const c = el("circle", { class: "hit", cx: r.x, cy: r.y,
                                   r: Math.max(8, R(r.n_postings)) });
          c.addEventListener("mouseenter", e => showTip(e, r));
          c.addEventListener("mousemove", moveTip);
          c.addEventListener("mouseleave", hideTip);
          c.addEventListener("click", () => drillCity(r));
        });
      } else {
        /* biggest first, so small places stay clickable on top */
        spots.forEach(r => {
          const c = el("circle", { class: "bub", cx: r.x, cy: r.y,
            r: R(r.n_postings).toFixed(2),
            fill: CCOL[r.country] || CORAL, "fill-opacity": .7 });
          c.addEventListener("mouseenter", e => showTip(e, r));
          c.addEventListener("mousemove", moveTip);
          c.addEventListener("mouseleave", hideTip);
          c.addEventListener("click", () => drillCity(r));
        });
      }

      /* Labels: biggest places first, each in the first free spot
         around its circle. The top two of every country go first, so
         Vienna and Zurich keep a name even when Germany dominates. */
      const boxes = [];
      const hit = (b, o) => b[0] < o[0] + o[2] + 3 && o[0] < b[0] + b[2] + 3 &&
                            b[1] < o[1] + o[3] + 1 && o[1] < b[1] + b[3] + 1;
      svg.querySelectorAll(".clab").forEach(t => {
        const b = t.getBBox();
        boxes.push([b.x, b.y, b.width, b.height]);
      });
      const free = b => b[0] > 2 && b[1] > 2 && b[0] + b[2] < W - 2 &&
                        b[1] + b[3] < H - 2 && !boxes.some(o => hit(b, o));
      const lead = CORDER.flatMap(c =>
        spots.filter(r => r.country === c).slice(0, 2));
      const order = lead.concat(spots.filter(r => !lead.includes(r)));
      const maxLab = 12, h = 15;
      let n = 0;
      for (const r of order) {
        if (n >= maxLab) break;
        const x = r.x, y = r.y, rr = R(r.n_postings);
        const t = el("text", { class: "lbl", x, y,
                               "dominant-baseline": "central" });
        t.textContent = cityName(r.city);
        const w = t.getComputedTextLength();
        const spots4 = [
          { x: x + rr + 4, y, a: "start", b: [x + rr + 3, y - h / 2, w + 2, h] },
          { x: x - rr - 4, y, a: "end",   b: [x - rr - 5 - w, y - h / 2, w + 2, h] },
          { x, y: y - rr - 9, a: "middle", b: [x - w / 2 - 1, y - rr - 9 - h / 2, w + 2, h] },
          { x, y: y + rr + 10, a: "middle", b: [x - w / 2 - 1, y + rr + 10 - h / 2, w + 2, h] }];
        const s = spots4.find(q => free(q.b));
        if (!s) { t.remove(); continue; }
        t.setAttribute("x", s.x.toFixed(1));
        t.setAttribute("y", s.y.toFixed(1));
        t.setAttribute("text-anchor", s.a);
        boxes.push(s.b);
        n++;
      }
    }

    const top = d.filter(r => r.city !== "not specified")
                 .sort((a, b) => b.n_postings - a.n_postings)
                 .slice(0, 40);
    const body = document.getElementById("cityrank");
    if (!body) return;
    if (!top.length) {
      body.innerHTML =
        `<tr><td colspan="4" style="color:#8A857C">` +
        `No cities for this role.</td></tr>`;
      return;
    }
    const mx = top[0].n_postings;
    body.innerHTML = top.map((r, i) => `
      <tr class="drill" data-i="${i}">
        <td>${cityName(r.city)}
            <span class="flag" title="${CNAME[r.country] || r.country}"
            >${String(r.country).toUpperCase()}</span></td>
        <td class="barcell">
          <span class="b" style="width:${100 * r.n_postings / mx}%;
                background:${CCOL[r.country] || CORAL}"></span>
        </td>
        <td class="num" style="color:${CCOL[r.country] || CORAL};
            font-weight:600">${r.n_postings}</td>
        <td class="num" style="color:${CCOL[r.country] || CORAL};
            font-weight:600">${Math.round(r.avg_age_days)}</td>
      </tr>`).join("");

    body.querySelectorAll("tr.drill").forEach(tr =>
      tr.addEventListener("click",
        () => drillCity(top[+tr.dataset.i])));
    fitRank();
  }

  /* Next to the map, the ranking runs down to the map's bottom edge:
     every row that still fits is shown. Stacked under the map (phones)
     it stays at 14 rows. */
  function fitRank() {
    const body = document.getElementById("cityrank");
    const plot = document.querySelector("#geo .map-plot");
    if (!body || !plot) return;
    const rows = [...body.querySelectorAll("tr")];
    rows.forEach(tr => tr.hidden = false);
    const pb = plot.getBoundingClientRect();
    const beside = body.getBoundingClientRect().top < pb.bottom;
    rows.forEach((tr, i) => {
      tr.hidden = beside ? tr.getBoundingClientRect().bottom > pb.bottom + 1
                         : i >= 14;
    });
  }
  let fitT = null;
  addEventListener("resize", () => {
    clearTimeout(fitT);
    fitT = setTimeout(fitRank, 120);
  });

  /* ---- build the role buttons ---- */
  function buildPicker(roles, enabled) {
    if (!pick) return;
    const names = ["All roles"].concat(roles);
    pick.innerHTML = names.map(n =>
      `<button type="button" data-role="${n}"
               aria-pressed="${n === current}">${rlab(n)}</button>`).join("")
      + (enabled ? "" :
         `<span class="hint">per-role view needs
          city_role_breakdown.json</span>`);

    pick.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        current = b.dataset.role;
        pick.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-pressed", x.dataset.role === current));
        draw(current === "All roles"
             ? Object.values(byRole).flat()
             : (byRole[current] || []));
      });
    });
  }

  /* ---- bubbles / heat toggle ---- */
  const modePick = document.getElementById("mapmode");
  if (modePick) {
    modePick.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        mode = b.dataset.mode;
        modePick.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-pressed", x.dataset.mode === mode));
        const lb = document.getElementById("leg-bubbles");
        const lh = document.getElementById("leg-heat");
        if (lb) lb.hidden = mode !== "bubbles";
        if (lh) lh.hidden = mode !== "heat";
        draw();
      });
    });
  }

  Promise.all([get("city_role_breakdown"), get("city_breakdown")])
    .then(([cr, cb]) => {
      if (cr && cr.length && cr[0].role_family !== undefined) {
        byRole = {};
        /* live() for the same reason as the survival picker: the
           button list is whatever the JSON contains. */
        live(cr).forEach(r => {
          (byRole[r.role_family] = byRole[r.role_family] || []).push(r);
        });
        const roles = Object.keys(byRole).sort((a, b) =>
          byRole[b].reduce((s, r) => s + r.n_postings, 0) -
          byRole[a].reduce((s, r) => s + r.n_postings, 0));
        buildPicker(roles, true);
        draw(live(cr));
      } else if (cb && cb.length) {
        byRole = { "All roles": cb };
        buildPicker([], false);
        draw(cb);
      }
    });
})();

/* ---------------- roles ---------------- */
get("role_breakdown").then(all => {
  if (!all || !all.length) return;
  const d = live(all);
  if (!d.length) return;

  const agg = {};
  d.forEach(r => {
    const k = r.role_family;
    agg[k] = agg[k] || { n: 0, wage: 0 };
    agg[k].n    += r.n_postings;
    agg[k].wage += r.n_postings * r.avg_age_days;
  });

  const rows = Object.entries(agg)
    .map(([role, v]) => ({ role, n: v.n, age: v.wage / v.n }))
    .sort((a, b) => b.n - a.n);
  const roles = rows.map(r => r.role);

  bar("rolevol", roles.map(r => wrap(rlab(r))),
      [ds("Live postings", rows.map(r => r.n),
          rows.map((r, i) => rcol(r.role, i)))], true, false, false,
      { x: "live postings", y: "role",
        pick: i => openPostings({ family: rows[i].role }) });

  const byAge = rows.slice().sort((a, b) => b.age - a.age);
  bar("roleage", byAge.map(r => wrap(rlab(r.role))),
      [ds("Avg days open", byAge.map(r => Math.round(r.age)),
          byAge.map(r => ageColour(r.age)))], true, false, false,
      { x: "average days a posting stays open", y: "role",
        pick: i => openPostings({ family: byAge[i].role }) });

  /* --- role mix by country, as an over/under-index -----------------
     A 100% stacked bar over 15 roles is unreadable and mostly restates
     that everyone hires Data Engineers. What is actually interesting is
     deviation: this cell divides a country's share of a role by the
     DACH-wide share of that role. 1.00 is "exactly normal", 2.00 is
     "twice as into this as the region", 0.50 is half.

     Counts under MIN_N are shown greyed and unclicked, because an index
     computed off 3 postings is noise wearing a number's clothes.     */
  const idxBox = document.getElementById("ctryidx");
  if (idxBox && d[0].country !== undefined) {
    const MIN_N = 8;
    const tot = {};
    d.forEach(r => tot[r.country] = (tot[r.country] || 0) + r.n_postings);
    const countries = CORDER.filter(c => tot[c]);
    const totalAll  = countries.reduce((s, c) => s + tot[c], 0);

    const cnt = (c, rf) =>
      d.filter(r => r.country === c && r.role_family === rf)
       .reduce((s, r) => s + r.n_postings, 0);

    /* index = country share of role ÷ DACH share of role */
    const idx = (c, rf) => {
      const base = rows.find(r => r.role === rf).n / totalAll;
      if (!base || !tot[c]) return null;
      return (cnt(c, rf) / tot[c]) / base;
    };

    /* Diverging scale anchored at 1. Log-ish so 0.5 and 2.0 sit
       symmetrically either side of the neutral colour.            */
    const CELL = v => {
      /* eased so a 1.3× still reads as tinted, and clamped in
         lightness so black text stays legible at both extremes. */
      const raw = Math.max(-1, Math.min(1, Math.log2(v)));   /* ±2× */
      const t   = Math.sign(raw) * Math.pow(Math.abs(raw), 0.65);
      const mix = (n, a, b) => Math.round(n + (a - n) * b);
      const N = [244, 242, 236];                 /* neutral  */
      if (t >= 0) return `rgb(${mix(N[0], 231, t)},` +
                         `${mix(N[1], 148, t)},` +
                         `${mix(N[2], 106, t)})`;   /* warm  */
      const a = -t;
      return `rgb(${mix(N[0], 133, a)},` +
             `${mix(N[1], 176, a)},` +
             `${mix(N[2], 196, a)})`;
    };
    /* One ink colour everywhere; the scale above stays light
       enough that black reads at both ends. */
    const INK = () => "#191919";

    /* Rows sorted by how much the countries disagree about them:
       the top of the table is where the interesting divergence is. */
    const ordered = roles.slice().sort((a, b) => {
      const sp = rf => {
        const vs = countries.map(c => idx(c, rf)).filter(v => v != null);
        return vs.length ? Math.max(...vs) - Math.min(...vs) : 0;
      };
      return sp(b) - sp(a);
    });

    idxBox.style.gridTemplateColumns =
      `minmax(150px,1.2fr) repeat(${countries.length}, minmax(0,1fr))`;

    let ih = '<div class="hd"></div>' +
             countries.map(c => `<div class="hd">${CNAME[c]}</div>`).join("");

    ordered.forEach(rf => {
      ih += `<div class="rw">${rlab(rf)}</div>`;
      countries.forEach(c => {
        const n = cnt(c, rf), v = idx(c, rf);
        if (!n || v == null) {
          ih += `<div style="background:#F5F3ED;color:#A9A49A">-</div>`;
          return;
        }
        /* Thin cells stay clickable - the reader may well want to
           see those 3 postings - but are washed toward neutral so the
           eye does not read a 2.3× off four rows as a real signal. */
        const thin = n < MIN_N;
        const bg   = thin ? CELL(1 + (v - 1) * 0.25) : CELL(v);
        const fg   = INK(v);
        const tip  = `${CNAME[c]} · ${rlab(rf)}: ${n} postings, ` +
                     `${v.toFixed(2)}× the DACH average` +
                     (thin ? " (too few postings to read into)" : "");
        ih += `<div class="cell${thin ? " thin" : ""}" title="${tip}"` +
              ` data-c="${c}" data-rf="${rf}"` +
              ` style="background:${bg};color:${fg}">` +
              `<span class="big">${n}</span>` +
              `<span class="sub">${v.toFixed(2)}×</span></div>`;
      });
    });
    idxBox.innerHTML = ih;

    idxBox.addEventListener("click", e => {
      const el = e.target.closest(".cell");
      if (!el) return;
      openPostings({ country: el.dataset.c, family: el.dataset.rf });
    });
  }

  /* seniority levels, for the totals below */
  const levels = ["junior", "mid", "senior"];

  /* seniority totals */
  const sen = levels.map(lv => {
    const rs = d.filter(r => r.seniority === lv);
    const n  = rs.reduce((s, r) => s + r.n_postings, 0);
    const ag = n ? rs.reduce((s, r) =>
                 s + r.n_postings * r.avg_age_days, 0) / n : 0;
    return { lv, n, ag };
  });



  bar("senage", sen.map(s => s.lv),
      [ds("Avg days open", sen.map(s => Math.round(s.ag)),
          sen.map(s => ageColour(s.ag)))],
      false, false, false,
      { x: "seniority level", y: "average days a posting stays open" });
});

/* ---------------- agency ---------------- */
get("agency_comparison").then(d => {
  if (!d) return;
  bar("agency", d.map(r => r.poster_type),
      [ds("Avg days open", d.map(r => r.avg_age_days), CLAY),
       ds("% open over 60 days", d.map(r => r.pct_over_60d), TEAL)],
      false, false, false,
      { x: "who posted the job",
        y: "days open (bar 1) · % over 60 days (bar 2)" });
});

/* ---------------- employers ----------------
   Built from POSTINGS rather than stale_by_company, because the role
   filter needs a company x role_family cut and the precomputed table
   only carries company totals. POSTINGS is already fetched for the
   postings browser, so this costs no extra request. Counts can sit a
   little under stale_by_company: POSTINGS drops rows with no url and
   rows in retired roles. */
function initEmployers() {
  if (!POSTINGS.length) return;

  const EALL = "All roles";
  const pick = document.getElementById("emppick");
  let current = EALL;

  /* roles ordered by how many postings they hold */
  const famCount = {};
  POSTINGS.forEach(r => {
    if (r.role_family) famCount[r.role_family] =
      (famCount[r.role_family] || 0) + 1;
  });
  const fams = Object.keys(famCount)
    .sort((a, b) => famCount[b] - famCount[a]);

  function topCompanies(role) {
    const agg = {};
    POSTINGS.forEach(r => {
      if (!r.company) return;
      if (role !== EALL && r.role_family !== role) return;
      const a = agg[r.company] = agg[r.company] || { n: 0, age: 0 };
      a.n++;
      a.age += (r.age_days || 0);
    });
    return Object.entries(agg)
      .map(([company, a]) => ({ company, n: a.n, avg: a.age / a.n }))
      .sort((x, y) => y.n - x.n || x.company.localeCompare(y.company))
      .slice(0, 15);
  }

  function draw() {
    const vol = topCompanies(current);
    const el = document.getElementById("empvol");
    if (el && Chart.getChart) {
      const old = Chart.getChart(el);
      if (old) old.destroy();
    }
    if (!vol.length) return;
    bar("empvol", vol.map(r => wrap(r.company, 24)),
        [ds("Live postings", vol.map(r => r.n), CORAL)],
        true, false, false,
        { x: "live postings",
          y: "company",
          /* no company dropdown: the search box already matches on
             employer, so a click just fills it in */
          pick: i => openPostings(current === EALL
            ? { q: vol[i].company }
            : { q: vol[i].company, family: current }) });
  }

  if (pick && fams.length) {
    const names = [EALL].concat(fams);
    pick.innerHTML = names.map(n =>
      `<button type="button" data-role="${esc(n)}"
               title="${n === EALL
                 ? POSTINGS.length.toLocaleString() + " postings"
                 : famCount[n].toLocaleString() + " postings"}"
               aria-pressed="${n === current}">` +
      `${n === EALL ? EALL : esc(rlab(n))}</button>`).join("");

    pick.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        current = b.dataset.role;
        pick.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-pressed", x.dataset.role === current));
        draw();
      });
    });
  } else if (pick) {
    pick.closest(".mapctl").hidden = true;
  }

  draw();
}

/* ---------------- postings browser ----------------------------
   The only row-level view on the page. Everything else is a count;
   this is what was counted.

   Filtering runs over the whole array on every keystroke. At a few
   thousand rows that is well under a frame, and an index would be
   code to maintain for a speedup nobody can perceive. If postings.json
   ever grows past ~20k rows, this is the thing to revisit.

   Rendering is paged rather than appended. Painting 3,600 table rows
   is what would actually be slow, not filtering them, and a page
   number tells you where you are in a way an ever-growing scroll
   does not.                                                    */
const PAGE = 10;
let POSTINGS = [], ppage = 1;

/* Selected skills. Best-match, not AND: a posting qualifies if it
   names at least one selected skill, and the ones naming more are
   ranked first. Strict AND kept handing back "no matches" as soon as
   someone picked three things. */
let PSKILLS = new Set();
const rSkills = r => Array.isArray(r.skills) ? r.skills : [];
const pHits = r => {
  const sk = rSkills(r);
  let n = 0;
  PSKILLS.forEach(x => { if (sk.includes(x)) n++; });
  return n;
};

const $p = id => document.getElementById(id);

/* dd/mm-agnostic: created_date arrives as an ISO string. */
const pDate = r => String(r.created_date || "").slice(0, 10);

function pFill(sel, values, allLabel, label) {
  if (!sel) return;
  sel.innerHTML = `<option value="">${allLabel}</option>` +
    values.map(v =>
      `<option value="${v}">${label ? label(v) : cap(v)}</option>`)
      .join("");
}

function pFiltered() {
  const q    = ($p("pq").value || "").trim().toLowerCase();
  const fam  = $p("pfam").value;
  const ctry = $p("pctry").value;
  const city = $p("pcity").value;
  const sen  = $p("psen").value;

  let out = POSTINGS.filter(r =>
    (!fam  || r.role_family === fam) &&
    (!ctry || r.country     === ctry) &&
    /* keyed country|city: Baden exists in all three countries, and
       so do several smaller names */
    (!city || `${r.country}|${r.city}` === city) &&
    (!sen  || r.seniority   === sen) &&
    (!PSKILLS.size || pHits(r) > 0) &&
    (!q    || (r.title   || "").toLowerCase().includes(q)
           || (r.company || "").toLowerCase().includes(q)
           || rSkills(r).some(sk => sk.includes(q))));

  const sort = $p("psort").value;
  const byTitle = (a, b) =>
    String(a.title).localeCompare(String(b.title), "de");
  const base =
    sort === "old" ? (a, b) => pDate(a).localeCompare(pDate(b))
  : sort === "age" ? (a, b) => b.age_days - a.age_days
  : sort === "az"  ? byTitle
  :                  (a, b) => pDate(b).localeCompare(pDate(a));
  /* with several skills picked, match count outranks the chosen sort;
     the sort still decides ties inside each match level */
  const cmp = PSKILLS.size > 1
    ? (a, b) => (pHits(b) - pHits(a)) || base(a, b)
    : base;
  out = out.slice().sort(cmp);

  return out;
}

/* Which page buttons to show. Always the first and last page plus the
   current one and its neighbours, with a gap marker where the run
   breaks, so 182 pages do not become 182 buttons. */
function pPageList(cur, last) {
  const want = new Set([1, last, cur - 1, cur, cur + 1]);
  const ns = [...want].filter(n => n >= 1 && n <= last)
                      .sort((a, b) => a - b);
  const out = [];
  ns.forEach((n, i) => {
    if (i && n - ns[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

function pPager(last) {
  const nav = $p("ppag");
  if (!nav) return;

  /* one page needs no controls */
  nav.hidden = last <= 1;
  if (nav.hidden) { nav.innerHTML = ""; return; }

  const btn = (label, page, extra) =>
    `<button type="button" data-page="${page}"${extra || ""}>` +
    `${label}</button>`;

  nav.innerHTML =
    btn("‹ Prev", ppage - 1, ppage === 1 ? " disabled" : "") +
    pPageList(ppage, last).map(n =>
      n === "gap" ? `<span class="gap">…</span>`
        : btn(n, n, n === ppage
            ? ` aria-current="page"` : "")).join("") +
    btn("Next ›", ppage + 1, ppage === last ? " disabled" : "");

  nav.querySelectorAll("button[data-page]").forEach(b =>
    b.addEventListener("click", () => {
      const n = +b.dataset.page;
      if (n < 1 || n > last || n === ppage) return;
      ppage = n;
      pRender();
      /* a page change replaces the rows under the reader, so put the
         top of the table back in view rather than leaving them at the
         pager they just clicked */
      $p("postings-section").scrollIntoView({ behavior: "smooth",
                                              block: "start" });
    }));
}

function pRender() {
  const rows = pFiltered();
  const body = $p("pbody");

  const last = Math.max(1, Math.ceil(rows.length / PAGE));
  if (ppage > last) ppage = last;
  if (ppage < 1) ppage = 1;

  const from  = (ppage - 1) * PAGE;
  const slice = rows.slice(from, from + PAGE);

  body.innerHTML = slice.length ? slice.map(r => {
    const fam = String(r.role_family || "").toLowerCase();
    /* 60+ days is the threshold the rest of the page treats as stale,
       so flag it here too rather than inventing a second one. */
    const stale = r.age_days > 60 ? ' class="stale"' : "";
    /* selected skills first so a match is visible without reading
       every tag; the rest capped so one keyword-stuffed ad does not
       triple the row height */
    const sk = rSkills(r);
    const shown = [...sk.filter(x => PSKILLS.has(x)),
                   ...sk.filter(x => !PSKILLS.has(x))].slice(0, 6);
    const tags = sk.length
      ? `<div class="tags">` +
        shown.map(x =>
          `<span class="tag${PSKILLS.has(x) ? " on" : ""}">${esc(x)}</span>`)
          .join("") +
        (sk.length > shown.length
          ? `<span class="tag">+${sk.length - shown.length}</span>` : "") +
        `</div>`
      : "";
    return `<tr>
      <td><a href="${r.url}" target="_blank"
             rel="noopener nofollow">${esc(r.title)}</a>${tags}</td>
      <td>${esc(r.company)}${r.is_agency
            ? ' <span class="flag">agency</span>' : ""}</td>
      <td>${esc(cityName(r.city))}
          <span class="flag">${String(r.country).toUpperCase()}</span></td>
      <td class="fam"><span class="dot"
            style="background:${rcol(fam, 0)}"></span>${rlab(fam)}</td>
      <td>${esc(cap(r.seniority))}</td>
      <td class="num"${stale}>${r.age_days}</td>
    </tr>`;
  }).join("")
    : `<tr><td colspan="6" class="empty">
         No postings match those filters.</td></tr>`;

  $p("pcount").textContent = rows.length
    ? `Showing ${(from + 1).toLocaleString()}-` +
      `${(from + slice.length).toLocaleString()} of ` +
      `${rows.length.toLocaleString()} postings` +
      (last > 1 ? `  ·  page ${ppage} of ${last}` : "") +
      (PSKILLS.size
        ? `  ·  naming ${PSKILLS.size > 1 ? "any of " : ""}` +
          `${[...PSKILLS].join(", ")}` +
          (PSKILLS.size > 1 ? ", best matches first" : "") : "") +
      (rows.length < POSTINGS.length
        ? `  ·  filtered from ${POSTINGS.length.toLocaleString()}` : "")
    : `No matches out of ${POSTINGS.length.toLocaleString()} postings` +
      (PSKILLS.size
        ? `  ·  no posting names any of the selected skills` : "");

  pPager(last);
}

/* escaping: employer names are third-party strings going into
   innerHTML, so they do not get to carry markup. */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;" }[c]));
}

/* Entry point for the chart drill-downs. Reset by pCitiesRefresh so
   a drill-down never inherits a city left over from browsing. */
let pCitiesRefresh = () => {};
let pSkillsRefresh = () => {};

function openPostings(filter) {
  const sec = $p("postings-section");
  if (!sec || sec.hidden) return;
  $p("pq").value    = filter.q        || "";
  $p("pfam").value  = filter.family   || "";
  $p("pctry").value = filter.country  || "";
  $p("pcity").value = "";
  $p("psen").value  = filter.seniority || "";
  PSKILLS = new Set(filter.skills || []);
  pSkillsRefresh();
  pCitiesRefresh();
  if (filter.city) $p("pcity").value = filter.city;
  /* A drill-down is a "show me these" gesture, so lead with the ones
     that have been open longest: that is where a reader's eye goes
     after clicking a bar about how long postings stay open. */
  $p("psort").value = "age";
  ppage = 1;
  pRender();
  sec.scrollIntoView({ behavior: "smooth", block: "start" });
}

get("postings").then(d => {
  if (!Array.isArray(d) || !d.length) return;

  POSTINGS = d.filter(r => r.url && isLive(r.role_family));
  if (!POSTINGS.length) return;

  $p("postings-section").hidden = false;
  initEmployers();
  initRoleProfiles();

  const uniq = k => [...new Set(POSTINGS.map(r => r[k]).filter(Boolean))];

  pFill($p("pfam"),
        uniq("role_family").sort((a, b) =>
          rlab(a).localeCompare(rlab(b))),
        "All roles", rlab);
  pFill($p("pctry"),
        uniq("country").sort(),
        "All countries", c => (CNAME && CNAME[c]) || c.toUpperCase());
  pFill($p("psen"),
        ["junior", "mid", "senior"].filter(s =>
          POSTINGS.some(r => r.seniority === s)),
        "All levels");

  /* ---- skill picker ---------------------------------------------
     Chips, not a dropdown: a multi-select box hides what is selected
     and nobody scrolls a 60-entry list. The top few by count are
     shown by default and the rest sit behind "Show all". Selected
     chips are always visible, even after collapsing, so the state of
     the filter is never off screen. Counts are totals over all live
     postings, not the current filtered set. */
  const SK_TOP = 18;
  let skOpen = false;
  const skCount = {};
  POSTINGS.forEach(r => rSkills(r).forEach(x =>
    skCount[x] = (skCount[x] || 0) + 1));
  const skAll = Object.keys(skCount).sort((a, b) =>
    skCount[b] - skCount[a] || a.localeCompare(b));

  function pSkillChips() {
    const box = $p("pskills");
    if (!box) return;
    if (!skAll.length) { box.hidden = true; return; }
    box.hidden = false;

    const list = skOpen ? skAll
      : skAll.filter((x, i) => i < SK_TOP || PSKILLS.has(x));
    $p("pskillchips").innerHTML = list.map(x =>
      `<button type="button" data-skill="${esc(x)}"
               aria-pressed="${PSKILLS.has(x)}">` +
      `${esc(x)}<span class="n">${skCount[x].toLocaleString()}</span>` +
      `</button>`).join("");

    const more = $p("pskillmore");
    more.hidden = skAll.length <= SK_TOP;
    more.textContent = skOpen ? "Show fewer"
                              : `Show all ${skAll.length} skills`;
    more.setAttribute("aria-expanded", String(skOpen));
    $p("pskillclear").hidden = !PSKILLS.size;
  }
  pSkillsRefresh = pSkillChips;

  $p("pskillchips").addEventListener("click", e => {
    const b = e.target.closest("button[data-skill]");
    if (!b) return;
    const x = b.dataset.skill;
    if (PSKILLS.has(x)) PSKILLS.delete(x); else PSKILLS.add(x);
    pSkillChips();
    ppage = 1;
    pRender();
  });
  $p("pskillmore").addEventListener("click", () => {
    skOpen = !skOpen;
    pSkillChips();
  });
  $p("pskillclear").addEventListener("click", () => {
    PSKILLS.clear();
    pSkillChips();
    ppage = 1;
    pRender();
  });
  pSkillChips();

  /* ---- city list ------------------------------------------------
     Rebuilt whenever the country changes, so picking Austria does not
     leave 200 German cities in the dropdown. Ordered by posting count
     rather than alphabetically: the cities anyone actually wants are
     the big ones, and the count is worth showing because the tail is
     mostly single postings.

     The selected city survives a country change if it still exists in
     the new list, so switching country with a city chosen does not
     silently widen the result set. */
  function pCities() {
    const ctry = $p("pctry").value;
    const n = {};
    POSTINGS.forEach(r => {
      if (ctry && r.country !== ctry) return;
      if (!r.city || r.city === "unknown") return;
      const k = `${r.country}|${r.city}`;
      n[k] = (n[k] || 0) + 1;
    });

    const keys = Object.keys(n).sort((a, b) =>
      n[b] - n[a] || a.localeCompare(b));

    const keep = $p("pcity").value;
    pFill($p("pcity"), keys, "All cities", k => {
      const [c, city] = k.split("|");
      return `${cityName(city)}${ctry ? "" : " " + c.toUpperCase()}` +
             ` (${n[k]})`;
    });
    if (keep && n[keep]) $p("pcity").value = keep;
  }
  pCitiesRefresh = pCities;
  pCities();

  ["pq", "pfam", "pctry", "pcity", "psen", "psort"].forEach(id =>
    $p(id).addEventListener(id === "pq" ? "input" : "change", () => {
      if (id === "pctry") pCities();
      /* any filter change makes the old page number meaningless:
         page 40 of a 3,600-row list is nowhere in a 12-row one */
      ppage = 1;
      pRender();
    }));

  $p("pclear").addEventListener("click", () => {
    ["pq", "pfam", "pctry", "pcity", "psen"]
      .forEach(id => $p(id).value = "");
    $p("psort").value = "new";
    PSKILLS.clear();
    pSkillChips();
    pCities();
    ppage = 1;
    pRender();
  });

  pRender();
});

/* ---------------- tools ---------------- */
get("skill_demand").then(d => {
  if (!d || !d.length) return;

  const byCat = {};
  d.forEach(r => {
    const c = r.skill_category || "other";
    byCat[c] = (byCat[c] || 0) + r.n_postings;
  });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  bar("skillcat", cats.map(c => wrap(scat(c[0]), 12)),
      [ds("Mentions", cats.map(c => c[1]),
          cats.map((_, i) => cyc(i)))],
      false, false, false,
      { x: "tool category", y: "postings mentioning the category" });


});

/* ---------------- trend ---------------- */
get("history").then(h => {
  if (!h) return;

  /* Snapshots before 2026-08-08 were written while the AI split and
     the staleness cap were still changing, so their numbers are not
     comparable. The tracker starts on the first clean day. */
  const MIN_DATE = "2026-08-08";
  h = h.filter(r => iso(r.snapshot_date) >= MIN_DATE);

  const rows = (m, dim) => h.filter(r => r.metric === m &&
                                         r.dimension === dim);
  const snaps = [...new Set(h.map(r => r.snapshot_date))].sort();
  if (snaps.length < 2) return;

  const tsec = document.getElementById("trend-section");
  if (!tsec) return;
  tsec.hidden = false;

  const RETIRED = new Set(["ai (other)", "ai / ml"]);
  const roles = [...new Set(h.filter(r => r.metric === "role_count"
                                       && !RETIRED.has(r.dimension))
      .map(r => r.dimension))]
      .sort((a, b) => {
        const v = f => (rows("role_count", f).slice(-1)[0] || {}).value || 0;
        return v(b) - v(a);
      });

  const ALL = "All roles";
  let current = ALL;
  let chart = null;
  let gran = "day";          /* "day" | "week" */

  /* One slot per calendar day, run or not. A day without a run stays
     an empty, shaded slot instead of the axis quietly skipping it, and
     nothing is interpolated across it. */
  const snapOf = {};
  snaps.forEach(s => snapOf[iso(s)] = s);
  const days = dayList(iso(snaps[0]), iso(snaps[snaps.length - 1]));

  /* Weekly view: Monday-to-Sunday buckets, averaged rather than
     summed, because these are levels (postings live on a day, days
     open), not daily increments. */
  const buckets = () => {
    if (gran === "day") return days.map(d => [d, snapOf[d] ? [snapOf[d]] : []]);
    const m = new Map();
    days.forEach(d => {
      const k = mondayOf(d);
      if (!m.has(k)) m.set(k, []);
      if (snapOf[d]) m.get(k).push(snapOf[d]);
    });
    return [...m.entries()];
  };

  const series = (m, dim, label, colour, axis) => {
    const at = new Map(rows(m, dim).map(r => [r.snapshot_date, r.value]));
    const data = buckets().map(([, ks]) => {
      const vs = ks.map(k => at.get(k)).filter(v => v != null);
      if (!vs.length) return null;
      const avg = vs.reduce((a, b) => a + b, 0) / vs.length;
      return Math.round(avg * 10) / 10;
    });
    return {
      label: gran === "week" ? label + " (weekly avg)" : label,
      data,
      borderColor: colour, backgroundColor: colour,
      tension: .3, borderWidth: 2, fill: false, yAxisID: axis,
      spanGaps: false,
      /* no markers on the daily line, except a lone day between gaps,
         which would otherwise be invisible */
      pointRadius: c => {
        if (gran === "week") return 3;
        const d = c.dataset.data, i = c.dataIndex;
        return d[i] != null && d[i - 1] == null && d[i + 1] == null ? 2.5 : 0;
      },
      pointHoverRadius: 4
    };
  };

  /* whole numbers only on both value axes - "47" not "47.0" */
  const intTicks = {
    precision: 0,
    callback: v => Number.isInteger(v) ? v.toLocaleString("en-US") : null
  };

  const showAge = () => document.getElementById("tshow-age").checked;
  const showVol = () => true;   /* volume is always on the chart */

  function draw() {
    if (chart) chart.destroy();

    /* Snapshots from 05_gold_aggregate write role_avg_age_days per
       family. Older snapshots predate it, so fall back to the
       market-wide average and say so in the label. */
    const hasRoleAge = current !== ALL &&
      rows("role_avg_age_days", current).length > 0;
    const ageLabel = current === ALL ? "avg days open"
      : hasRoleAge ? rlab(current) + " avg days open"
                   : "avg days open (all roles)";
    const volLabel = current === ALL
      ? "live postings" : rlab(current) + " postings";

    const datasets = [];
    if (showAge())
      datasets.push(hasRoleAge
        ? series("role_avg_age_days", current, ageLabel, CORAL, "y")
        : series("avg_age_days", "all", ageLabel, CORAL, "y"));
    if (showVol())
      datasets.push(current === ALL
        ? series("live_postings", "all", volLabel, STEEL, "y1")
        : series("role_count", current, volLabel, STEEL, "y1"));

    const bk = buckets();
    const keys = bk.map(b => b[0]);
    const bands = noRunBands(keys, (k, i) => !bk[i][1].length,
      (a, b) => [a, gran === "week" ? addDays(b, 6) : b]);

    chart = new Chart(document.getElementById("trend"), {
      type: "line",
      data: { labels: keys, datasets },
      plugins: [NO_RUN],
      options: {
        aspectRatio: window.innerWidth < 600 ? 1.5 : 2.7,
        layout: { padding: bandPad(bands) },
        interaction: { mode: "slot", intersect: false },
        plugins: {
          noRun: { bands },
          legend: { position: "bottom",
                    labels: { boxWidth: 12, boxHeight: 12, padding: 14,
                              font: { size: 13 } } },
          tooltip: {
            enabled: true, mode: "slot", intersect: false, position: "slot",
            titleFont: { size: 13 }, bodyFont: { size: 13 },
            callbacks: {
              title: it => it.length ? (gran === "week"
                ? "Week of " + fDay(keys[it[0].dataIndex])
                : fDayW(keys[it[0].dataIndex])) : "",
              label: c => c.parsed.y == null ? "" : `${c.dataset.label}: ` +
                Number(c.parsed.y).toLocaleString("en-US",
                  { maximumFractionDigits: 1 }),
              /* a day inside a shaded box has no snapshot: say so */
              afterBody: it => {
                if (!it.length || it.some(i => i.parsed.y != null)) return "";
                const k = keys[it[0].dataIndex];
                const o = outageIn(k, gran === "week" ? addDays(k, 6) : k);
                return (gran === "week" ? "No runs that week" : "No run that day") +
                  (o ? ` (${o.why})` : "");
              }
            }
          }
        },
        scales: {
          x:  { grid: { display: true, drawTicks: true,
                        color: c => gran === "week" ||
                          [1, 15].includes(+String(keys[c.index] || "").slice(8, 10))
                          ? LINE : "transparent" },
                /* daily: the 1st and 15th of each month; weekly: each
                   week by its Monday */
                ticks: { autoSkip: gran === "week", maxRotation: 0,
                         minRotation: 0,
                         callback: (v, i) => {
                           const k = keys[i];
                           if (gran === "week") return fDay(k);
                           const dd = +k.slice(8, 10);
                           return dd === 1 || dd === 15 ? fDay(k) : "";
                         } },
                title: { display: true,
                         text: gran === "week" ? "week (Monday to Sunday)"
                                               : "snapshot date" } },
          y:  { position: "left", grid: { display: showAge(), color: LINE },
                display: showAge(), ticks: intTicks,
                title: { display: true, text: "avg days open" } },
          y1: { position: "right",
                grid: { display: !showAge(), color: LINE },
                display: showVol(), ticks: intTicks,
                title: { display: true,
                         text: current === ALL ? "live postings"
                                               : "postings in role" } }
        }
      }
    });
  }

  const pickEl = document.getElementById("trendpick");
  if (pickEl) {
    pickEl.innerHTML = [ALL, ...roles].map(f =>
      `<button type="button" data-f="${f}"
         aria-pressed="${f === ALL}">` +
      `${f === ALL ? ALL : rlab(f)}</button>`).join("");
    pickEl.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      current = b.dataset.f;
      pickEl.querySelectorAll("button").forEach(x =>
        x.setAttribute("aria-pressed", x === b));
      draw();
    });
  }

  const ageEl = document.getElementById("tshow-age");
  if (ageEl) ageEl.addEventListener("change", draw);

  const granEl = document.getElementById("trendgran");
  if (granEl) granEl.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b || b.dataset.g === gran) return;
    gran = b.dataset.g;
    granEl.querySelectorAll("button").forEach(x =>
      x.setAttribute("aria-pressed", x === b));
    draw();
  });

  draw();
});


/* ===================================================== */
/* ===== NEW: script for the 7 additional charts ======== */
/* Self-contained IIFE. Reuses the helpers declared in    */
/* the main script above and declares nothing globally,   */
/* so it cannot collide with existing code.               */
/* ===================================================== */

(function () {
  const ROSE = "#B5657F", INDIGO = "#6B6E9B", OLIVE = "#8C9455";

  /* ---- 1, 2, 3: seniority views from role_breakdown ---- */
  get("role_breakdown").then(d => {
    if (!d || !d.length) return;

    /* per role: junior count and total */
    const byRole = {};
    d.forEach(r => {
      const k = r.role_family;
      byRole[k] = byRole[k] || { n: 0, jr: 0 };
      byRole[k].n += r.n_postings;
      if (r.seniority === "junior") byRole[k].jr += r.n_postings;
    });

    const jr = Object.entries(byRole)
      .map(([role, v]) => ({ role, jr: v.jr, n: v.n,
                             pct: +(100 * v.jr / v.n).toFixed(1) }));



    /* junior share of each role */
    const byShare = jr.slice().sort((a, b) => b.pct - a.pct);
    bar("n1_juniorvol",
        byShare.map(r => `${rlab(r.role)} (n=${r.n})`),
        [ds("% advertised as junior", byShare.map(r => r.pct),
            byShare.map(r => r.pct === 0 ? "#D8D3C7" : OLIVE))],
        true, false, false,
        { x: "% of that role's postings advertised as junior",
          y: "role (n = postings in that role)" });

    /* 3. seniority mix by country */
    if (d[0].country !== undefined) {
      const levels = ["junior", "mid", "senior"];
      const cols   = { junior: SAGE, mid: STEEL, senior: CORAL };
      const tot = {};
      d.forEach(r => tot[r.country] = (tot[r.country] || 0) + r.n_postings);
      const cs = CORDER.filter(c => tot[c]);
      const share = (c, lv) => {
        const n = d.filter(r => r.country === c && r.seniority === lv)
                   .reduce((s, r) => s + r.n_postings, 0);
        return +(100 * n / tot[c]).toFixed(1);
      };
      bar("n3_senctry", cs.map(c => CNAME[c] || c),
          levels.map(lv => ds(lv, cs.map(c => share(c, lv)), cols[lv])),
          true, true, true,
          { x: "% of that country's live postings", y: "country" });
    }
  });






})();




(function () {
  const IND = "#6B6E9B", ROSE = "#B5657F";





  /* ---- fragmentation and salary disclosure ---- */
  get("country_breakdown").then(d => {
    if (!d || !d.length) return;
    const byC = {};
    d.forEach(r => byC[r.country] = r);
    const rows = CORDER.filter(c => byC[c]).map(c => byC[c]);
    if (!rows.length) return;

    bar("n10_fragment", rows.map(r => CNAME[r.country] || r.country),
        [ds("postings per employer",
            rows.map(r => r.employers
              ? +(r.n_postings / r.employers).toFixed(2) : 0),
            rows.map(r => CCOL[r.country] || CORAL))],
        false, false, false,
        { x: "country", y: "live postings per employer" });

    bar("n11_salary", rows.map(r => CNAME[r.country] || r.country),
        [ds("% stating a salary",
            rows.map(r => r.pct_with_salary ?? 0),
            rows.map(r => CCOL[r.country] || CORAL))],
        false, false, false,
        { x: "country", y: "% of live postings stating a salary" });
  });

  /* ---- this pipeline's own error rates ---- */
  get("meta").then(m => {
    if (!m) return;
    const el = document.getElementById("n14_quality");
    if (!el) return;

    const cards = [
      ["Records rejected",
       m.quarantine_rate != null
         ? (100 * m.quarantine_rate).toFixed(1) + "%"
         : (m.quarantined != null ? m.quarantined : "-")],
      ["Descriptions truncated",
       m.desc_truncated_pct != null
         ? m.desc_truncated_pct + "%" : "-"],
      /* Not per-run. One-off manual spot check on a hand-labelled
         sample; the pipeline does not recompute these. Hardcoded on
         purpose so they are never mistaken for a live metric. */
      ["Matcher precision (spot check)",
       m.matcher_precision ?? "0.93"],
      ["Matcher recall (spot check)",
       m.matcher_recall ?? "0.89"],
    ];

    el.innerHTML = cards.map(([k, v]) =>
      `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("");
  });
})();



/* ===================================================== */
/* ===== Interactive: skills by role, tool scatter, ==== */
/* ===== city head-to-head.                        ==== */
/* Reuses helpers from the main script. Declares nothing */
/* globally. Every block degrades to hidden or no-op if  */
/* its JSON is absent, so the page never half-renders.   */
/* ===================================================== */


/* ---------------- 1 + 2. tools by role ----------------
   Needs gold.skill_by_role. The section stays hidden until the
   pipeline publishes it, rather than showing empty axes.      */
(function () {
  const sec  = document.getElementById("skillrole-section");
  const pick = document.getElementById("srpick");
  const grid = document.getElementById("srgrid");
  const diffwrap = document.getElementById("srdiffwrap");
  const titleA = document.getElementById("srtitleA");
  if (!sec || !pick) return;

  const NBARS = 15;
  let chartA = null, chartB = null;

  const opts = (fmtLabel, fmtTip) => ({
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: fmtTip } }
    },
    scales: {
      x: { grid: { color: LINE }, title: { display: true, text: fmtLabel } },
      y: { grid: { display: false },
           title: { display: true, text: "tool" } }
    }
  });

  Promise.all([get("skill_by_role"), get("skill_demand")])
    .then(([sr, sd]) => {
      const hasRoles = sr && sr.length && sr[0].role_family !== undefined;
      if (!hasRoles && (!sd || !sd.length)) return;

      /* market-wide rate per skill, for the difference chart */
      const base = {};
      (sd || []).forEach(r => base[r.skill] = r.pct_postings);

      /* live() because this picker is built from whatever families
         skill_by_role.json contains, and that file lagged the split
         for weeks: it kept offering an "AI/ML (pre-split)" button long
         after the family stopped existing. Filtering here means a
         stale export degrades to fewer buttons rather than to a wrong
         one. */
      const byRole = {};
      (hasRoles ? live(sr) : []).forEach(r => {
        (byRole[r.role_family] = byRole[r.role_family] || []).push(r);
      });

      const size = rf => ((byRole[rf] || [])[0] || {}).role_postings || 0;
      /* a role with three or fewer extracted skills draws a chart
         that is mostly empty axes, so it is not offered */
      const roles = Object.keys(byRole)
        .filter(rf => byRole[rf].length > 3)
        .sort((a, b) => size(b) - size(a));

      const ALL = "All roles";
      let current = ALL;
      sec.hidden = false;

      /* ---- All roles: one full-width market-wide chart ---- */
      function drawAll() {
        grid.classList.add("single");
        if (diffwrap) diffwrap.hidden = true;
        if (chartB) { chartB.destroy(); chartB = null; }
        if (titleA) titleA.textContent =
          "Share of all postings mentioning it";

        const top = (sd || []).filter(r => r.skill !== "sap")
          .slice(0, NBARS);
        if (!top.length) return;

        if (chartA) chartA.destroy();
        chartA = new Chart(document.getElementById("skillrole"), {
          type: "bar",
          data: {
            labels: top.map(r => slab(r.skill)),
            datasets: [{
              data: top.map(r => r.pct_postings),
              backgroundColor: top.map((_, i) => cyc(i)),
              borderRadius: 3, barPercentage: .82,
              n: top.map(r => r.n_postings)
            }]
          },
          options: opts("% of all postings mentioning it",
            c => `${c.label}: ${c.raw}%` +
                 (c.dataset.n[c.dataIndex] != null
                   ? ` (${c.dataset.n[c.dataIndex].toLocaleString()} postings)`
                   : ""))
        });
      }

      function draw() {
        if (current === ALL) return drawAll();

        grid.classList.remove("single");
        if (diffwrap) diffwrap.hidden = false;

        const rows = byRole[current] || [];
        const n = size(current);
        if (titleA) titleA.textContent =
          "Share of this role's postings mentioning it";

        /* --- left: top tools inside this role --- */
        const top = rows.slice()
          .sort((a, b) => b.pct_role_postings - a.pct_role_postings)
          .slice(0, NBARS);

        if (chartA) chartA.destroy();
        chartA = new Chart(document.getElementById("skillrole"), {
          type: "bar",
          data: {
            labels: top.map(r => slab(r.skill)),
            datasets: [{
              data: top.map(r => r.pct_role_postings),
              backgroundColor: top.map((_, i) => cyc(i)),
              borderRadius: 3, barPercentage: .82,
              n: top.map(r => r.n_postings)
            }]
          },
          options: opts(
            `% of the ${n.toLocaleString()} ${rlab(current)} postings`,
            c => `${c.label}: ${c.raw}% ` +
                 `(${c.dataset.n[c.dataIndex]} of ${n} postings)`)
        });

        /* --- right: over- and under-indexed against the market --- */
        const diffs = rows
          .map(r => ({ skill: r.skill,
                       d: +(r.pct_role_postings -
                            (base[r.skill] ?? 0)).toFixed(1),
                       pct: r.pct_role_postings,
                       mkt: base[r.skill] ?? 0 }))
          .sort((a, b) => b.d - a.d);

        const over  = diffs.filter(x => x.d > 0).slice(0, 8);
        const under = diffs.filter(x => x.d < 0).slice(-7);
        const both  = over.concat(under);

        if (chartB) chartB.destroy();
        if (!both.length) return;

        chartB = new Chart(document.getElementById("skillrolediff"), {
          type: "bar",
          data: {
            labels: both.map(r => slab(r.skill)),
            datasets: [{
              data: both.map(r => r.d),
              backgroundColor: both.map(r => r.d >= 0 ? CORAL : STEEL),
              borderRadius: 3, barPercentage: .82,
              meta: both
            }]
          },
          options: opts("percentage points vs the whole market",
            c => {
              const m = c.dataset.meta[c.dataIndex];
              return `${slab(m.skill)}: ${m.pct}% in ${rlab(current)} ` +
                     `vs ${m.mkt}% market-wide ` +
                     `(${m.d > 0 ? "+" : ""}${m.d} pp)`;
            })
        });
      }

      const names = [ALL].concat(roles);
      pick.innerHTML = names.map(n =>
        `<button type="button" data-role="${n}"
                 title="${n === ALL ? "every posting"
                          : size(n).toLocaleString() + " postings"}"
                 aria-pressed="${n === current}">` +
        `${n === ALL ? ALL : rlab(n)}</button>`).join("");

      pick.querySelectorAll("button").forEach(b => {
        b.addEventListener("click", () => {
          current = b.dataset.role;
          pick.querySelectorAll("button").forEach(x =>
            x.setAttribute("aria-pressed", x.dataset.role === current));
          draw();
        });
      });

      draw();
    });
})();


/* ---------------- 3. tool popularity vs staleness ----------------
   One Chart.js dataset per category, which gives click-to-filter
   through the standard legend for free.                          */
(function () {
  const el = document.getElementById("skillscatter");
  if (!el) return;

  /* the shared CATS palette only holds 10, and there are ~15 tool
     categories, so colours would repeat and become unreadable */
  const PAL = ["#D97757", "#6E8CA0", "#7C9885", "#D9A05B", "#9B7B9B",
               "#5F9EA0", "#CC785C", "#C7A87C", "#6E9384", "#A8462A",
               "#B5657F", "#6B6E9B", "#8C9455", "#4F7A8C", "#8A857C"];

  get("skill_demand").then(d => {
    if (!d || !d.length) return;

    const byCat = {};
    d.forEach(r => {
      const c = r.skill_category || "other";
      (byCat[c] = byCat[c] || []).push(r);
    });

    const cats = Object.keys(byCat).sort();
    const max  = Math.max(...d.map(r => r.n_postings)) || 1;

    new Chart(el, {
      type: "bubble",
      data: {
        datasets: cats.map((c, i) => ({
          label: scat(c),
          data: byCat[c].map(r => ({
            x: r.pct_postings,
            y: r.avg_age_days,
            r: 4 + 15 * Math.sqrt(r.n_postings / max),
            name: r.skill,
            n: r.n_postings
          })),
          backgroundColor: PAL[i % PAL.length] + "C0",
          borderColor: "#FAF9F5",
          borderWidth: 1
        }))
      },
      options: {
        plugins: {
          legend: { position: "bottom",
                    labels: { boxWidth: 10, font: { size: 11 },
                              usePointStyle: true } },
          tooltip: { callbacks: { label: c =>
            `${c.raw.name}: ${c.raw.x}% of postings · ` +
            `avg ${Math.round(c.raw.y)} days open · ` +
            `${c.raw.n.toLocaleString()} postings` } }
        },
        scales: {
          x: { title: { display: true,
                        text: "% of postings mentioning the tool" },
               grid: { color: LINE }, beginAtZero: true },
          y: { title: { display: true, text: "average days open" },
               grid: { color: LINE } }
        }
      }
    });
  });
})();


/* ---------------- 4. city head to head ----------------
   Radar axes are each scaled against the maximum across all
   qualifying cities, so the shapes are comparable. Raw values
   live in the tooltip and the table, never on the axis.

   A role can be selected. "All roles" reads city_breakdown.
   A single role reads city_role_breakdown, which is a narrower
   table: it always carries n_postings and avg_age_days, and it
   carries pct_english / pct_agency only once the gold layer has
   been rerun with those two columns added. The axis list is
   therefore built from the columns actually present, so the page
   degrades to three axes instead of drawing empty ones.

   Both dropdowns are grouped by country in CORDER, and ordered
   by live listings descending inside each country group.        */
(function () {
  const el   = document.getElementById("citycmp");
  const selA = document.getElementById("cmpA");
  const selB = document.getElementById("cmpB");
  const selR = document.getElementById("cmpRole");
  const tbl  = document.getElementById("cmptable");
  if (!el || !selA || !selB) return;

  /* a city needs at least this many live postings to be offered */
  const MIN_N = 3;

  /* country first, then volume descending inside the country */
  const cidx = c => {
    const i = CORDER.indexOf(c);
    return i < 0 ? 99 : i;
  };
  const byCountryThenSize = (a, b) =>
    cidx(a.country) - cidx(b.country) || b.listings - a.listings;

  let chart = null;

  Promise.all([get("city_breakdown"), get("city_role_breakdown")])
    .then(([cb, cr]) => {
      if (!cb || !cb.length) return;

      const hasRoles =
        !!(cr && cr.length && cr[0].role_family !== undefined && selR);

      /* ---- totals and AI share per city, from the role cut ----
         AI is six families, so this sums the set rather than testing
         one string. AI_SET is defined once at the top. Retired
         families are stripped first, so an old data/ snapshot cannot
         quietly inflate a city's AI share with rows the rest of the
         page no longer counts.

         One axis, not two. There used to be a second "role named"
         share because the vague bucket was published alongside the
         named ones; now nothing vague is published and the two
         numbers would be identical.                              */
      const crLive = (cr && cr.length) ? live(cr) : [];
      const cityTotal = {}, aiShare = {};
      if (crLive.length && crLive[0].role_family !== undefined) {
        const ai = {};
        crLive.forEach(r => {
          const k = `${r.country}|${r.city}`;
          const rf = String(r.role_family).toLowerCase();
          cityTotal[k] = (cityTotal[k] || 0) + r.n_postings;
          if (AI_SET.has(rf)) ai[k] = (ai[k] || 0) + r.n_postings;
        });
        Object.keys(cityTotal).forEach(k => {
          aiShare[k] = +(100 * (ai[k] || 0) / cityTotal[k]).toFixed(1);
        });
      }

      /* does the role cut carry the language / agency columns? */
      const roleHasPct = !!(cr && cr.length &&
                            cr[0].pct_english !== undefined &&
                            cr[0].pct_agency  !== undefined);

      /* ---- city list for "All roles" ---- */
      const allCities = cb
        .filter(r => r.city && r.city !== "unknown" && r.n_postings >= MIN_N)
        .map(r => ({
          key: `${r.country}|${r.city}`,
          label: cityName(r.city),
          country: r.country,
          n: r.n_postings,
          listings: r.n_postings,
          age: r.avg_age_days,
          english: r.pct_english,
          agency: r.pct_agency,
          ai:     aiShare[`${r.country}|${r.city}`]     ?? 0
        }))
        .sort(byCountryThenSize);

      if (allCities.length < 2) return;

      /* the set of cities that clear MIN_N overall, so a role view
         never offers a city the all-roles view would have hidden */
      const eligible = new Set(allCities.map(c => c.key));

      /* ---- city list per role ---- */
      const roleCities = {};
      if (hasRoles) {
        crLive.forEach(r => {
          if (!r.city || r.city === "unknown") return;
          const key = `${r.country}|${r.city}`;
          if (!eligible.has(key)) return;
          const tot = cityTotal[key] || 0;
          (roleCities[r.role_family] = roleCities[r.role_family] || [])
            .push({
              key,
              label: cityName(r.city),
              country: r.country,
              n: r.n_postings,
              listings: r.n_postings,
              age: r.avg_age_days,
              english: r.pct_english,
              agency: r.pct_agency,
              share: tot ? +(100 * r.n_postings / tot).toFixed(1) : 0
            });
        });
        Object.values(roleCities).forEach(l => l.sort(byCountryThenSize));
      }

      /* ---- axis definitions ---- */
      const AX_ALL = [
        ["Live listings",   "listings", v => v.toLocaleString()],
        ["Avg days open",   "age",      v => Math.round(v) + " d"],
        ["% in English",    "english",  v => v + "%"],
        ["% via agency",    "agency",   v => v + "%"],
        ["% AI roles",      "ai",       v => v + "%"]
      ];
      const AX_ROLE = [
        ["Live listings", "listings", v => v.toLocaleString()],
        ["Avg days open", "age",      v => Math.round(v) + " d"]
      ].concat(roleHasPct ? [
        ["% in English",  "english",  v => v + "%"],
        ["% via agency",  "agency",   v => v + "%"]
      ] : []).concat([
        ["% of city's postings", "share", v => v + "%"]
      ]);

      /* ---- role dropdown ---- */
      if (hasRoles) {
        const roles = Object.keys(roleCities)
          .filter(rf => roleCities[rf].length >= 2)
          .sort((a, b) =>
            roleCities[b].reduce((s, r) => s + r.listings, 0) -
            roleCities[a].reduce((s, r) => s + r.listings, 0));
        selR.innerHTML =
          `<option value="__all">All roles</option>` +
          roles.map(rf => `<option value="${rf}">${rlab(rf)}</option>`)
               .join("");
      } else if (selR) {
        selR.innerHTML = `<option value="__all">All roles</option>`;
        selR.disabled = true;
      }

      /* current working set, refreshed whenever the role changes */
      let cities = allCities, AX = AX_ALL, maxes = {};

      function rescale() {
        const rf = selR ? selR.value : "__all";
        if (rf === "__all" || !roleCities[rf]) {
          cities = allCities;
          AX = AX_ALL;
        } else {
          cities = roleCities[rf];
          AX = AX_ROLE;
        }
        maxes = {};
        AX.forEach(([, f]) =>
          maxes[f] = Math.max(...cities.map(c => +c[f] || 0)) || 1);
      }

      /* one <optgroup> per country, in CORDER, options already in
         volume order because the array itself is sorted that way */
      function optionMarkup(q) {
        const needle = (q || "").trim().toLowerCase();
        let html = "", open = null;
        cities.forEach((c, i) => {
          if (needle && !c.label.toLowerCase().includes(needle)) return;
          if (c.country !== open) {
            if (open !== null) html += `</optgroup>`;
            open = c.country;
            html += `<optgroup label="${CNAME[c.country] ||
                     String(c.country).toUpperCase()}">`;
          }
          html += `<option value="${i}">${c.label} ` +
                  `(${String(c.country).toUpperCase()}) &middot; ` +
                  `${c.n}</option>`;
        });
        if (open !== null) html += `</optgroup>`;
        return html;
      }

      /* free-text filters, one per dropdown. A search that matches
         nothing keeps the full list rather than emptying the picker,
         and flags the box instead.                                 */
      const qA = document.getElementById("cmpAq");
      const qB = document.getElementById("cmpBq");

      function fillOne(sel, box, keep, fallbackIdx) {
        const q = box ? box.value : "";
        let markup = optionMarkup(q);
        if (!markup) {
          markup = optionMarkup("");
          if (box) box.classList.add("nohit");
        } else if (box) {
          box.classList.remove("nohit");
        }
        sel.innerHTML = markup;
        const has = v => !!sel.querySelector(`option[value="${v}"]`);
        const ik = cities.findIndex(c => c.key === keep);
        if (ik >= 0 && has(ik)) sel.value = ik;
        else if (fallbackIdx != null && has(fallbackIdx))
          sel.value = fallbackIdx;
        else sel.selectedIndex = 0;
      }

      function fillCities(keepA, keepB) {
        fillOne(selA, qA, keepA, 0);
        fillOne(selB, qB, keepB, null);
        if (+selB.value === +selA.value) {
          const alt = [...selB.options]
            .find(o => +o.value !== +selA.value);
          if (alt) selB.value = alt.value;
        }
      }

      function series(c, colour) {
        return {
          label: `${c.label} (${String(c.country).toUpperCase()})`,
          data: AX.map(([, f]) =>
            +(100 * (+c[f] || 0) / maxes[f]).toFixed(1)),
          raws: AX.map(([, f, fmt]) => fmt(+c[f] || 0)),
          borderColor: colour,
          backgroundColor: colour + "33",
          pointBackgroundColor: colour,
          pointRadius: 3.5,
          borderWidth: 2
        };
      }

      function draw() {
        const a = cities[+selA.value], b = cities[+selB.value];
        if (!a || !b) return;

        const sa = series(a, CORAL), sb = series(b, STEEL);

        if (chart) chart.destroy();
        chart = new Chart(el, {
          type: "radar",
          data: { labels: AX.map(x => x[0]), datasets: [sa, sb] },
          options: {
            plugins: {
              legend: { position: "bottom",
                        labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: { callbacks: { label: c =>
                `${c.dataset.label}: ${c.dataset.raws[c.dataIndex]}` } }
            },
            scales: {
              r: { min: 0, max: 100,
                   ticks: { display: false, stepSize: 25 },
                   grid: { color: LINE },
                   angleLines: { color: LINE },
                   pointLabels: { font: { size: 11.5 }, color: SLATE } }
            }
          }
        });

        if (tbl) {
          const rf = selR ? selR.value : "__all";
          tbl.innerHTML =
            `<tr><td>${rf === "__all" ? "All roles" : rlab(rf)}</td>
               <td class="num" style="color:${CORAL}">${sa.label}</td>
               <td class="num" style="color:${STEEL}">${sb.label}</td></tr>` +
            AX.map(([name, f, fmt]) =>
              `<tr><td>${name}</td>
                 <td class="num">${fmt(+a[f] || 0)}</td>
                 <td class="num">${fmt(+b[f] || 0)}</td></tr>`).join("") +
            (rf !== "__all" && !roleHasPct
              ? `<tr><td colspan="3" style="color:#8A857C;font-weight:400">
                   Language and agency splits are not published per city
                   and role yet, so those axes are hidden in the role
                   view.</td></tr>`
              : "");
        }
      }

      function refresh() {
        const keepA = (cities[+selA.value] || {}).key;
        const keepB = (cities[+selB.value] || {}).key;
        rescale();
        fillCities(keepA, keepB);
        draw();
      }

      selA.addEventListener("change", draw);
      selB.addEventListener("change", draw);
      if (selR) selR.addEventListener("change", refresh);

      [[qA, selA], [qB, selB]].forEach(([box, sel]) => {
        if (!box) return;
        box.addEventListener("input", () => {
          const keep = (cities[+sel.value] || {}).key;
          fillOne(sel, box, keep, 0);
          draw();
        });
      });

      rescale();
      fillCities(null, null);
      draw();
    });
})();


/* ---------------- foldable limitations ----------------
   The caveats block ships collapsed. Anything that points at it,
   the nav link or a deep link, has to open it first, otherwise the
   jump lands on a closed panel and looks broken.               */
(function () {
  const btn  = document.getElementById("limbtn");
  const body = document.getElementById("limbody");
  if (!btn || !body) return;

  function setOpen(on) {
    body.hidden = !on;
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    const txt = btn.querySelector(".txt");
    if (txt) txt.textContent = on ? "Hide" : "Show";
  }

  btn.addEventListener("click", () =>
    setOpen(btn.getAttribute("aria-expanded") !== "true"));

  document.querySelectorAll('a[href="#limitations"]')
          .forEach(a => a.addEventListener("click", () => setOpen(true)));
  window.addEventListener("hashchange", () => {
    if (location.hash === "#limitations") setOpen(true);
  });
  if (location.hash === "#limitations") setOpen(true);
})();


/* ===================================================== */
/* ===== New postings per day (below the trend) ======== */
/* Reads new_postings_daily.json from the gold registry, */
/* keyed on created_date: the day Adzuna lists the       */
/* advert. The registry started on 27 Aug 2026, so the   */
/* chart starts there; before it, only adverts still     */
/* online on that first run could be counted, which     */
/* would read as a ramp that never happened.             */
/* Days without a pipeline run are shaded: adverts       */
/* listed then are counted, but only if still online at  */
/* the next run, so those bars are lower bounds.         */
/* ===================================================== */

(function () {
  const NP_START = "2026-08-27";
  /* every Monday-to-Sunday week gets its own colour, rotating, keyed
     on the week itself so a week keeps its colour in every timeframe */
  const WEEK_PAL = [STEEL, AMBER, SAGE, PLUM, TEAL, CLAY, INDIGO, OLIVE];
  const weekCol = d => WEEK_PAL[weekNo(d) % WEEK_PAL.length];
  const INK = "#2E2A24";

  Promise.all([get("new_postings_daily"), RUNS]).then(([nd, runs]) => {

    /* older exports called the column "day" */
    let rows = (nd || [])
      .map(r => ({ ...r, day: iso(r.created_date || r.day) }));
    rows = rows.filter(r => isLive(r.role_family) &&
                            r.role_family !== "other" &&
                            /^\d{4}-\d{2}-\d{2}$/.test(r.day) &&
                            r.day >= NP_START);
    if (!rows.length) return;

    const sec = document.getElementById("newposts-section");
    const pickEl = document.getElementById("nppick");
    if (!sec || !pickEl) return;
    sec.hidden = false;

    const dayKeys = [...new Set(rows.map(r => r.day))].sort();
    const minDay = dayKeys[0];
    const maxDay = dayKeys[dayKeys.length - 1];
    /* how many calendar days the tracker has actually covered */
    const tracked = Math.round(
      (Date.parse(maxDay) - Date.parse(minDay)) / 864e5) + 1;

    /* lower bounds: no run that day, or the newest day, which is still
       running when the morning job reads it */
    const noRun = d => runs ? !runs.ran(d) : false;
    const lbOf = d => d === maxDay ? "partial" : noRun(d) ? "norun" : "";
    const LB_TEXT = {
      norun: "Lower bound: no pipeline run that day, so only adverts " +
             "still online at the next run were counted.",
      partial: "Partial day: the run happens in the morning."
    };

    /* zero-filled day axis ending on the newest day, never reaching
       back past the first tracked day - a 60-day window in week one
       would otherwise be 55 zero bars pretending to be no hiring */
    const mkDays = span => {
      const days = [];
      const end = new Date(maxDay + "T00:00:00Z");
      for (let i = Math.min(span, tracked) - 1; i >= 0; i--) {
        const d = new Date(end);
        d.setUTCDate(d.getUTCDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      return days;
    };

    const roleTot = {};
    rows.forEach(r =>
      roleTot[r.role_family] = (roleTot[r.role_family] || 0) + r.n);
    const roles = Object.keys(roleTot)
      .sort((a, b) => roleTot[b] - roleTot[a]);

    const SORDER = ["junior", "mid", "senior"];
    const sens = [...new Set(rows.map(r => r.seniority))].filter(Boolean);
    const senList = SORDER.filter(s => sens.includes(s))
      .concat(sens.filter(s => !SORDER.includes(s)).sort());

    const cs = CORDER.filter(c => rows.some(r => r.country === c));

    const RANGES = [["7", "1 week"], ["30", "1 month"],
                    ["60", "2 months"], ["90", "3 months"],
                    ["365", "All"]];

    const ALL = "All roles";
    let selRoles = [];   /* empty = all roles; up to 3 to compare */
    let country = "all";
    let sen = "all";
    let span = 60;
    let chart = null;

    const filt = r => (country === "all" || r.country === country) &&
                      (sen === "all" || r.seniority === sen);

    const daily = (role, days) => {
      const m = Object.fromEntries(days.map(d => [d, 0]));
      rows.forEach(r => {
        if (filt(r) && (role == null || r.role_family === role) &&
            m[r.day] != null) m[r.day] += r.n;
      });
      return days.map(d => m[d]);
    };

    /* trailing 7-day mean; first six days have no full window */
    const roll7 = a => a.map((_, i) => i < 6 ? null :
      +(a.slice(i - 6, i + 1).reduce((x, y) => x + y, 0) / 7)
        .toFixed(1));

    const fmtDay = d => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

    function chips(combined, days) {
      const el = document.getElementById("npstats");
      if (!el) return;
      const sum = a => a.reduce((x, y) => x + y, 0);
      const wk = sum(combined.slice(-7));
      const prev = combined.length >= 14
        ? sum(combined.slice(-14, -7)) : 0;
      const delta = prev ? Math.round(100 * (wk - prev) / prev) : null;
      const cls = delta == null ? "" : delta >= 0 ? " up" : " down";
      /* week-over-week needs two full tracked weeks behind it,
         otherwise it compares a real week against a partial one */
      const wow = delta != null
        ? `<b>${(delta >= 0 ? "+" : "") + delta}%</b>` +
          `<span>vs the 7 days before</span>`
        : tracked < 14
          ? `<b>–</b><span>week over week needs 14 tracked days` +
            ` (${tracked} so far)</span>`
          : `<b>–</b><span>week over week needs a longer` +
            ` timeframe</span>`;
      el.innerHTML =
        `<div class="npkpi"><b>${wk.toLocaleString("en-US")}</b>` +
        `<span>new in the last ${Math.min(7, tracked)} days</span></div>` +
        `<div class="npkpi${cls}">${wow}</div>` +
        `<div class="npkpi"><b>${sum(combined)
            .toLocaleString("en-US")}</b>` +
        `<span>total in this view</span></div>`;
    }

    /* the key under the chart: week colours for a single series,
       Chart.js' own legend when roles are compared */
    function legend(single, showAvg, days) {
      const el = document.getElementById("nplegend");
      if (!el) return;
      if (!single) { el.innerHTML = ""; el.hidden = true; return; }
      const wk = [...new Set(days.map(weekNo))].slice(-5);
      el.hidden = false;
      el.innerHTML =
        `<li><span class="wkchips">${wk.map(w =>
          `<i style="background:${WEEK_PAL[w % WEEK_PAL.length]}"></i>`)
          .join("")}</span>One colour per week, Monday to Sunday</li>` +
        `<li><span class="sw lb"></span>Lighter: lower bound</li>` +
        (showAvg ? `<li><span class="ln"></span>7-day average</li>` : "") +
        (days.some(noRun)
          ? `<li><span class="sw band"></span>No pipeline run</li>` : "");
    }

    function draw() {
      if (chart) chart.destroy();
      const days = mkDays(span);
      const picks = selRoles.length ? selRoles : [null];
      const single = picks.length === 1;
      const showAvg = document.getElementById("npavg").checked;
      const datasets = [];
      const combined = days.map(() => 0);

      picks.forEach((role, i) => {
        const vals = daily(role, days);
        vals.forEach((v, j) => combined[j] += v);
        const col = role == null ? STEEL : rcol(role, i);
        const name = role == null ? ALL : rlab(role);
        datasets.push(single ? {
          type: "bar", label: name, data: vals, order: 2,
          backgroundColor: days.map(d =>
            weekCol(d) + (lbOf(d) ? "59" : "E6")),
          borderRadius: 2, barPercentage: .92, categoryPercentage: .92
        } : {
          type: "bar", label: name, data: vals, order: 2,
          backgroundColor: col + "66", borderColor: col, borderWidth: 1
        });
        if (showAvg && days.length > 7)
          datasets.push({
            type: "line", label: single ? "7-day average"
                                        : name + " (7-day avg)",
            data: roll7(vals), borderColor: single ? INK : col,
            backgroundColor: single ? INK : col,
            tension: .3, pointRadius: 0, borderWidth: 2,
            fill: false, order: 1, spanGaps: true
          });
      });

      const bands = noRunBands(days, noRun, (a, b) => [a, b]);

      chart = new Chart(document.getElementById("npchart"), {
        data: { labels: days.map(fmtDay), datasets },
        plugins: [NO_RUN],
        options: {
          aspectRatio: window.innerWidth < 600 ? 1.5 : 2.7,
          layout: { padding: bandPad(bands) },
          interaction: { mode: "slot", intersect: false },
          plugins: {
            noRun: { bands },
            legend: { display: !single, position: "bottom",
                      labels: { boxWidth: 12, boxHeight: 12,
                                padding: 14, font: { size: 13 } } },
            tooltip: { mode: "slot", intersect: false, position: "slot",
                       titleFont: { size: 13 }, bodyFont: { size: 13 },
                       footerFont: { size: 12, weight: "normal" },
                       callbacks: {
                         /* no line for a day the average has no value */
                         label: c => c.parsed.y == null ? "" :
                           `${c.dataset.label}: ` +
                           Number(c.parsed.y).toLocaleString("en-US",
                             { maximumFractionDigits: 1 }),
                         title: it => {
                           if (!it.length) return "";
                           const d = days[it[0].dataIndex];
                           return `${fDayW(d)} · week ${isoWeek(d)}` +
                             (noRun(d) ? " · no run" : "");
                         },
                         footer: it => {
                           if (!it.length) return "";
                           const t = LB_TEXT[lbOf(days[it[0].dataIndex])];
                           return t ? wrap(t, 46) : "";
                         }
                       } }
          },
          scales: {
            /* a tick and a faint rule at every Monday, so the weeks
               read as blocks */
            x: { grid: { display: true, offset: true, drawTicks: false,
                         color: c => isMonday(days[c.index])
                           ? "#E3D9CA" : "transparent" },
                 ticks: { autoSkip: false, maxRotation: 0,
                          callback: (v, i) =>
                            isMonday(days[i]) ? fmtDay(days[i]) : "" },
                 title: { display: true,
                          text: "day Adzuna lists the advert · ticks mark Mondays" } },
            y: { beginAtZero: true, grid: { color: LINE },
                 ticks: { precision: 0 },
                 title: { display: true, text: "new postings" } }
          }
        }
      });
      chips(combined, days);
      legend(single, showAvg && days.length > 7, days);
    }

    /* role pills - multi-select, "All roles" clears */
    pickEl.innerHTML = [ALL, ...roles].map(f =>
      `<button type="button" data-f="${f}"
         aria-pressed="${f === ALL}">` +
      `${f === ALL ? ALL : rlab(f)}</button>`).join("");
    pickEl.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      const f = b.dataset.f;
      if (f === ALL) selRoles = [];
      else {
        const i = selRoles.indexOf(f);
        if (i >= 0) selRoles.splice(i, 1);
        else {
          selRoles.push(f);
          if (selRoles.length > 3) selRoles.shift();
        }
      }
      pickEl.querySelectorAll("button").forEach(x =>
        x.setAttribute("aria-pressed",
          x.dataset.f === ALL ? String(!selRoles.length)
                              : String(selRoles.includes(x.dataset.f))));
      draw();
    });

    /* single-select pill rows */
    const simpleRow = (id, items, set, init) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = items.map(v =>
        `<button type="button" data-f="${v[0]}"
           aria-pressed="${v[0] === init}">${v[1]}</button>`).join("");
      el.addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b) return;
        set(b.dataset.f);
        el.querySelectorAll("button").forEach(x =>
          x.setAttribute("aria-pressed", String(x === b)));
        draw();
      });
    };
    simpleRow("npcountry",
      [["all", "All"], ...cs.map(c => [c, String(c).toUpperCase()])],
      v => country = v, "all");
    simpleRow("npsen",
      [["all", "All"], ...senList.map(s => [s, cap(s)])],
      v => sen = v, "all");
    simpleRow("nprange", RANGES, v => span = +v, "60");

    const avgEl = document.getElementById("npavg");
    if (avgEl) avgEl.addEventListener("change", draw);

    draw();
  });
})();


/* ===================================================== */
/* ===== Small charts shared by the role profiles, ===== */
/* ===== the AI vocabulary and the run calendar    ===== */
/* ===================================================== */

/* the dark map tooltip, reused */
const TIP = (() => {
  const box = () => document.getElementById("maptip");
  const zoom = () => {
    const z = parseFloat(getComputedStyle(document.documentElement).zoom);
    return z > 0 && isFinite(z) ? z : 1;
  };
  function move(e) {
    const t = box();
    if (!t) return;
    const z = zoom(), pad = 14;
    const cx = e.clientX / z, cy = e.clientY / z;
    let x = cx + pad, y = cy + pad;
    if (x + t.offsetWidth > innerWidth / z - 8) x = cx - t.offsetWidth - pad;
    if (y + t.offsetHeight > innerHeight / z - 8) y = cy - t.offsetHeight - pad;
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  const hide = () => { const t = box(); if (t) t.style.opacity = 0; };
  function bind(node, html) {
    node.addEventListener("mouseenter", e => {
      const t = box();
      if (!t) return;
      t.innerHTML = html();
      t.style.opacity = 1;
      move(e);
    });
    node.addEventListener("mousemove", move);
    node.addEventListener("mouseleave", hide);
  }
  addEventListener("scroll", hide, { passive: true });
  return { bind, hide };
})();

/* Horizontal bars as plain HTML: label, bar, optional comparison tick
   (the whole market) and the value at the bar's tip.
   rows: [{ label, sub, v, m, color, val, tip, go }]                 */
function hbars(box, rows, o = {}) {
  if (!box) return;
  if (!rows.length) {
    box.innerHTML = `<p class="hb-empty">${o.empty || "No data."}</p>`;
    return;
  }
  const max = o.max ||
    Math.max(...rows.map(r => Math.max(r.v, r.m || 0))) * 1.02 || 1;
  box.style.setProperty("--lw", (o.lw || 104) + "px");
  box.innerHTML = rows.map((r, i) => {
    const w = Math.max(.8, 100 * r.v / max);
    const t = r.m != null ? Math.min(100, 100 * r.m / max) : null;
    const end = Math.max(w, t || 0);
    return `<div class="hb-row${r.go ? " clk" : ""}" data-i="${i}"` +
      (r.go ? ` role="button" tabindex="0"` : "") + `>` +
      `<span class="hb-lab">` +
        (o.rank ? `<i class="rk">${o.rank + i}</i>` : "") +
        `${esc(r.label)}${r.sub ? ` <small>${esc(r.sub)}</small>` : ""}</span>` +
      `<span class="hb-track">` +
        `<i class="hb-bar" style="width:${w.toFixed(2)}%;background:${r.color}"></i>` +
        (t != null ? `<i class="hb-tick" style="left:${t.toFixed(2)}%"></i>` : "") +
        `<b class="hb-val" style="left:${end.toFixed(2)}%">${r.val}</b>` +
      `</span></div>`;
  }).join("");
  box.querySelectorAll(".hb-row").forEach(el => {
    const r = rows[+el.dataset.i];
    if (r.tip) TIP.bind(el, () => r.tip);
    if (!r.go) return;
    el.addEventListener("click", () => { TIP.hide(); r.go(); });
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); r.go(); }
    });
  });
}

const pct1 = v => (Math.round(v * 10) / 10).toFixed(1) + "%";
const list2 = a => a.length < 2 ? a.join("")
  : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
const nf = v => Number(v).toLocaleString("en-US");


/* ---------------- each role up close ----------------
   One role at a time, computed from the same POSTINGS the browser
   lists, so "See all 895" opens exactly 895 rows. Called once
   postings.json is in.                                         */
function initRoleProfiles() {
  const sec = document.getElementById("role-profile");
  if (!sec || !POSTINGS.length) return;
  const $ = id => document.getElementById(id);
  const all = POSTINGS, N = all.length;
  const SENS = ["junior", "mid", "senior"];
  const SENL = { junior: "Junior", mid: "Mid-level", senior: "Senior" };

  /* market-wide figures for the comparison ticks */
  const share = (rs, f) => rs.length ? 100 * rs.filter(f).length / rs.length : 0;
  const mSen = SENS.map(s => share(all, r => r.seniority === s));
  const mCty = {};
  CORDER.forEach(c => mCty[c] = share(all, r => r.country === c));
  const mEn = share(all, r => r.language === "en");
  const mSk = {};
  all.forEach(r => rSkills(r).forEach(k => mSk[k] = (mSk[k] || 0) + 1));

  const by = {};
  all.forEach(r => (by[r.role_family] = by[r.role_family] || []).push(r));
  const roles = Object.keys(by).sort((a, b) =>
    by[b].length - by[a].length || rlab(a).localeCompare(rlab(b)));
  const rank = {};
  roles.forEach((r, i) => rank[r] = i + 1);
  let cur = roles[0];

  function stats(rf) {
    const rs = by[rf], n = rs.length;
    const ages = rs.map(r => r.age_days).filter(v => v != null)
                   .sort((a, b) => a - b);
    const k = ages.length;
    const med = !k ? null : k % 2 ? ages[(k - 1) / 2]
                               : (ages[k / 2 - 1] + ages[k / 2]) / 2;
    const city = {};
    let noPlace = 0;
    rs.forEach(r => {
      if (!r.city || r.city === "unknown") { noPlace++; return; }
      const key = `${r.country}|${r.city}`;
      city[key] = (city[key] || 0) + 1;
    });
    const sk = {};
    rs.forEach(r => rSkills(r).forEach(x => sk[x] = (sk[x] || 0) + 1));
    const cty = {};
    rs.forEach(r => cty[r.country] = (cty[r.country] || 0) + 1);
    return {
      n, med,
      mean: k ? ages.reduce((s, v) => s + v, 0) / k : null,
      o60: k ? 100 * ages.filter(v => v > 60).length / k : 0,
      emp: new Set(rs.map(r => r.company).filter(Boolean)).size,
      agency: rs.filter(r => r.is_agency).length,
      en: share(rs, r => r.language === "en"),
      sen: SENS.map(s => rs.filter(r => r.seniority === s).length),
      cty, noPlace,
      places: Object.entries(city)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      skills: Object.entries(sk)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    };
  }

  /* chips: data roles, then AI roles, biggest first */
  $("rp-chips").innerHTML = [["Data roles", r => !isAI(r)],
                             ["AI roles", r => isAI(r)]].map(([lab, f]) =>
    `<div class="rp-chiprow"><span class="lab">${lab}</span>` +
    roles.filter(f).map(rf =>
      `<button type="button" class="chip" data-rf="${esc(rf)}"
               aria-pressed="false"><i style="background:${rcol(rf, 0)}"></i>` +
      `${esc(rlab(rf))}<small>${nf(by[rf].length)}</small></button>`)
      .join("") + `</div>`).join("");
  $("rp-chips").addEventListener("click", e => {
    const b = e.target.closest("button[data-rf]");
    if (!b) return;
    cur = b.dataset.rf;
    draw();
  });
  $("rp-posts").addEventListener("click", () => openPostings({ family: cur }));

  const num = v => v == null ? "–"
    : Number.isInteger(v) ? String(v) : v.toFixed(1);
  const kpi = (l, v, s) =>
    `<div class="rp-kpi"><span class="l">${l}</span><b>${v}</b>` +
    `<span>${s}</span></div>`;

  function draw() {
    const x = stats(cur), col = rcol(cur, 0), name = rlab(cur);
    const ai = isAI(cur);
    $("rp-chips").querySelectorAll("button").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.rf === cur)));
    $("rp-tag").textContent = ai ? "AI role" : "Data role";
    $("rp-tag").style.background = ai ? CORAL : STEEL;
    $("rp-name").textContent = name;
    $("rp-posts").textContent = `See all ${nf(x.n)} ${name} postings ↓`;

    const top = x.places[0], jr = x.sen[0];
    $("rp-sum").textContent =
      `${nf(x.n)} postings from ${nf(x.emp)} employers: ` +
      `${pct1(100 * x.n / N)} of the market and #${rank[cur]} of ` +
      `${roles.length} roles. ` +
      (top ? `${cityName(top[0].split("|")[1])} has the most ` +
             `(${nf(top[1])}). ` : "") +
      (jr ? `${nf(jr)} ${jr === 1 ? "is" : "are"} junior ` +
            `(${pct1(100 * jr / x.n)}).` : "None are junior.");

    $("rp-kpis").innerHTML =
      kpi("Postings", nf(x.n),
          `${pct1(100 * x.n / N)} of all · #${rank[cur]} of ${roles.length} roles`) +
      kpi("Employers", nf(x.emp), x.agency
          ? `${nf(x.agency)} of the postings come via agencies`
          : "No postings via agencies") +
      kpi("Median days online", num(x.med),
          `Mean ${num(x.mean)}; ${pct1(x.o60)} up for more than 60 days`) +
      kpi("In English", pct1(x.en), `All roles: ${pct1(mEn)}`);

    /* where */
    $("rp-where-sub").textContent = x.noPlace
      ? `Top places; ${nf(x.noPlace)} of its postings name no place`
      : "Top places for this role";
    hbars($("rp-where"), x.places.slice(0, 8).map(([k, v]) => {
      const [c, city] = k.split("|");
      return {
        label: cityName(city), sub: c.toUpperCase(), v, color: col,
        val: nf(v),
        tip: `<b>${esc(cityName(city))}</b>${esc(name)}<br>` +
             `<em>${nf(v)}</em> postings · ${pct1(100 * v / x.n)} of this role` +
             `<br>Click to list them`,
        go: () => openPostings({ family: cur, country: c, city: k })
      };
    }), { lw: 112, empty: "No posting names a place." });

    /* country shares vs the market, under seniority */
    hbars($("rp-ctry"), CORDER.map(c => {
      const v = x.cty[c] || 0, p = 100 * v / x.n;
      return {
        label: CNAME[c], v: p, m: mCty[c], color: col, val: pct1(p),
        tip: `<b>${CNAME[c]}</b><em>${pct1(p)}</em> of ${esc(name)} ` +
             `postings (${nf(v)})<br>All postings: ${pct1(mCty[c])}`
      };
    }), { lw: 84, max: 100 });

    /* seniority vs the market */
    sec.querySelectorAll(".rp-sw").forEach(e => e.style.background = col);
    hbars($("rp-sen"), SENS.map((s, i) => ({
      label: SENL[s], v: 100 * x.sen[i] / x.n, m: mSen[i], color: col,
      val: pct1(100 * x.sen[i] / x.n),
      tip: `<b>${SENL[s]}</b><em>${pct1(100 * x.sen[i] / x.n)}</em> of ` +
           `${esc(name)} postings (${nf(x.sen[i])})<br>` +
           `All postings: ${pct1(mSen[i])}`
    })), { lw: 84, max: 100 });

    /* skills vs the market */
    hbars($("rp-skills"), x.skills.slice(0, 8).map(([k, v]) => {
      const p = 100 * v / x.n, m = 100 * (mSk[k] || 0) / N;
      return {
        label: slab(k), v: p, m, color: GENAI.has(k) ? CORAL : STEEL,
        val: pct1(p),
        tip: `<b>${esc(slab(k))}</b><em>${pct1(p)}</em> of ${esc(name)} ` +
             `postings (${nf(v)})<br>All postings: ${pct1(m)}` +
             (m ? `<br>${(p / m).toFixed(1)}× the market-wide rate` : "")
      };
    }), { lw: 130,
          empty: "Too few skill mentions to rank for this role: the " +
                 "matcher only sees the title and the first 500 " +
                 "characters of each description." });
  }

  sec.hidden = false;
  draw();
  /* the GenAI set may grow once skill_demand.json is in */
  get("skill_demand").then(sd => {
    (sd || []).forEach(r => { if (r.skill_category === "genai") GENAI.add(r.skill); });
    draw();
  });
}


/* ---------------- AI vocabulary ----------------
   Top 15 skills, generative-AI ones in coral.                     */
get("skill_demand").then(sd => {
  const sec = document.getElementById("vocab-section");
  if (!sec || !Array.isArray(sd) || !sd.length) return;
  sd.forEach(r => { if (r.skill_category === "genai") GENAI.add(r.skill); });
  const isG = r => GENAI.has(r.skill);
  const top = sd.slice().sort((a, b) =>
    b.pct_postings - a.pct_postings || b.n_postings - a.n_postings)
    .slice(0, 15);
  if (!top.length) return;

  const max = Math.max(...top.map(r => r.pct_postings)) * 1.04;
  const rows = top.map(r => ({
    label: slab(r.skill), v: r.pct_postings,
    color: isG(r) ? CORAL : STEEL, val: r.pct_postings.toFixed(1) + "%",
    tip: `<b>${esc(slab(r.skill))}</b><em>${r.pct_postings}%</em> of ` +
         `postings (${nf(r.n_postings)})` +
         (isG(r) ? "<br>Generative-AI skill" : "")
  }));
  const half = Math.ceil(rows.length / 2);
  hbars(document.getElementById("vocab-a"), rows.slice(0, half),
        { lw: 150, max, rank: 1 });
  hbars(document.getElementById("vocab-b"), rows.slice(half),
        { lw: 150, max, rank: half + 1 });
  sec.hidden = false;
});


/* ---------------- runs and the outage ----------------
   One square per day since the first run, weeks as columns with
   Monday on top. Read off the same run history as the time charts. */
RUNS.then(runs => {
  const sec = document.getElementById("runs-section");
  const box = document.getElementById("runcal");
  if (!sec || !box || !runs) return;

  const { first, last, set, gaps } = runs;
  const nDays = dayList(first, last).length;
  const live = runs.live || {};

  /* the run streak that ends on the newest day */
  let streak = 0;
  for (let d = last; d >= first && set.has(d); d = addDays(d, -1)) streak++;
  const restart = addDays(last, -(streak - 1));
  const big = gaps.filter(g => g.outage);
  const other = gaps.filter(g => !g.outage);
  const lastOut = big[big.length - 1];

  const sum = other.reduce((s, g) => s + g.n, 0);
  document.getElementById("runs-gaps").textContent = other.length
    ? `Shorter gaps: ${list2(other.map(g => fRange(g.from, g.to)))} ` +
      `(${sum} day${sum === 1 ? "" : "s"} in total).` : "";

  /* calendar; the section must be visible before text is measured */
  sec.hidden = false;
  const ns = "http://www.w3.org/2000/svg";
  const start = mondayOf(first);
  const nW = Math.floor(dayList(start, last).length / 7) +
             (dayList(start, last).length % 7 ? 1 : 0);
  const cell = 20, gap = 4, lab = 32, top = 20;
  const X = c => lab + c * (cell + gap), Y = r => top + r * (cell + gap);
  const gridH = 7 * (cell + gap) - gap;
  const Wd = lab + nW * (cell + gap), Hd = top + gridH + (big.length ? 40 : 8);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${Wd} ${Hd}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Run calendar from ${fDay(first)} to ` +
    `${fDay(last)}: ${runs.days.length} of ${nDays} days have a snapshot.`);
  const mk = (tag, attrs, parent, text) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    (parent || svg).appendChild(e);
    return e;
  };
  ["Mon", "", "Wed", "", "Fri", "", "Sun"].forEach((t, r) => {
    if (t) mk("text", { x: lab - 7, y: Y(r) + cell / 2 + 4,
                        "text-anchor": "end", class: "cl-d" }, null, t);
  });
  let lastMo = null;
  for (let c = 0; c < nW; c++) {
    for (let r = 0; r < 7; r++) {
      const d = addDays(start, c * 7 + r);
      if (d < first || d > last) continue;
      if (d.slice(5, 7) !== lastMo) {
        lastMo = d.slice(5, 7);
        mk("text", { x: X(c), y: top - 7, class: "cl-m" }, null,
           MON3[+lastMo - 1]);
      }
      break;
    }
  }
  dayList(first, last).forEach(d => {
    const k = Math.round((dayTs(d) - dayTs(start)) / 864e5);
    const c = Math.floor(k / 7), r = k % 7, ran = set.has(d);
    const g = mk("g", { class: "cl-c", tabindex: 0 });
    if (ran) mk("rect", { x: X(c), y: Y(r), width: cell, height: cell,
                          rx: 3, class: "cl-on" }, g);
    else mk("rect", { x: X(c) + .5, y: Y(r) + .5, width: cell - 1,
                      height: cell - 1, rx: 3, class: "cl-off" }, g);
    const o = !ran && outageIn(d, d);
    TIP.bind(g, () => `<b>${fDayW(d)} ${d.slice(0, 4)}</b>` + (ran
      ? `Snapshot written` + (live[d] != null
          ? `<br><em>${nf(live[d])}</em> live postings` : "")
      : `No run${o ? ` (${o.why})` : ""}`));
  });
  big.forEach(gp => {
    const cA = Math.floor((dayTs(gp.from) - dayTs(start)) / 864e5 / 7);
    const cB = Math.floor((dayTs(gp.to) - dayTs(start)) / 864e5 / 7);
    const by = top + gridH + 9, xa = X(cA), xb = X(cB) + cell;
    mk("path", { d: `M${xa},${by - 4}V${by}H${xb}V${by - 4}`,
                 class: "cl-br" });
    const t = mk("text", { x: (xa + xb) / 2, y: by + 17,
                           "text-anchor": "middle", class: "cl-bt" }, null,
                 `${fRange(gp.from, gp.to)} · due to ${gp.outage.why}`);
    /* keep the label inside the calendar */
    if (!svg.parentNode) box.appendChild(svg);
    const w = t.getComputedTextLength();
    if ((xa + xb) / 2 + w / 2 > Wd - 2) {
      t.setAttribute("text-anchor", "end");
      t.setAttribute("x", Wd - 2);
    } else if ((xa + xb) / 2 - w / 2 < 2) {
      t.setAttribute("text-anchor", "start");
      t.setAttribute("x", 2);
    }
  });
  if (!svg.parentNode) box.appendChild(svg);

  /* the incident card, for the most recent outage */
  const card = document.getElementById("runs-incident");
  if (lastOut && card) {
    const back = addDays(lastOut.to, 1);
    card.innerHTML =
      `<span class="tag">⚠ Incident · ${fRange(lastOut.from, lastOut.to)} ` +
      `${lastOut.to.slice(0, 4)}</span>` +
      `<h3>${lastOut.n} days without a run</h3><dl>` +
      `<div><dt>What happened</dt><dd>The account was blocked ` +
      `(${lastOut.outage.why}), so the daily job couldn't run.</dd></div>` +
      `<div><dt>Impact</dt><dd>No snapshots for ${lastOut.n} days, shaded ` +
      `in the time charts.</dd></div>` +
      `<div><dt>Recovered</dt><dd>Adverts from those days still online on ` +
      `${fDay(back)} were counted, as lower bounds.</dd></div>` +
      (set.has(back) ? `<div><dt>Since</dt><dd>Daily again from ` +
        `${fDay(back)}` + (restart === back
          ? `, ${nf(streak)} runs in a row.` : ".") + `</dd></div>` : "") +
      `</dl>`;
  } else if (card) card.hidden = true;

  sec.hidden = false;
});
