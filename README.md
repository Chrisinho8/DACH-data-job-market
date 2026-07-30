# Whats up with the data-job-market in Austria/Germany/Switzerland?

![tests](https://github.com/Chrisinho8/DACH-data-job-market/actions/workflows/tests.yml/badge.svg)

**3,991 live data-job postings across Germany, Austria and Switzerland. 132 of them, 3.3%, are advertised as junior. That is eleven senior openings for every junior one, and zero junior roles at all for data architects and BI developers. Meanwhile the average posting has been open 54 days against a median of 15, so the market is not just top-heavy, it is slow at the top.**

**[Live tracker](https://Chrisinho8.github.io/DACH-data-job-market/)**
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

**Job offerings per job-field**
| Role family | Postings | Share |
|---|---|---|
| AI / ML | 1,435 | 36.0% |
| Data engineer | 984 | 24.7% |
| Data scientist | 391 | 9.8% |
| Data architect | 260 | 6.5% |
| Data analyst | 259 | 6.5% |
| BI developer | 205 | 5.1% |
| DWH / ETL | 164 | 4.1% |
| Data consultant | 135 | 3.4% |
| Data governance | 89 | 2.2% |
| Analytics engineer | 69 | 1.7% |
| **Total** | **3,991** | **100%** |

Every posting belongs to exactly one family, so the table sums to the
headline figure. The same 3,991 is the denominator for every percentage
on this page and on the site.

**Junior roles barely exist.** 132 of 3,991 postings, **3.3%**, carry a
junior title. Eleven senior openings for every junior one. `data
architect` and `bi developer` have zero.


**Jobs seniority comparison:**
| Seniority | Postings | Share |
|---|---|---|
| Junior | 132 | 3.3% |
| Mid | 2,368 | 59.3% |
| Senior | 1,491 | 37.4% |
| **Total** | **3,991** | **100%** |


**By country:**
| | Germany | Austria | Switzerland |
|---|---|---|---|
| Live postings | 3,398 | 271 | 322 |
| Employers | 1,342 | 171 | 173 |
| Median age | 14 d | 27 d | 20 d |
| Mean age | 53 d | 67 d | 55 d |
| Open > 60 days | 26.5% | 22.9% | 20.2% |
| In English | 30.4% | 36.9% | 61.2% |
| Salary shown | 4.3% | 5.9% | 3.1% |


The search parameter is a keyword match, not a title match, so these
queries overlap heavily and also drag in unrelated roles. Every posting
is therefore **reclassified from its own job title**, not from the
query that found it.

### What it measures

- **Posting age**: days between the posting date and the snapshot
- **Reposts**: the same role relisted under a new ID
- **Role family**: ten families, from the title
- **Seniority**: junior, mid or senior, from the title
- **Language**: German or English, from the description
- **Location**: city, region and country, from the posting's own
  geographic fields rather than the search query
- **Poster type**: recruitment agency or direct employer
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
array. In the city-states (Berlin, Hamburg, Bremen, Vienna, Basel and
Geneva) the third level is a district rather than a city, so it is
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
