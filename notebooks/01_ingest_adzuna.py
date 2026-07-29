# Databricks notebook source
# MAGIC %md
# MAGIC # 01 - Ingest from the Adzuna DE API
# MAGIC
# MAGIC Pulls live German data-job postings and caches every raw response
# MAGIC verbatim to a Unity Catalog volume.

# COMMAND ----------

# MAGIC %md ## Config

# COMMAND ----------


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
    "business intelligence",
    "machine learning engineer",
    "ai engineer",
    "data architect",
    "etl developer",
    "big data engineer",
    "mlops engineer",
    "data warehouse",
]
CITIES = [""]
MAX_PAGES = 45

d = fetch("data engineer", "", 30)
print(len(d.get("results", [])), "results")

MAX_PAGES = 8              

# COMMAND ----------

# MAGIC %md ## Secrets
# MAGIC If the secret scope does not work on your edition, fall back to job
# MAGIC parameters. Never hardcode the key in this notebook.

# COMMAND ----------

import json, pathlib

_c = json.loads(pathlib.Path(
    "/Volumes/jobs/bronze/conf/adzuna.json").read_text())

APP_ID, APP_KEY = _c["app_id"], _c["app_key"]
assert APP_ID and APP_KEY, "creds file is empty"

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

        if r.status_code == 410:              
            return {"results": [], "count": 0}

        r.raise_for_status()
        path.write_text(r.text)                  
        calls_made += 1
        time.sleep(1)                           
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

            if n < 50:                
                break

print(f"\nAPI calls made this run : {calls_made}")
print(f"Served from cache       : {cache_hits}")