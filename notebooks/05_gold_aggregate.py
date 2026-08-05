# Databricks notebook source
# MAGIC %md
# MAGIC # 05 - Gold: the tables that become the website
# MAGIC
# MAGIC Every table here is built only from fields the API actually fills
# MAGIC reliably: title, company, city, id, created date.

# COMMAND ----------

CAT    = "jobs"
SILVER = f"{CAT}.silver"
GOLD   = f"{CAT}.gold"

from pyspark.sql import functions as F
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {GOLD}")

p = spark.table(f"{SILVER}.postings")
p.createOrReplaceTempView("postings")
spark.table(f"{SILVER}.posting_skills") \
     .createOrReplaceTempView("posting_skills")

# COMMAND ----------

# MAGIC %md ## 1. Market summary - the headline numbers

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.market_summary AS
SELECT
  current_date()                              AS snapshot_date,
  COUNT(*)                                    AS live_postings,
  COUNT(DISTINCT company)                     AS employers,
  ROUND(AVG(age_days), 1)                     AS avg_age_days,
  percentile_approx(age_days, 0.5)            AS median_age_days,
  ROUND(100 * AVG(CASE WHEN age_days > 7  THEN 1 ELSE 0 END), 1)
                                              AS pct_over_7d,
  ROUND(100 * AVG(CASE WHEN age_days > 30 THEN 1 ELSE 0 END), 1)
                                              AS pct_over_30d,
  ROUND(100 * AVG(CASE WHEN age_days > 60 THEN 1 ELSE 0 END), 1)
                                              AS pct_over_60d,
  ROUND(100 * AVG(CASE WHEN age_days > 90 THEN 1 ELSE 0 END), 1)
                                              AS pct_over_90d,
  ROUND(100 * AVG(CASE WHEN is_agency THEN 1 ELSE 0 END), 1)
                                              AS pct_agency,
  ROUND(100 * AVG(CASE WHEN language = 'en' THEN 1 ELSE 0 END), 1)
                                              AS pct_english
FROM postings
""")

display(spark.table(f"{GOLD}.market_summary"))

# COMMAND ----------

# MAGIC %md ## 2. Age distribution - the main chart

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.age_distribution AS
SELECT
  bucket,
  sort_key,
  COUNT(*) AS n_postings,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM (
  SELECT CASE
    WHEN age_days <=  7 THEN '0-7 days'
    WHEN age_days <= 14 THEN '8-14 days'
    WHEN age_days <= 30 THEN '15-30 days'
    WHEN age_days <= 60 THEN '31-60 days'
    WHEN age_days <= 90 THEN '61-90 days'
    ELSE '90+ days' END AS bucket,
    CASE
    WHEN age_days <=  7 THEN 1
    WHEN age_days <= 14 THEN 2
    WHEN age_days <= 30 THEN 3
    WHEN age_days <= 60 THEN 4
    WHEN age_days <= 90 THEN 5
    ELSE 6 END AS sort_key
  FROM postings)
GROUP BY bucket, sort_key
ORDER BY sort_key
""")

display(spark.table(f"{GOLD}.age_distribution"))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Staleness by employer
# MAGIC Who is advertising roles that have been open for months.
# MAGIC Minimum 5 postings so one unlucky company is not the story.

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.stale_by_company AS
SELECT
  company,
  is_agency,
  COUNT(*)                          AS n_postings,
  ROUND(AVG(age_days), 1)           AS avg_age_days,
  MAX(age_days)                     AS oldest_days,
  ROUND(100 * AVG(CASE WHEN age_days > 60 THEN 1 ELSE 0 END), 1)
                                    AS pct_over_60d
FROM postings
GROUP BY company, is_agency
HAVING COUNT(*) >= 5
ORDER BY avg_age_days DESC
""")

display(spark.table(f"{GOLD}.stale_by_company").limit(30))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Agencies vs direct employers
# MAGIC A clean two-bar comparison, and usually a real difference.

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.agency_comparison AS
SELECT
  CASE WHEN is_agency THEN 'Recruitment agency'
       ELSE 'Direct employer' END        AS poster_type,
  COUNT(*)                               AS n_postings,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct,
  ROUND(AVG(age_days), 1)                AS avg_age_days,
  percentile_approx(age_days, 0.5)       AS median_age_days,
  ROUND(100 * AVG(CASE WHEN age_days > 60 THEN 1 ELSE 0 END), 1)
                                         AS pct_over_60d
FROM postings
GROUP BY is_agency
""")

display(spark.table(f"{GOLD}.agency_comparison"))

# COMMAND ----------

# MAGIC %md ## 5. Role and seniority breakdown

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.role_breakdown AS
SELECT
  role_family,
  seniority,
  COUNT(*)                     AS n_postings,
  ROUND(AVG(age_days), 1)      AS avg_age_days,
  percentile_approx(age_days, 0.5)          AS median_age_days,
  ROUND(100 * AVG(CASE WHEN age_days > 7  THEN 1 ELSE 0 END), 1)
                               AS pct_over_7d,
  ROUND(100 * AVG(CASE WHEN age_days > 30 THEN 1 ELSE 0 END), 1)
                               AS pct_over_30d,
  ROUND(100 * AVG(CASE WHEN age_days > 60 THEN 1 ELSE 0 END), 1)
                               AS pct_over_60d,
  ROUND(100 * AVG(CASE WHEN age_days > 90 THEN 1 ELSE 0 END), 1)
                               AS pct_over_90d,
  ROUND(100 * AVG(CASE WHEN language = 'en' THEN 1 ELSE 0 END), 1)
                               AS pct_english
FROM postings
WHERE role_family <> 'other'
GROUP BY role_family, seniority
ORDER BY n_postings DESC
""")

display(spark.table(f"{GOLD}.role_breakdown"))

# COMMAND ----------

# MAGIC %md
# MAGIC ### The junior question
# MAGIC Directly relevant to you, and to most of your audience.

# COMMAND ----------

display(spark.sql("""
SELECT seniority,
       COUNT(*) AS n,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct,
       ROUND(AVG(age_days), 1) AS avg_age_days
FROM postings
GROUP BY seniority
ORDER BY n DESC
"""))

# COMMAND ----------

# MAGIC %md ## 6. City breakdown

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.city_breakdown AS
SELECT
  country,
  city,
  COUNT(*)                                                AS n_postings,
  ROUND(AVG(age_days), 1)                                 AS avg_age_days,
  ROUND(100 * AVG(CASE WHEN language = 'en' THEN 1 ELSE 0 END), 1)
                                                          AS pct_english,
  ROUND(100 * AVG(CASE WHEN is_agency THEN 1 ELSE 0 END), 1)
                                                          AS pct_agency
FROM postings
GROUP BY country, city
ORDER BY n_postings DESC
""")

display(spark.table(f"{GOLD}.city_breakdown"))

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.city_role_breakdown AS
SELECT
  country,
  city,
  role_family,
  COUNT(*)                AS n_postings,
  ROUND(AVG(age_days), 1) AS avg_age_days
FROM postings
GROUP BY country, city, role_family
HAVING COUNT(*) >= 1
ORDER BY n_postings DESC
""")

print(spark.table(f"{GOLD}.city_role_breakdown").count(), "rows")
display(spark.table(f"{GOLD}.city_role_breakdown").limit(20))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7. Skill mentions 
# MAGIC Label every chart from this table as *"mentioned in title or first
# MAGIC paragraph"*. It is not the same as *"required"* and you must not let
# MAGIC a reader assume it is.

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.skill_demand AS
WITH total AS (SELECT COUNT(*) AS n FROM postings)
SELECT
  s.skill,
  MAX(s.skill_category)                        AS skill_category,
  COUNT(DISTINCT s.posting_id)                 AS n_postings,
  ROUND(100.0 * COUNT(DISTINCT s.posting_id)
        / MAX(t.n), 1)                         AS pct_postings,
  ROUND(AVG(s.age_days), 1)                    AS avg_age_days,
  current_date()                               AS snapshot_date
FROM posting_skills s CROSS JOIN total t
GROUP BY s.skill
ORDER BY n_postings DESC
""")

display(spark.table(f"{GOLD}.skill_demand").limit(40))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7b. The AI split
# MAGIC One table that answers "how much of this is really AI", with the
# MAGIC vague bucket separated out instead of folded in. The site reads
# MAGIC this to render the AI section, and the `pct_of_ai` column is the
# MAGIC one to quote, not the raw count.

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.ai_breakdown AS
WITH ai AS (
  SELECT * FROM postings WHERE role_group = 'ai'
), tot AS (
  SELECT COUNT(*) AS n_ai FROM ai
), allp AS (
  SELECT COUNT(*) AS n_all FROM postings
)
SELECT
  a.role_family,
  a.role_family = 'ai (other)'            AS is_unspecified,
  COUNT(*)                                AS n_postings,
  ROUND(100.0 * COUNT(*) / MAX(t.n_ai), 1)   AS pct_of_ai,
  ROUND(100.0 * COUNT(*) / MAX(p.n_all), 1)  AS pct_of_market,
  COUNT(DISTINCT a.company)               AS employers,
  ROUND(AVG(a.age_days), 1)               AS avg_age_days,
  percentile_approx(a.age_days, 0.5)      AS median_age_days,
  ROUND(100 * AVG(CASE WHEN a.age_days > 60 THEN 1 ELSE 0 END), 1)
                                          AS pct_over_60d,
  ROUND(100 * AVG(CASE WHEN a.seniority = 'junior' THEN 1 ELSE 0 END), 1)
                                          AS pct_junior,
  ROUND(100 * AVG(CASE WHEN a.language = 'en' THEN 1 ELSE 0 END), 1)
                                          AS pct_english,
  ROUND(100 * AVG(CASE WHEN a.is_agency THEN 1 ELSE 0 END), 1)
                                          AS pct_agency,
  current_date()                          AS snapshot_date
FROM ai a CROSS JOIN tot t CROSS JOIN allp p
GROUP BY a.role_family
ORDER BY n_postings DESC
""")

display(spark.table(f"{GOLD}.ai_breakdown"))

# COMMAND ----------

# MAGIC %md
# MAGIC ### Gate: do not publish a per-family AI finding on thin cells
# MAGIC A family with under 50 postings cannot carry a per-city or
# MAGIC per-seniority claim. This does not stop the run, it prints the
# MAGIC list so you know which bars on the site are decoration.

# COMMAND ----------

thin = spark.sql(f"""
SELECT role_family, n_postings FROM {GOLD}.ai_breakdown
WHERE n_postings < 50 ORDER BY n_postings
""").collect()

if thin:
    print("thin AI families, do not slice these further:")
    for r in thin:
        print(f"  {r.role_family:16} {r.n_postings:5,}")
else:
    print("every AI family has >= 50 postings")

vague = spark.sql(f"""
SELECT pct_of_ai FROM {GOLD}.ai_breakdown
WHERE role_family = 'ai (other)'
""").collect()
if vague and vague[0].pct_of_ai > 35:
    print(f"\nWARNING: {vague[0].pct_of_ai}% of AI postings are "
          f"unspecified. Widen the rules in 03 before treating the "
          f"named families as a complete picture.")

# COMMAND ----------

# MAGIC %md
# MAGIC ### Which tools each AI family actually asks for
# MAGIC The reason the skills dictionary was split four ways. If
# MAGIC "GenAI / LLM" and "ML Engineer" ask for the same tools, the role
# MAGIC split is cosmetic and you should say so.

# COMMAND ----------

spark.sql(f"""
CREATE OR REPLACE TABLE {GOLD}.ai_skill_by_family AS
WITH base AS (
  SELECT s.*, p.role_group
  FROM posting_skills s
  JOIN postings p USING (posting_id)
  WHERE p.role_group = 'ai'
), fam AS (
  SELECT role_family, COUNT(DISTINCT posting_id) AS n_fam
  FROM base GROUP BY role_family
)
SELECT
  b.role_family,
  b.skill,
  MAX(b.skill_category)                       AS skill_category,
  COUNT(DISTINCT b.posting_id)                AS n_postings,
  ROUND(100.0 * COUNT(DISTINCT b.posting_id)
        / MAX(f.n_fam), 1)                    AS pct_of_family,
  current_date()                              AS snapshot_date
FROM base b JOIN fam f USING (role_family)
WHERE f.n_fam >= 50          -- thin families would be noise
GROUP BY b.role_family, b.skill
HAVING COUNT(DISTINCT b.posting_id) >= 3
ORDER BY b.role_family, n_postings DESC
""")

display(spark.table(f"{GOLD}.ai_skill_by_family"))

# COMMAND ----------

# MAGIC %md ## 8. History - what makes the site improve every week

# COMMAND ----------

spark.sql(f"""
CREATE TABLE IF NOT EXISTS {GOLD}.history (
  snapshot_date   DATE,
  metric          STRING,
  dimension       STRING,
  value           DOUBLE
)
""")

today = spark.sql("SELECT current_date()").first()[0]
spark.sql(f"DELETE FROM {GOLD}.history "
          f"WHERE snapshot_date = '{today}'")   # idempotent re-runs

spark.sql(f"""
INSERT INTO {GOLD}.history
SELECT snapshot_date, 'live_postings', 'all',
       CAST(live_postings AS DOUBLE) FROM {GOLD}.market_summary
UNION ALL
SELECT snapshot_date, 'avg_age_days', 'all',
       avg_age_days FROM {GOLD}.market_summary
UNION ALL
SELECT snapshot_date, 'pct_over_60d', 'all',
       pct_over_60d FROM {GOLD}.market_summary
UNION ALL
SELECT snapshot_date, 'skill_pct', skill,
       pct_postings FROM {GOLD}.skill_demand
UNION ALL
SELECT current_date(), 'role_count', role_family,
       CAST(SUM(n_postings) AS DOUBLE)
FROM {GOLD}.role_breakdown GROUP BY role_family
UNION ALL
-- the AI split over time. 'ai_share_of_market' is the honest headline;
-- 'ai_unspecified_pct' is the number that says how much to trust it.
SELECT current_date(), 'ai_family_pct', role_family, pct_of_ai
FROM {GOLD}.ai_breakdown
UNION ALL
SELECT current_date(), 'ai_share_of_market', 'all',
       CAST(SUM(pct_of_market) AS DOUBLE) FROM {GOLD}.ai_breakdown
UNION ALL
SELECT current_date(), 'ai_unspecified_pct', 'all', pct_of_ai
FROM {GOLD}.ai_breakdown WHERE role_family = 'ai (other)'
""")

display(spark.sql(f"""
SELECT snapshot_date, COUNT(*) AS rows_written
FROM {GOLD}.history GROUP BY snapshot_date ORDER BY 1
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Validation gate
# MAGIC The publish task must not run if any of this fails.

# COMMAND ----------

n = p.count()
assert n > 500, f"only {n} postings, refusing to publish"

q = spark.table(f"{SILVER}.quarantine").count()
assert q / (n + q) < 0.10, f"quarantine rate {q/(n+q):.1%} too high"

age_max = p.agg(F.max("age_days")).first()[0]
assert age_max < 2000, "implausible age, check date parsing"

print(f"validation passed: {n:,} postings, {q:,} quarantined")

# COMMAND ----------

# MAGIC %sql
# MAGIC -- 1. add country to city_breakdown
# MAGIC CREATE OR REPLACE TABLE jobs.gold.city_breakdown AS
# MAGIC SELECT country, city,
# MAGIC        COUNT(*) AS n_postings,
# MAGIC        ROUND(AVG(age_days), 1) AS avg_age_days,
# MAGIC        ROUND(100 * AVG(CASE WHEN language='en' THEN 1 ELSE 0 END), 1)
# MAGIC          AS pct_english,
# MAGIC        ROUND(100 * AVG(CASE WHEN is_agency THEN 1 ELSE 0 END), 1)
# MAGIC          AS pct_agency
# MAGIC FROM postings
# MAGIC GROUP BY country, city
# MAGIC ORDER BY n_postings DESC;
# MAGIC
# MAGIC
# MAGIC

# COMMAND ----------

# MAGIC %sql
# MAGIC
# MAGIC -- 2. add country and role_group to role_breakdown
# MAGIC --    role_group is 'data' or 'ai'. It exists so a chart can roll
# MAGIC --    the seven AI families back up to one bar without anyone
# MAGIC --    hardcoding the seven names again.
# MAGIC CREATE OR REPLACE TABLE jobs.gold.role_breakdown AS
# MAGIC SELECT country, role_group, role_family, seniority,
# MAGIC        COUNT(*) AS n_postings,
# MAGIC        ROUND(AVG(age_days), 1) AS avg_age_days,
# MAGIC        percentile_approx(age_days, 0.5) AS median_age_days,
# MAGIC        ROUND(100*AVG(CASE WHEN age_days>7  THEN 1 ELSE 0 END),1)
# MAGIC          AS pct_over_7d,
# MAGIC        ROUND(100*AVG(CASE WHEN age_days>30 THEN 1 ELSE 0 END),1)
# MAGIC          AS pct_over_30d,
# MAGIC        ROUND(100*AVG(CASE WHEN age_days>60 THEN 1 ELSE 0 END),1)
# MAGIC          AS pct_over_60d,
# MAGIC        ROUND(100*AVG(CASE WHEN age_days>90 THEN 1 ELSE 0 END),1)
# MAGIC          AS pct_over_90d,
# MAGIC        ROUND(100 * AVG(CASE WHEN language='en' THEN 1 ELSE 0 END), 1)
# MAGIC          AS pct_english
# MAGIC FROM postings
# MAGIC GROUP BY country, role_group, role_family, seniority
# MAGIC ORDER BY n_postings DESC;
# MAGIC
# MAGIC

# COMMAND ----------

# MAGIC %sql
# MAGIC
# MAGIC
# MAGIC CREATE OR REPLACE TABLE jobs.gold.country_breakdown AS
# MAGIC SELECT
# MAGIC   country,
# MAGIC   COUNT(*)                                    AS n_postings,
# MAGIC   COUNT(DISTINCT company)                     AS employers,
# MAGIC   ROUND(AVG(age_days), 1)                     AS avg_age_days,
# MAGIC   percentile_approx(age_days, 0.5)            AS median_age_days,
# MAGIC   ROUND(100*AVG(CASE WHEN age_days>30 THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_over_30d,
# MAGIC   ROUND(100*AVG(CASE WHEN age_days>60 THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_over_60d,
# MAGIC   ROUND(100*AVG(CASE WHEN age_days>90 THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_over_90d,
# MAGIC   ROUND(100*AVG(CASE WHEN language='en' THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_english,
# MAGIC   ROUND(100*AVG(CASE WHEN salary_min IS NOT NULL THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_with_salary,
# MAGIC   ROUND(100*AVG(CASE WHEN is_agency THEN 1 ELSE 0 END),1)
# MAGIC     AS pct_agency
# MAGIC FROM jobs.silver.postings
# MAGIC GROUP BY country
# MAGIC ORDER BY n_postings DESC;
# MAGIC
# MAGIC SELECT * FROM jobs.gold.country_breakdown;