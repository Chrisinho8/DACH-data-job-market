# Databricks notebook source
# MAGIC %md
# MAGIC # 01 - Ingest from the Adzuna API (DACH)
# MAGIC
# MAGIC Pulls live data-job postings for **Germany, Austria and
# MAGIC Switzerland** and caches every raw response verbatim to a Unity
# MAGIC Catalog volume.
# MAGIC
# MAGIC **The cache is the point.** The free tier is roughly 1,000 calls
# MAGIC per month across all countries. Re-running this notebook costs
# MAGIC zero extra calls for any query already on disk.
# MAGIC

# COMMAND ----------

# MAGIC %md ## Config

# COMMAND ----------

CAT    = "jobs"
BRONZE = f"{CAT}.bronze"
VOL    = f"/Volumes/{CAT}/bronze/raw"

BASE = "https://api.adzuna.com/v1/api/jobs"

COUNTRIES = ["de", "at", "ch"]

ROLES = [
    "data engineer",
    "data analyst",
    "data scientist",
    "analytics engineer",
    "bi developer",
    "machine learning engineer",
    "ai engineer",
    "data architect",
    "etl developer",
    "big data engineer",
    "mlops engineer",
    "data warehouse",
]

MAX_PAGES = 45         

# COMMAND ----------

# MAGIC %md ## Credentials
# MAGIC Stored in a Unity Catalog volume, outside the git repo. Never
# MAGIC hardcoded.

# COMMAND ----------

import json, pathlib

_c = json.loads(pathlib.Path(
    f"/Volumes/{CAT}/bronze/conf/adzuna.json").read_text())

APP_ID, APP_KEY = _c["app_id"], _c["app_key"]
assert APP_ID and APP_KEY, "credentials file is empty"

# COMMAND ----------

# MAGIC %md ## Verify the country endpoints
# MAGIC Three calls. Do this before the full pull.

# COMMAND ----------

import requests

for c in COUNTRIES:
    r = requests.get(
        f"{BASE}/{c}/search/1",
        params={"app_id": APP_ID, "app_key": APP_KEY,
                "results_per_page": 5, "what": "data engineer",
                "content-type": "application/json"}, timeout=30)
    print(f"{c}: HTTP {r.status_code}  "
          f"{r.json().get('count') if r.ok else r.text[:80]}")

# COMMAND ----------

# MAGIC %md ## The pull

# COMMAND ----------

import time, datetime

TODAY = datetime.date.today().isoformat()
pathlib.Path(VOL).mkdir(parents=True, exist_ok=True)

calls_made = 0
cache_hits = 0


def slug(s):
    return s.replace(" ", "-")


def fetch(country, role, page):
    global calls_made, cache_hits

    fname = f"{country}__{slug(role)}__p{page}__{TODAY}.json"
    path = pathlib.Path(VOL) / fname

    if path.exists():
        cache_hits += 1
        return json.loads(path.read_text())

    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "results_per_page": 50,
        "what": role,
        "content-type": "application/json",
    }

    for attempt in range(5):
        r = requests.get(f"{BASE}/{country}/search/{page}",
                         params=params, timeout=30)

        if r.status_code == 429:                 # rate limited
            wait = 2 ** attempt
            print(f"  429, sleeping {wait}s")
            time.sleep(wait)
            continue

        if r.status_code == 410:                 # past the last page
            return {"results": [], "count": 0}

        r.raise_for_status()
        path.write_text(r.text)                  # cache before parsing
        calls_made += 1
        time.sleep(1)                            # be polite
        return r.json()

    raise RuntimeError(f"gave up on {country}/{role}/p{page}")


# COMMAND ----------

summary = []

for country in COUNTRIES:
    for role in ROLES:
        for page in range(1, MAX_PAGES + 1):
            data  = fetch(country, role, page)
            n     = len(data.get("results", []))
            total = data.get("count", 0)

            if page == 1:
                summary.append((country, role, total))
                print(f"{country}  {role:28} "
                      f"total={total:6} page1={n}")

            if n < 50:                # end of this search
                break

print(f"\nAPI calls made this run : {calls_made}")
print(f"Served from cache       : {cache_hits}")