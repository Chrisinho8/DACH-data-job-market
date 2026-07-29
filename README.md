# How stale is the German data job market?

![tests](https://github.com/Chrisinho8/german-data-job-market/actions/workflows/tests.yml/badge.svg)

**[N] live German data-job postings analysed. [THE FINDING — one
sentence, with a number in it. e.g. "One in four postings advertised as
open has been live for more than 60 days."]**

**[Live tracker](https://Chrisinho8.github.io/german-data-job-market/)** —
refreshed automatically every Monday.

![key chart](assets/chart_age.png)

---

## Why this exists

Job boards show you what is *listed*, not what is *live*. A posting that
has been up for 90 days is a very different signal from one posted
yesterday, but nothing on the board tells you which is which.

This pipeline pulls the German data-job market every week and measures
the thing nobody publishes: how long these roles have actually been
advertised, who is advertising them, and how much of the board is the
same job posted over and over.

## Architecture

![architecture](assets/architecture.png)

```
Adzuna DE API
   -> raw JSON cached in a Unity Catalog volume
   -> Auto Loader (trigger availableNow)
   -> BRONZE  append-only, payload preserved
   -> SILVER  parsed, deduplicated, quality-gated
   -> GOLD    aggregates + weekly history
   -> JSON committed to this repo
   -> GitHub Pages
```

Orchestrated as a single Databricks Workflow running weekly.
Total infrastructure cost: **EUR 0**.

## Data

| | |
|---|---|
| Source | Adzuna DE public API |
| Postings analysed | [N] |
| Distinct employers | [N] |
| Collection window | weekly snapshots since [date] |
| Roles covered | data engineer, data analyst, data scientist, analytics engineer, BI developer, ML engineer |

## Method

**Deduplication.** The same role is republished constantly under new
IDs. Postings are hashed on title, company, city and the first 200
characters of the description, and the earliest listing is kept. This
removed **[X]%** of raw rows.

**Posting age.** Days between the API's `created` date and the snapshot
date. Only postings still returned as live are counted.

**Agency detection.** Keyword match against known recruitment-agency
name patterns. Imperfect by construction, see Limitations.

**Skill extraction.** A curated dictionary of [N] terms, not an LLM, so
results are reproducible and every match points at a specific string.
See `src/matcher.py`.

## Validation

This is the part most portfolio projects skip, so here are the numbers.

| Check | Result |
|---|---|
| Duplicate rate removed | **[X]%** |
| Quality-rule quarantine rate | **[X]%** |
| Skill matcher precision | **[P]** |
| Skill matcher recall | **[R]** |
| Postings with truncated descriptions | **[X]%** |
| Postings with a stated salary | **[N]** |

Matcher precision and recall were measured against **100 postings
labelled by hand**. The labelled sample is in `tests/`.

A deliberately corrupted record (salary of 9,999,999, date of 2019) is
injected on every run to prove the quality gate actually fires:

![quality gate catching a bad record](assets/quality_gate.png)

## Limitations

- **Postings are not hires.** An old posting may be a genuinely unfilled
  role, a pipeline-building advert, or a listing nobody took down. This
  measures advertising behaviour, not hiring outcomes.
- **One aggregator is not the whole market.** Adzuna indexes many German
  boards but not all of them, and coverage varies by employer size.
- **The API truncates descriptions** to roughly 450 characters. Skill
  counts therefore measure *mentioned in the title or opening
  paragraph*, which is a floor, not a true requirement count. They are
  labelled as such everywhere they appear.
- **Salary data is almost entirely absent** from the German index, so no
  salary analysis is published here.
- **Agency detection is keyword based** and will miss agencies with
  neutral names.
- **Reposts are detected by content hash.** Genuinely distinct roles
  with identical wording would be incorrectly merged.

## Running it

1. Register at `developer.adzuna.com` for an `app_id` and `app_key`.
2. Create a Databricks workspace (Free Edition is enough).
3. Create the catalog and volumes:

   ```sql
   CREATE CATALOG IF NOT EXISTS jobs;
   CREATE SCHEMA  IF NOT EXISTS jobs.bronze;
   CREATE SCHEMA  IF NOT EXISTS jobs.silver;
   CREATE SCHEMA  IF NOT EXISTS jobs.gold;
   CREATE VOLUME  IF NOT EXISTS jobs.bronze.raw;
   CREATE VOLUME  IF NOT EXISTS jobs.bronze.conf;
   CREATE VOLUME  IF NOT EXISTS jobs.bronze.checkpoints;
   ```

4. Store credentials outside the repo:

   ```bash
   databricks secrets create-scope jobs
   databricks secrets put-secret jobs adzuna_app_id  --string-value "..."
   databricks secrets put-secret jobs adzuna_app_key --string-value "..."
   databricks secrets put-secret jobs github_token   --string-value "..."
   ```

5. Import `notebooks/` into the workspace and run 01 through 06 in order.
6. Chain them into a Databricks Workflow on a weekly schedule.

Local tests:

```bash
pip install -r requirements.txt
pytest tests/ -v
```

## Stack

Databricks (Free Edition) · Delta Lake · Auto Loader · Unity Catalog ·
PySpark · Databricks Workflows · GitHub Actions · GitHub Pages ·
Chart.js

## Licence

MIT. The underlying job data belongs to Adzuna and its source boards.
