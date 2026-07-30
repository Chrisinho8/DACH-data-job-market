# Whats up with the data-job-market in Austria/Germany/Switzerland?

![tests](https://github.com/Chrisinho8/DACH-data-job-market/actions/workflows/tests.yml/badge.svg)

A weekly snapshot of the DACH data-job market: 3,991 live postings across Germany, Austria and Switzerland, of which 132, just 3.3%, are advertised as junior. That is eleven senior openings for every junior one, and none at all for data architects or BI developers. Every Monday a Databricks pipeline pulls live postings from the Adzuna API, deduplicates and classifies them through a bronze/silver/gold Delta Lake, scans each one against a curated 47-term skills dictionary, and publishes the aggregates to a static site. Built with PySpark, Delta Lake, Auto Loader, Unity Catalog, Databricks Workflows, SQL, Chart.js, GitHub Actions and Pages.

**[Open the Live tracker](https://Chrisinho8.github.io/DACH-data-job-market/)**
: maps, country comparisons and role breakdowns, rebuilt every Monday.
(Last updated: 30/07/2026)

## What the tracker does
Every Monday at 06:00 it queries the Adzuna API for 15 job titles in
Germany, Austria and Switzerland, nationally, paginating until each
search is exhausted. Results are deduplicated, classified, filtered to
data roles, aggregated and published to the site automatically.

Each surviving posting is then scanned for technologies with a curated
dictionary of 47 terms, so the site can show which tools the market is
actually asking for. This is deliberately not an LLM: every match
points at a specific string in a specific posting, which makes the
counts reproducible and lets the tricky cases be tested rather than
trusted. Those cases are real ones. "SQL" hides inside "PostgreSQL",
"Java" inside "JavaScript", and a bare "R" matches "R&D" and half of
every German address block. Each of those traps is pinned down by a
test in `tests/test_matcher.py` that runs in CI on every push. See
`src/matcher.py`.

 **This is not a job board.** It will not help you find a role, and it
 deliberately does not link to or republish individual postings. It
 exists to describe the *shape* of the market, how long roles stay
 open, how few are advertised as junior, which cities and countries
 hire in English, using aggregate figures only.



## What the data says (Main insights)

| Role family | Postings | Share | Junior | Senior | Avg days open | In English | DE | AT | CH |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| AI/ML Engineer | 1,435 | 36.0% | 57 | 563 | 47 d | 48% | 1,190 | 104 | 141 |
| Data Engineer | 984 | 24.7% | 26 | 323 | 53 d | 25% | 838 | 72 | 74 |
| Data Scientist | 391 | 9.8% | 22 | 192 | 64 d | 39% | 331 | 21 | 39 |
| Data Architect | 260 | 6.5% | 0 | 130 | 49 d | 18% | 242 | 10 | 8 |
| Data Analyst | 259 | 6.5% | 13 | 67 | 61 d | 30% | 206 | 30 | 23 |
| BI Developer | 205 | 5.1% | 0 | 43 | 40 d | 12% | 187 | 8 | 10 |
| Data Warehouse / ETL | 164 | 4.1% | 2 | 25 | 84 d | 5% | 147 | 12 | 5 |
| Data Consultant | 135 | 3.4% | 7 | 60 | 76 d | 28% | 120 | 5 | 10 |
| Data Governance and Security | 89 | 2.2% | 1 | 59 | 84 d | 35% | 76 | 3 | 10 |
| Analytics Engineer | 69 | 1.7% | 4 | 29 | 54 d | 33% | 61 | 6 | 2 |
| **Total** | **3,991** | **100%** | **132** | **1,491** | **54 d** | **33%** | **3,398** | **271** | **322** |

Every posting belongs to exactly one family, so the table sums to the
headline figure. Junior and Senior are counts, not shares; the
remainder is "mid", which only means no seniority word appeared in the
title. Switzerland advertises in English far more than its neighbours
(61% of Swiss postings against 30% German), and almost nobody publishes
a salary anywhere (4.3% DE, 5.9% AT, 3.1% CH) despite the EU pay
transparency directive's June 2026 transposition deadline.

 
 ## What the tracker will provide in the future

Right now this is a single snapshot: every figure above describes one
Monday. Because bronze is append-only and `gold.history` is never
overwritten, each weekly run adds to the record rather than replacing
it - so the dataset stops being a photograph and becomes a recording.
From the third snapshot the week-over-week chart appears, and from the
fourth a better measure of staleness becomes possible: instead of
trusting the API's posting date, the pipeline can compare snapshots
directly and ask how many roles that were live a month ago are still
listed today. Given a few months it can answer the questions that
actually matter - whether AI/ML keeps taking share from data
engineering, which tools are quietly disappearing from postings, and
whether junior openings are seasonal or simply absent year-round. None
of that needs new code; it needs Mondays. And because every raw API
response is cached, if the classification logic improves later the
entire history can be reprocessed under the better rules without
spending a single extra API call.


## Scope: what counts as a data job

This is the decision that most affects the numbers, so it is written
down rather than buried in code.

**Kept:** data engineer, data analyst, data scientist, data architect,
analytics engineer, DWH / ETL, data governance, data consultant,
BI developer, and AI / ML engineering as its own family.

**Excluded, with reasons:**

| Excluded | Why |
|---|---|
| German *Controlling*, FP&A, finance | Management accounting, a separate profession with its own labour market |
| Ausbildung, duales Studium, Werkstudent, Praktikum, Trainee | Education programmes rather than job openings, and they stay listed for months, which distorts the age figures |
| Data **centre** infrastructure | A false friend: "Data Center Engineering Operations" is physical infrastructure |
| General software, cloud and DevOps engineering | Not data roles, pulled in by keyword overlap |
| Speculative applications, parse artefacts | Not job postings at all |

Excluded rows are retained in `silver.excluded` so the decision is
auditable rather than invisible.

## Architecture

```
Adzuna API (de, at, ch)
  -> raw JSON cached in a Unity Catalog volume
  -> Auto Loader (trigger availableNow)
  -> BRONZE   append-only, every snapshot preserved
  -> SILVER   parsed, classified, scope-filtered, deduplicated,
              quality-gated
  -> GOLD     aggregates + weekly history
  -> JSON committed to this repo
  -> GitHub Pages
```

![Visualized architecture](assets/pipeline-architecture.png)


## Methods used:

**Deduplication.** The same role is republished under new IDs
constantly. Postings are hashed on title, company, city and the first
200 characters of the description; the earliest listing is kept. Query
overlap (one posting returned by several searches) is counted
separately from genuine reposts and is not published as a finding.

**Posting age.** Days between the API's `created` date and the snapshot
date, for postings still returned as live.

**Location.** City and region come from each posting's own location
array. In the city-states (Berlin, Hamburg, Bremen, Vienna, Basel and
Geneva) the third level is a district rather than a city, so it is
collapsed into the parent. Administrative wrappers (`(Kreis)`,
`-Umgebung`, `-Land`, `Region ...`) are stripped.

**Skill extraction.** A curated dictionary of 47 terms, not an LLM, so
results are reproducible and every match points at a specific string.
See `src/matcher.py`.


## Limitations

- **Postings are not hires.** An old posting may be a genuinely
  unfilled role, a pipeline-building advert, or a listing nobody took
  down. This measures advertising behaviour, not hiring outcomes.
- **One aggregator is not the whole market**, and its coverage is not
  equally deep in all three countries. Austria and Switzerland have a
  few hundred postings each, so their figures are more sensitive to
  noise than Germany's.
- **`created` is the aggregator's date**, which may be when it indexed
  the posting rather than when the employer published it.
- **Descriptions are hard-capped at 500 characters** and 99.5% are
  truncated. Tool counts measure *mentioned in the title or opening
  paragraph*, a floor rather than a requirement rate. The truncation
  window is identical for every posting, so relative comparisons
  between tools hold; absolute rates do not.
- **The AI / ML family includes software engineering roles that merely
  mention AI**, which inflates it. It is the largest family partly for
  that reason.
- **Roles and seniority are inferred from titles** with keyword rules,
  so both carry classification error. The junior figure in particular
  reflects titles, not requirements: a role advertised without a
  seniority word counts as mid.
- **Entry programmes are excluded**, so the 3.3% junior figure covers
  junior-titled permanent roles only.
- **Agency detection is keyword based** and flags only 3.9%, which is
  almost certainly an undercount. Treat it as a lower bound.
- **5.3% of records are rejected by the quality rules** on each run and
  quarantined rather than silently dropped.
- **Only aggregates are published here.** Individual listings are not
  redistributed.


## Running it yourself

1. Get an `app_id` and `app_key` from `developer.adzuna.com`.
2. Create a Databricks workspace (Free Edition is enough) and run
   `notebooks/setup_uc.py` to create the catalog, schemas and volumes.
3. Put credentials in the `conf` volume, outside this repo:

```python
pathlib.Path("/Volumes/jobs/bronze/conf/adzuna.json").write_text(
    json.dumps({"app_id": "...", "app_key": "..."}))
```

4. Import `notebooks/` and run 01 to 06 in order.
5. Chain them into a weekly Databricks Workflow.

Tests:

```bash
pip install -r requirements.txt && pytest tests/ -v
```

## Stack

Databricks Free Edition · Delta Lake · Auto Loader · Unity Catalog ·
PySpark · Databricks Workflows · GitHub Actions and Pages · 
Chart.js · SQL 

## Licence

MIT. The underlying job data belongs to Adzuna and its source boards.
