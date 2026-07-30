# What's up with the data-job market in Austria/Germany/Switzerland?
 
![tests](https://github.com/Chrisinho8/DACH-data-job-market/actions/workflows/tests.yml/badge.svg)
 
A weekly snapshot of the DACH data-job market: 3,991 live postings across Germany, Austria and Switzerland, of which just 132 (3.3%) are advertised as junior. That is eleven senior openings for every junior one, and none at all for data architects or BI developers.
 
Every Monday at 06:00 a Databricks pipeline queries the Adzuna API for 15 job titles across all three countries, deduplicates and classifies the results through a bronze/silver/gold Delta Lake, scans each posting against a curated 47-term skills dictionary, and publishes the aggregates to a static site.
 
**[Open the live tracker](https://Chrisinho8.github.io/DACH-data-job-market/)** for maps, country comparisons and role breakdowns. (Last updated: 30/07/2026)
 
**This is not a job board.** It will not help you find a role and it does not link to or republish individual postings. It describes the *shape* of the market: how long roles stay open, how few are junior, which cities hire in English.
 
## What the data says
 
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


## Skill extraction
 
Postings are scanned with a curated dictionary of 47 terms rather than an LLM, so every match points at a specific string in a specific posting and the counts are reproducible. The tricky cases are real: "SQL" hides inside "PostgreSQL", "Java" inside "JavaScript", and a bare "R" matches "R&D" and half of every German address block. Each trap is pinned down by a test in `tests/test_matcher.py` that runs in CI on every push. See `src/matcher.py`.
 
## Where this goes
 
Bronze is append-only and `gold.history` is never overwritten, so every run adds to the record instead of replacing it. From the third snapshot a week-over-week chart appears; from the fourth, staleness can be measured by comparing snapshots directly rather than trusting the API's posting date. Given a few months it can answer whether AI/ML keeps taking share from data engineering, which tools are disappearing from postings, and whether junior openings are seasonal or simply absent. That needs Mondays, not new code. Every raw API response is cached, so improved classification logic can be applied to the whole history without spending an extra API call.
 
## Scope: what counts as a data job
 
**Kept:** data engineer, data analyst, data scientist, data architect, analytics engineer, DWH / ETL, data governance, data consultant, BI developer, and AI / ML engineering as its own family.
 
| Excluded | Why |
|---|---|
| German *Controlling*, FP&A, finance | Management accounting, a separate profession |
| Ausbildung, duales Studium, Werkstudent, Praktikum, Trainee | Education programmes, and they stay listed for months, distorting the age figures |
| Data **centre** infrastructure | False friend: "Data Center Engineering Operations" is physical infrastructure |
| General software, cloud and DevOps engineering | Not data roles, pulled in by keyword overlap |
| Speculative applications, parse artefacts | Not job postings at all |
 
Excluded rows are kept in `silver.excluded` so the decision stays auditable.
 
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
 
**Deduplication.** Postings are hashed on title, company, city and the first 200 characters of the description; the earliest listing is kept. Query overlap is counted separately from genuine reposts and is not published as a finding.
 
**Posting age.** Days between the API's `created` date and the snapshot date, for postings still returned as live.
 
**Location.** Taken from each posting's own location array. In the city-states (Berlin, Hamburg, Bremen, Vienna, Basel, Geneva) the third level is a district, so it is collapsed into the parent. Administrative wrappers (`(Kreis)`, `-Umgebung`, `-Land`, `Region ...`) are stripped.
 
## Limitations
 
- **Postings are not hires.** An old posting may be unfilled, a pipeline-building advert, or one nobody took down. This measures advertising behaviour, not hiring outcomes.
- **One aggregator is not the whole market**, and coverage is uneven. Austria and Switzerland have a few hundred postings each, so their figures are noisier than Germany's.
- **`created` is the aggregator's date**, possibly when it indexed the posting rather than when the employer published it.
- **Descriptions are hard-capped at 500 characters** and 99.5% are truncated. Tool counts measure *mentioned in the title or opening paragraph*, a floor rather than a requirement rate. The truncation window is identical for every posting, so comparisons between tools hold; absolute rates do not.
- **The AI / ML family includes software roles that merely mention AI**, which inflates it.
- **Roles and seniority are inferred from titles** with keyword rules, so both carry classification error. A role advertised without a seniority word counts as mid.
- **Entry programmes are excluded**, so the 3.3% junior figure covers junior-titled permanent roles only.
- **Agency detection is keyword based** and flags only 3.9%, almost certainly an undercount. Treat it as a lower bound.
- **5.3% of records are rejected by the quality rules** on each run and quarantined rather than silently dropped.
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
 
## Stack
 
Databricks Free Edition, Delta Lake, Auto Loader, Unity Catalog, PySpark, Databricks Workflows, GitHub Actions and Pages, Chart.js, SQL.
 
## Licence
 
MIT. The underlying job data belongs to Adzuna and its source boards.
