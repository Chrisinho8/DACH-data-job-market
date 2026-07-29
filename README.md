# Whats up with the German data job market?

![tests](https://github.com/Chrisinho8/german-data-job-market/actions/workflows/tests.yml/badge.svg)

**2,514 live German data-job postings from 1,140 employers. The average
one has been open for 59 days. The median, 17. That gap is the finding:
half the market moves in under three weeks, while more than 1 in 4
postings has been sitting open for over two months.**

**[Live tracker](https://Chrisinho8.github.io/german-data-job-market/)**
- rebuilt automatically every Monday.

| | |
|---|---|
| Live postings | 2,514 |
| Employers | 1,140 |
| Median age | 17 days |
| Mean age | 59 days |
| Open > 30 days | 40.5% |
| Open > 60 days | 27.5% |
| Open > 90 days | 14.5% |
| Advertised in English | 33.4% |
| Disclosing a salary | 4.8% |
---

## Why this exists

Job boards show you what is *listed*, not what is *live*. A posting up
for 90 days is a very different signal from one posted yesterday, and
nothing on the board tells you which is which. This pipeline measures
it weekly.

## What the data says

- **The mean is misleading.** 59-day average, 17-day median. A long tail
  of very old listings drags the average up by a factor of three.
- **Two thirds of German data roles are advertised in German.** Only
  33.4% are in English, which matters if you are considering a move.
- **Almost nobody publishes pay.** 4.8% of postings state a salary,
  weeks after the EU pay transparency deadline.

## Architecture

```
Adzuna DE API
  -> raw JSON cached in a Unity Catalog volume
  -> Auto Loader (trigger availableNow)
  -> BRONZE   append-only, every snapshot preserved
  -> SILVER   parsed, deduplicated, quality-gated
  -> GOLD     aggregates + weekly history
  -> JSON committed to this repo
  -> GitHub Pages
```

One Databricks Workflow, weekly. Infrastructure cost: **EUR 0**.

Bronze keeps every weekly snapshot, so the whole history can be
reprocessed with better logic without re-calling the API.

## Method

**Source.** Adzuna DE public API, 13 role queries, national coverage,
deep pagination.

**Deduplication.** The same role is republished under new IDs
constantly. Postings are hashed on title, company, city and the first
200 characters of the description; the earliest listing is kept.

**Posting age.** Days between the API's `created` date and the snapshot
date, for postings still returned as live.

**Skill extraction.** A curated dictionary of 47 terms, not an LLM, so
results are reproducible and every match points at a specific string.
See `src/matcher.py`.

## Validation

| Check | Result |
|---|---|
| Quality-rule quarantine rate | 1.9% |
| Descriptions truncated by the API | 99.6% |
| Postings with a stated salary | 164 (4.8%) |
| Genuine repost rate | _pending_ |
| Skill matcher precision / recall | _pending_ |
| Matcher unit tests | 15, green in CI |

A deliberately corrupted record (salary of 9,999,999, date of 2019) is
injected on every run to prove the quality gate actually fires.

## Limitations

- **Postings are not hires.** An old posting may be a genuinely unfilled
  role, a pipeline-building advert, or a listing nobody took down. This
  measures advertising behaviour, not hiring outcomes.
- **One aggregator is not the whole market.** Adzuna indexes many German
  boards, not all of them, and coverage varies by employer size.
- **`created` is Adzuna's date**, which may be when it indexed the
  posting rather than when the employer published it.
- **Descriptions are hard-capped at 500 characters** and 99.6% are
  truncated. Skill counts therefore measure *mentioned in the title or
  opening paragraph*, which is a floor, not a requirement rate. The
  truncation window is identical for every posting, so relative
  comparisons between tools hold; absolute rates do not.
- **Salary data is almost entirely absent**, so no salary analysis is
  published beyond the disclosure rate itself.
- **Agency detection is keyword based** and currently flags only 5.4%,
  which is implausibly low. Treat it as a lower bound.
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
