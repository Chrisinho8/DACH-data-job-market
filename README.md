# Whats up with the data-job-market in Austria/Germany/Switzerland?

![tests](https://github.com/Chrisinho8/DACH-data-job-market/actions/workflows/tests.yml/badge.svg)

**3,900+ live data-job postings across Germany, Austria and Switzerland. 159 of them, 3.6%, are advertised as junior. That is ten senior openings for every junior one, and zero junior roles for data architects. Meanwhile the average posting has been open 53 days against a median of 14, so the market is not just top-heavy, it is slow at the top.**

**[Live tracker](https://Chrisinho8.github.io/DACH-data-job-market/)**
: maps, country comparisons and role breakdowns, rebuilt every Monday.
(Last updated: 30/07/2026)

## What the tracker does
Every Monday at 06:00 it queries the Adzuna API for 15 job titles in
Germany, Austria and Switzerland, nationally, paginating until each
search is exhausted. Results are deduplicated, classified, filtered to
data roles, aggregated and published to the site automatically.


 **This is not a job board.** It will not help you find a role, and it
 deliberately does not link to or republish individual postings. It
 exists to describe the *shape* of the market — how long roles stay
 open, how few are advertised as junior, which cities and countries
 hire in English — using aggregate figures only.


## What the data says (Main insights)

**Job offerings per job-field**
| Role family | Postings |
|---|---|
| AI / ML | 1,520 |
| Data engineer | 1,010 |
| BI developer | 399 |
| Data scientist | 395 |
| Data analyst | 290 |
| Data architect | 259 |
| DWH / ETL | 197 |
| Data consultant | 167 |
| Data governance | 99 |
| Analytics engineer | 71 |

**Junior roles barely exist.** 159 of 3906 postings, **3.9%**, carry a
junior title. Ten senior openings for every junior one. `data architect`
has zero.


**Jobs seniority comparison:**
| Seniority | Postings | Share |
|---|---|---|
| Junior | 159 | 3.6% |
| Mid | 2,619 | 59.4% |
| Senior | 1,629 | 37.0% |


The search parameter is a keyword match, not a title match, so these
queries overlap heavily and also drag in unrelated roles. Every posting
is therefore **reclassified from its own job title**, not from the
query that found it.

### What it measures

- **Posting age** — days between the posting date and the snapshot
- **Reposts** — the same role relisted under a new ID
- **Role family** — ten families, from the title
- **Seniority** — junior, mid or senior, from the title
- **Language** — German or English, from the description
- **Location** — city, region and country, from the posting's own
  geographic fields rather than the search query
- **Poster type** — recruitment agency or direct employer
- **Tool mentions** - 47 technologies matched with a curated dictionary

 
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
array. In the city-states — Berlin, Hamburg, Bremen, Vienna, Basel and
Geneva — the third level is a district rather than a city, so it is
collapsed into the parent. Administrative wrappers (`(Kreis)`,
`-Umgebung`, `-Land`, `Region ...`) are stripped.

**Currency.** Swiss postings quote francs. Salary figures are never
averaged across currencies; only the disclosure rate is compared
between countries.

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
- **Descriptions are hard-capped at 500 characters** and 99.6% are
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
- **Entry programmes are excluded**, so the 3.6% junior figure covers
  junior-titled permanent roles only.
- **Agency detection is keyword based** and undercounts.
- **Reposts are detected by content hash**, so genuinely distinct roles
  with identical wording would be merged.

Only aggregates are published here. Individual listings are not
redistributed.

## Running it

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
