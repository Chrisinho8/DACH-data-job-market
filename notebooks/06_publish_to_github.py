# Databricks notebook source
# MAGIC %md
# MAGIC # 06 - Publish gold tables to GitHub
# MAGIC
# MAGIC Commits the gold tables as small JSON files into `docs/data/` in your
# MAGIC repo. GitHub Pages redeploys automatically, so the public site is
# MAGIC current within a couple of minutes of the job finishing.
# MAGIC
# MAGIC No servers, no hosting bill, nothing to maintain.

# COMMAND ----------

CAT  = "jobs"
GOLD = f"{CAT}.gold"

REPO = "YOURUSER/german-data-job-market"     # <-- change this

# COMMAND ----------

import json, base64, datetime, requests

TOKEN = dbutils.secrets.get("jobs", "github_token")
API   = f"https://api.github.com/repos/{REPO}/contents"
HEAD  = {"Authorization": f"Bearer {TOKEN}",
         "Accept": "application/vnd.github+json"}

STAMP = datetime.date.today().isoformat()

# COMMAND ----------

def commit_json(path, obj, message):
    """Create or update a file in the repo via the GitHub API."""
    body = json.dumps(obj, indent=1, ensure_ascii=False,
                      default=str)
    encoded = base64.b64encode(body.encode()).decode()

    r = requests.get(f"{API}/{path}", headers=HEAD, timeout=30)
    sha = r.json().get("sha") if r.status_code == 200 else None

    payload = {"message": message, "content": encoded}
    if sha:
        payload["sha"] = sha

    resp = requests.put(f"{API}/{path}", headers=HEAD,
                        json=payload, timeout=30)
    resp.raise_for_status()
    print(f"  committed {path}  ({len(body)/1024:.1f} KB)")


def records(table, limit=300):
    df = spark.table(table).limit(limit).toPandas()
    return json.loads(df.to_json(orient="records",
                                 date_format="iso"))


# COMMAND ----------

EXPORTS = [
    (f"{GOLD}.market_summary",    "market_summary",    10),
    (f"{GOLD}.age_distribution",  "age_distribution",  10),
    (f"{GOLD}.agency_comparison", "agency_comparison", 10),
    (f"{GOLD}.role_breakdown",    "role_breakdown",   100),
    (f"{GOLD}.city_breakdown",    "city_breakdown",    50),
    (f"{GOLD}.stale_by_company",  "stale_by_company",  40),
    (f"{GOLD}.skill_demand",      "skill_demand",      60),
    (f"{GOLD}.history",           "history",         5000),
]

for table, name, limit in EXPORTS:
    commit_json(f"docs/data/{name}.json",
                records(table, limit),
                f"data refresh {STAMP}: {name}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Metadata
# MAGIC Freshness and the validation numbers, shown on the site itself.
# MAGIC Update the matcher scores after you run the manual labelling.

# COMMAND ----------

summary = spark.table(f"{GOLD}.market_summary").first().asDict()
sil = spark.table(f"{CAT}.silver.postings")
qua = spark.table(f"{CAT}.silver.quarantine")

n_clean, n_quar = sil.count(), qua.count()

meta = {
    "updated":            STAMP,
    "live_postings":      int(summary["live_postings"]),
    "employers":          int(summary["employers"]),
    "avg_age_days":       float(summary["avg_age_days"]),
    "median_age_days":    float(summary["median_age_days"]),
    "pct_over_60d":       float(summary["pct_over_60d"]),
    "quarantined":        n_quar,
    "quarantine_rate":    round(n_quar / (n_clean + n_quar), 4),
    "matcher_precision":  None,   # <-- fill in after labelling
    "matcher_recall":     None,   # <-- fill in after labelling
    "desc_truncated_pct": round(100 * sil.filter(
        "desc_truncated").count() / max(n_clean, 1), 1),
}

commit_json("docs/data/meta.json", meta, f"meta {STAMP}")
print(json.dumps(meta, indent=2))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Done
# MAGIC Your site updates at
# MAGIC `https://YOURUSER.github.io/german-data-job-market/`
# MAGIC within about two minutes.
# MAGIC
# MAGIC Set this whole workflow to run **weekly, Monday 06:00 Europe/Berlin**.
# MAGIC Weekly, not daily: postings do not move fast enough to justify daily,
# MAGIC and daily would eat both your API quota and your compute allowance.
