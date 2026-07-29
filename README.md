# How stale is the German-speaking data job market?

![tests](https://github.com/Chrisinho8/german-data-job-market/actions/workflows/tests.yml/badge.svg)

**4,407 live data-job postings across Germany, Austria and Switzerland. 159 of them, 3.6%, are advertised as junior. That is ten senior openings for every junior one, and zero junior roles for data architects. Meanwhile the average posting has been open 53 days against a median of 14, so the market is not just top-heavy, it is slow at the top.**

**[Live tracker](https://Chrisinho8.github.io/german-data-job-market/)**
: maps, country comparisons and role breakdowns, rebuilt every Monday.

| | Germany | Austria | Switzerland |
|---|---|---|---|
| Live postings | 3,774 | 276 | 357 |
| Employers | 1,457 | 175 | 185 |
| Median days open | 13 | 26 | 16 |
| Mean days open | 53 | 65 | 50 |
| Open > 60 days | 26.1% | 22.5% | 18.5% |
| Advertised in English | 29.6% | 37.7% | 62.2% |
| Disclosing a salary | 4.2% | 5.8% | 2.0% |

Snapshot of **29 July 2026**. The live tracker always shows current numbers.

---

## What the data says

**Junior roles barely exist.** 159 of 4,407 postings, **3.6%**, carry a
junior title. Ten senior openings for every junior one. `data architect`
has zero.

| Seniority | Postings | Share |
|---|---|---|
| Junior | 159 | 3.6% |
| Mid | 2,619 | 59.4% |
| Senior | 1,629 | 37.0% |

**AI/ML is now the largest family**, ahead of data engineering.

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


## What the tracker does

Every Monday at 06:00 it queries the Adzuna API for 12 job titles in
Germany, Austria and Switzerland, nationally, paginating until each
search is exhausted. Results are deduplicated, classified, filtered to
data roles, aggregated and published to the site automatically.

### Titles searched

| | |
|---|---|
| `data engineer` | `data analyst` |
| `data scientist` | `analytics engineer` |
| `bi developer` | `machine learning engineer` |
| `ai engineer` | `data architect` |
| `etl developer` | `big data engineer` |
| `mlops engineer` | `data warehouse` |

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
- **Tool mentions** — 47 technologies matched with a curated dictionary

### Coverage and cadence

| | |
|---|---|
| Region | Germany, Austria, Switzerland — national, no city filter |
| Cities resolved | 282 |
| Frequency | Weekly, Monday 06:00 Europe/Berlin |
| Snapshot retention | Every week kept permanently |
| API calls per run | ~200 of a 1,000/month free tier |
| Runtime | Under 10 minutes end to end |
| Infrastructure cost | EUR 0 |

Because every weekly snapshot is retained, the dataset gets more useful
over time: after a few weeks it shows which roles and tools are rising
or falling, rather than a single picture of one day.

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

One Databricks Workflow, weekly. Bronze keeps every snapshot, so the
whole history can be reprocessed with better logic without re-calling
the API.

## Method

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

## Validation

| Check | Result |
|---|---|
| Postings in scope, after filtering | 4,407 |
| Cities resolved | 282 |
| Descriptions truncated by the API | 99.6% |
| Postings with a stated salary | ~181 (4.1%) |
| Agency detection rate | 4.1%, a lower bound |
| Skill matcher precision / recall | not yet measured |
| Matcher unit tests | 15, green in CI |

A deliberately corrupted record (salary of 9,999,999, date of 2019) is
injected on every run to prove the quality gate fires. A schema guard
fails the run if a raw filename does not parse to a valid country code.

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
- **Salary data is almost entirely absent**, so nothing is published
  beyond the disclosure rate.
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
PySpark · Databricks Workflows · GitHub Actions · GitHub Pages ·
Chart.js

## Licence

MIT. The underlying job data belongs to Adzuna and its source boards.
