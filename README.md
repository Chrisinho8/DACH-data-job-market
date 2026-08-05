# What's up with the data-job market in Austria/Germany/Switzerland?

![tests](https://github.com/Chrisinho8/DACH-data-job-market/actions/workflows/tests.yml/badge.svg)

**[Open the live tracker](https://Chrisinho8.github.io/DACH-data-job-market/)** · last updated 5 August 2026

A weekly snapshot of the DACH data-job market: **3,625 live postings from 1,462 employers** across Germany, Austria and Switzerland. Every Monday at 06:00 a Databricks pipeline queries the Adzuna API for 15 job titles in all three countries, deduplicates and classifies the results through a bronze/silver/gold Delta Lake, scans each posting against a curated 47-term skills dictionary, and publishes to a static site.

## What you can do with it

- **See the shape of the market** - volumes by role, city and country, how long postings stay open, seniority mix, tool mentions, English-language share, salary disclosure.
- **Read the postings behind any number.** Every chart is a count of real adverts, and those adverts are browsable: search by title or employer, filter by role family, country, city and seniority, sort by newest or longest-open, 20 per page. Titles link out to the aggregator.
- **Drill down from a chart.** Click a city on the map or a bar in any role chart and the list below filters to it. Nothing on the site is a number you have to take on trust.
- **Watch it move.** Nothing is ever overwritten, so each run adds to the record and every figure gains a second dimension: not just how many AI roles are open, but whether that number is climbing.

## Main insights

Snapshot of 2026-08-05.

| Role family | Postings | Share | Avg days open | DE | AT | CH |
|---|---:|---:|---:|---:|---:|---:|
| Data Engineer | 973 | 26.8% | 59 d | 821 | 70 | 82 |
| Data Scientist | 406 | 11.2% | 64 d | 349 | 19 | 38 |
| AI Engineer | 375 | 10.3% | 54 d | 332 | 18 | 25 |
| Data Architect | 273 | 7.5% | 61 d | 256 | 10 | 7 |
| GenAI / LLM Engineer | 269 | 7.4% | 38 d | 240 | 15 | 14 |
| Data Analyst | 244 | 6.7% | 72 d | 201 | 26 | 17 |
| BI Developer | 202 | 5.6% | 43 d | 187 | 5 | 10 |
| Data Warehouse / ETL | 174 | 4.8% | 84 d | 158 | 11 | 5 |
| ML Engineer | 167 | 4.6% | 64 d | 128 | 15 | 24 |
| Data Consultant | 143 | 3.9% | 84 d | 129 | 4 | 10 |
| MLOps / ML Platform | 112 | 3.1% | 52 d | 90 | 11 | 11 |
| AI Consulting | 94 | 2.6% | 44 d | 75 | 13 | 6 |
| Data Governance and Security | 87 | 2.4% | 91 d | 74 | 3 | 10 |
| Analytics Engineer | 69 | 1.9% | 59 d | 63 | 5 | 1 |
| AI Research | 37 | 1.0% | 51 d | 30 | 1 | 6 |
| **Total** | **3,625** | **100%** | **60 d** | **3,133** | **226** | **266** |

## Scope: what counts as a data job

**Data:** data engineer, data analyst, data scientist, data architect, analytics engineer, DWH / ETL, data governance, data consultant, BI developer.

**AI:** AI engineer, GenAI / LLM, ML engineer, MLOps, AI consultant, AI research.

| Excluded | Why |
|---|---|
| Titles saying "AI"/"KI" and naming no role | A title cannot tell an AI job from a job at a company that likes the word. The rule still runs and still catches them, but they are dropped. **AI figures are a floor, not a total.** |
| German *Controlling*, FP&A, finance | Management accounting, a separate profession |
| Ausbildung, duales Studium, Werkstudent, Praktikum, Trainee | Education programmes, and they stay listed for months, distorting the age figures |
| Data **centre** infrastructure | False friend: "Data Center Engineering Operations" is physical infrastructure |
| General software, cloud and DevOps engineering | Not data roles, pulled in by keyword overlap |
| Speculative applications, parse artefacts | Not job postings at all |

Excluded rows land in `silver.excluded` so the decision stays auditable.

## Architecture

```
Adzuna API (de, at, ch)
  -> raw JSON cached in a Unity Catalog volume
  -> Auto Loader (trigger availableNow)
  -> BRONZE   append-only, every snapshot preserved
  -> SILVER   parsed, classified, scope-filtered, deduplicated,
              quality-gated
  -> GOLD     aggregates + weekly history
              + postings_public (the one row-level table)
  -> JSON committed to this repo
  -> GitHub Pages
```

![Visualized architecture](assets/pipeline-architecture.png)

**Browsing the postings.** Everything on the site is a count except one table. `gold.postings_public` ships as `docs/data/postings.json` and backs the searchable list. It carries title, employer, city, role family, seniority, age and the aggregator's `redirect_url` — not descriptions (not ours to redistribute, and 99.6% are truncated anyway) and not salary (mostly the aggregator's own prediction). Rows without a link are dropped rather than rendered dead.

**Skill extraction.** A curated dictionary of 47 terms, not an LLM, so every match points at a specific string in a specific posting and the counts are reproducible. The traps are real: "SQL" hides inside "PostgreSQL", "Java" inside "JavaScript", a bare "R" matches "R&D" and half of every German address block. Each one is pinned by a test in `tests/test_matcher.py` that runs in CI on every push. See `src/matcher.py`.

**Deduplication.** Postings are hashed on title, company, city and the first 200 characters of the description; the earliest listing wins. Query overlap is counted separately from genuine reposts and is not published as a finding.

**Posting age.** Days between the API's `created` date and the snapshot date, for postings still returned as live.

**Location.** From each posting's own location array. In the city-states (Berlin, Hamburg, Bremen, Vienna, Basel, Geneva) the third level is a district and is collapsed into the parent. Administrative wrappers (`(Kreis)`, `-Umgebung`, `-Land`, `Region ...`) are stripped.

## Limitations


- **`created` is the aggregator's date**, possibly when it indexed the posting rather than when the employer published it.
- **Descriptions are capped at 500 characters** and 99.6% are truncated. Tool counts measure *mentioned in the title or opening paragraph* — a floor, not a requirement rate. The window is identical for every posting, so comparing tools holds; absolute rates do not.
- **AI counts are a floor**, for the reason in the scope table. The dropped share is printed on every run of `03_silver_clean.py`; if it climbs, the six rules are going stale.
- **A posting in the browser is not necessarily open.** It was live at the last refresh. Nothing re-checks whether it has since been filled or withdrawn.
- **Roles and seniority are inferred from titles**, so both carry classification error.
- **Agency detection is keyword based** and flags only 3.9%, almost certainly an undercount.
- **6.3% of records are rejected** by the quality rules each run and quarantined rather than silently dropped.
- **The history table has a break at 2026-08-05.** Rows before it counted a seventh AI family for titles naming no role; rows after do not. The step in `role_count` and `ai_family_pct` is a definition change, not the market moving.

## Running it yourself

1. Get an `app_id` and `app_key` from `developer.adzuna.com`.
2. Create a Databricks workspace (Free Edition is enough) and run `notebooks/setup_uc.py` to create the catalog, schemas and volumes.
3. Put credentials in the `conf` volume, outside this repo:

```python
pathlib.Path("/Volumes/jobs/bronze/conf/adzuna.json").write_text(
    json.dumps({"app_id": "...", "app_key": "..."}))
```

4. Import `notebooks/` and run 01 to 06 in order.
5. Chain them into a weekly Databricks Workflow.

```bash
pip install -r requirements.txt && pytest tests/ -v
```

## Tech stack

Databricks Free Edition, Delta Lake, Auto Loader, Unity Catalog, PySpark, Databricks Workflows, GitHub Actions and Pages, Chart.js, SQL.

## Licence

MIT. The underlying job data belongs to Adzuna and its source boards.
