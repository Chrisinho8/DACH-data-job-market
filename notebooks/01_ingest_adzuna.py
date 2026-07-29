# Databricks notebook source
# MAGIC %md
# MAGIC # 01 - Ingest from the Adzuna DE API
# MAGIC
# MAGIC Pulls live German data-job postings and caches every raw response
# MAGIC verbatim to a Unity Catalog volume.
# MAGIC
# MAGIC **The cache is the point.** The free tier is roughly 1,000 calls per
# MAGIC month. Re-running this notebook costs zero extra calls for any query
# MAGIC already on disk.

# COMMAND ----------

# MAGIC %md ## Config

# COMMAND ----------

# If CREATE CATALOG was blocked on Free Edition, set CAT = "workspace"
# and the schemas become workspace.jobs_bronze etc.
CAT      = "jobs"
BRONZE   = f"{CAT}.bronze"
VOL      = f"/Volumes/{CAT}/bronze/raw"

BASE = "https://api.adzuna.com/v1/api/jobs/de/search"

ROLES = [
    "data engineer",
    "data analyst",
    "data scientist",
    "analytics engineer",
    "bi developer",
    "machine learning engineer",
]

CITIES = [
    "berlin", "muenchen", "hamburg", "frankfurt",
    "koeln", "stuttgart", "duesseldorf",
    "",                      # "" = nationwide
]

MAX_PAGES = 4                # 4 x 50 = up to 200 results per combo
                             # 6 roles x 8 cities x 4 = 192 calls max

# COMMAND ----------

# MAGIC %md ## Secrets
# MAGIC If the secret scope does not work on your edition, fall back to job
# MAGIC parameters. Never hardcode the key in this notebook.

# COMMAND ----------

try:
    APP_ID  = dbutils.secrets.get("jobs", "adzuna_app_id")
    APP_KEY = dbutils.secrets.get("jobs", "adzuna_app_key")
except Exception:
    dbutils.widgets.text("app_id", "")
    dbutils.widgets.text("app_key", "")
    APP_ID  = dbutils.widgets.get("app_id")
    APP_KEY = dbutils.widgets.get("app_key")

assert APP_ID and APP_KEY, "no Adzuna credentials available"

# COMMAND ----------

# MAGIC %md ## The pull

# COMMAND ----------

import json, time, pathlib, datetime, requests

TODAY = datetime.date.today().isoformat()
pathlib.Path(VOL).mkdir(parents=True, exist_ok=True)

calls_made = 0
cache_hits = 0


def slug(s):
    return (s or "nationwide").replace(" ", "-")


def fetch(role, city, page):
    """One page of results. Never pays for the same query twice."""
    global calls_made, cache_hits

    fname = f"{slug(role)}__{slug(city)}__p{page}__{TODAY}.json"
    path = pathlib.Path(VOL) / fname

    if path.exists():
        cache_hits += 1
        return json.loads(path.read_text())

    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "results_per_page": 50,
        "what": role,
        "where": city,
        "content-type": "application/json",
    }

    for attempt in range(5):
        r = requests.get(f"{BASE}/{page}", params=params, timeout=30)

        if r.status_code == 429:                 # rate limited
            wait = 2 ** attempt
            print(f"  429, sleeping {wait}s")
            time.sleep(wait)
            continue

        if r.status_code == 410:                 # page beyond the end
            return {"results": [], "count": 0}

        r.raise_for_status()
        path.write_text(r.text)                  # cache BEFORE parsing
        calls_made += 1
        time.sleep(1)                            # be polite
        return r.json()

    raise RuntimeError(f"gave up on {role}/{city}/p{page}")


# COMMAND ----------

summary = []

for role in ROLES:
    for city in CITIES:
        for page in range(1, MAX_PAGES + 1):
            data = fetch(role, city, page)
            n = len(data.get("results", []))
            total = data.get("count", 0)

            if page == 1:
                summary.append((role, city or "DE", total))
                print(f"{role:28} {city or 'DE':12} "
                      f"total={total:6} page1={n}")

            if n < 50:                # no further pages
                break

print(f"\nAPI calls made this run : {calls_made}")
print(f"Served from cache       : {cache_hits}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Quota check
# MAGIC Screenshot the output above for the README. Watching a real
# MAGIC operational constraint is what the job actually looks like.

# COMMAND ----------

import pandas as pd
display(pd.DataFrame(summary,
                     columns=["role", "city", "total_matches"])
          .sort_values("total_matches", ascending=False))

# COMMAND ----------

files = list(pathlib.Path(VOL).glob("*.json"))
print(f"{len(files)} raw files in the volume")
print(f"{sum(f.stat().st_size for f in files) / 1e6:.1f} MB")
