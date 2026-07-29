# Databricks notebook source
# MAGIC %md
# MAGIC # 03 - Silver: parse, normalise, deduplicate, validate
# MAGIC
# MAGIC This is where the two findings are created:
# MAGIC
# MAGIC - **`posting_id`** - the repost hash. Same job, new ID, is extremely
# MAGIC   common on job boards and nobody measures it.
# MAGIC - **`age_days`** - how long a live posting has already been live. This
# MAGIC   is the ghost-jobs signal.

# COMMAND ----------

CAT    = "jobs"
BRONZE = f"{CAT}.bronze"
SILVER = f"{CAT}.silver"

from pyspark.sql import functions as F
import datetime

b = spark.table(f"{BRONZE}.postings_flat")
SNAPSHOT = datetime.date.today().isoformat()

# COMMAND ----------

# MAGIC %md ## Helpers

# COMMAND ----------

def col_or_null(df, name, cast="string"):
    """Adzuna omits fields entirely on some records."""
    if name in df.columns:
        return F.col(name).cast(cast)
    return F.lit(None).cast(cast)


def fold(c):
    """Fold umlauts so grouping and joins behave."""
    c = F.lower(F.trim(c))
    for a, b_ in [("ä", "ae"), ("ö", "oe"),
                  ("ü", "ue"), ("ß", "ss")]:
        c = F.regexp_replace(c, a, b_)
    return c


# Recruitment agencies repost far more than direct employers.
AGENCY_RX = (r"(consulting|personal|recruit|staffing|hays|"
             r"randstad|michael page|robert half|experis|"
             r"gulp|solcom|amoria|darwin|huzzle|talent)")

# COMMAND ----------

# MAGIC %md ## Parse

# COMMAND ----------

s = (b
  # --- text -------------------------------------------------
  .withColumn("title_raw", F.trim(F.col("title")))
  .withColumn("title_norm", fold(F.col("title")))
  .withColumn("description",
              F.coalesce(F.col("description"), F.lit("")))
  .withColumn("desc_chars", F.length("description"))
  .withColumn("desc_truncated",
              F.col("description").endswith("…"))

  # --- company ----------------------------------------------
  .withColumn("company", F.trim(F.col("company.display_name")))
  .withColumn("company_norm", fold(F.col("company.display_name")))
  .withColumn("is_agency",
              F.col("company_norm").rlike(AGENCY_RX))

  # --- location ---------------------------------------------
  .withColumn("city_raw", F.col("location.display_name"))
  .withColumn("region", F.element_at(F.col("location.area"), 2))
  .withColumn("city", F.element_at(F.col("location.area"), -1))
  .withColumn("city", fold(F.col("city")))

  # --- category ---------------------------------------------
  .withColumn("category", F.col("category.label"))

  # --- optional fields --------------------------------------
  .withColumn("salary_min", col_or_null(b, "salary_min", "double"))
  .withColumn("salary_max", col_or_null(b, "salary_max", "double"))
  .withColumn("salary_is_predicted",
              col_or_null(b, "salary_is_predicted") == "1")
  .withColumn("contract_type", col_or_null(b, "contract_type"))
  .withColumn("contract_time", col_or_null(b, "contract_time"))

  # --- dates ------------------------------------------------
  .withColumn("created_ts", F.to_timestamp("created"))
  .withColumn("created_date", F.to_date("created_ts"))
  .withColumn("snapshot_date", F.lit(SNAPSHOT).cast("date"))
  .withColumn("age_days",
              F.datediff(F.col("snapshot_date"),
                         F.col("created_date")))

  # --- derived from the title -------------------------------
  .withColumn("seniority",
      F.when(F.col("title_norm").rlike(
          r"\b(senior|sr\.?|lead|principal|head|manager|"
          r"director|staff)\b"), "senior")
       .when(F.col("title_norm").rlike(
          r"\b(junior|jr\.?|entry|graduate|absolvent|"
          r"werkstudent|praktikum|intern|trainee|"
          r"einsteiger|ausbildung)\b"), "junior")
       .otherwise("mid"))

  .withColumn("role_family",
      F.when(F.col("title_norm").rlike(
          r"machine learning|\bml engineer|\bmlops"), "ml engineer")
       .when(F.col("title_norm").rlike(
          r"analytics engineer"), "analytics engineer")
       .when(F.col("title_norm").rlike(
          r"data engineer|dateningenieur"), "data engineer")
       .when(F.col("title_norm").rlike(
          r"data scientist|data science"), "data scientist")
       .when(F.col("title_norm").rlike(
          r"data analyst|datenanalyst|\bbi analyst"), "data analyst")
       .when(F.col("title_norm").rlike(
          r"\bbi\b|business intelligence|power bi|tableau"),
          "bi developer")
       .otherwise("other"))

  # German postings almost always carry (m/w/d) or similar
  .withColumn("gendered_tag",
      F.col("title_norm").rlike(r"\(?\s*[mwdfxa](\s*/\s*[mwdfxa]){1,3}"))

  .withColumn("language",
      F.when(F.col("description").rlike(
          r"\b(und|der|die|das|mit|für|Kenntnisse|Erfahrung|"
          r"Wir suchen|Deine|Ihre)\b"), "de")
       .otherwise("en"))

  # --- the repost hash --------------------------------------
  .withColumn("posting_id", F.sha2(F.concat_ws("|",
      F.lower(F.trim("title_raw")),
      F.lower(F.coalesce(F.col("company"), F.lit(""))),
      F.col("city"),
      F.substring(F.lower("description"), 1, 200)), 256))

  .withColumnRenamed("id", "adzuna_id")
)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Measure duplicates BEFORE dropping them
# MAGIC This number is a finding, not an implementation detail.

# COMMAND ----------

total  = s.count()
unique = s.select("posting_id").distinct().count()
by_id  = s.select("adzuna_id").distinct().count()

print(f"raw posting rows          : {total:,}")
print(f"unique adzuna_id          : {by_id:,}")
print(f"unique jobs after hashing : {unique:,}")
print(f"duplicate rate            : {1 - unique/total:.1%}")
print(f"reposts (same job, new id): {by_id - unique:,}")

# COMMAND ----------

# MAGIC %md ### Which employers repost the most

# COMMAND ----------

display(s.groupBy("posting_id", "company", "title_raw")
         .agg(F.countDistinct("adzuna_id").alias("n_listings"),
              F.min("created_date").alias("first_seen"),
              F.max("created_date").alias("last_seen"))
         .filter("n_listings > 1")
         .orderBy(F.desc("n_listings"))
         .limit(50))

# COMMAND ----------

# MAGIC %md ## Quality rules

# COMMAND ----------

RULES = {
    "title_present":
        "title_raw IS NOT NULL AND length(title_raw) > 3",
    "company_present":
        "company IS NOT NULL AND length(company) > 1",
    "city_present":
        "city IS NOT NULL",
    "date_plausible":
        "created_date IS NOT NULL "
        "AND created_date >= '2024-01-01' "
        "AND created_date <= current_date()",
    "age_non_negative":
        "age_days >= 0",
    "salary_sane":
        "salary_min IS NULL "
        "OR (salary_min BETWEEN 12000 AND 400000)",
    "salary_ordered":
        "salary_max IS NULL OR salary_min IS NULL "
        "OR salary_max >= salary_min",
}

for name, rule in RULES.items():
    n = s.filter(f"NOT ({rule})").count()
    flag = "  <-- check this" if n > total * 0.02 else ""
    print(f"{name:20} failed: {n:6,}{flag}")

# COMMAND ----------

from pyspark.sql import Window

cond = " AND ".join(f"({r})" for r in RULES.values())

# keep the EARLIEST listing of each job, so age_days measures
# how long the role has really been advertised
w = Window.partitionBy("posting_id").orderBy(F.asc("created_ts"))

clean = (s.filter(cond)
          .withColumn("rn", F.row_number().over(w))
          .filter("rn = 1").drop("rn"))

bad = s.filter(f"NOT ({cond})")

print(f"clean      : {clean.count():,}")
print(f"quarantined: {bad.count():,}")

# COMMAND ----------

KEEP = ["posting_id", "adzuna_id", "title_raw", "title_norm",
        "role_family", "seniority", "gendered_tag",
        "company", "company_norm", "is_agency",
        "city", "region", "category", "language",
        "description", "desc_chars", "desc_truncated",
        "salary_min", "salary_max", "salary_is_predicted",
        "contract_type", "contract_time",
        "created_date", "age_days", "snapshot_date",
        "query_role", "query_city", "ingest_ts"]

(clean.select(*KEEP).write.mode("overwrite")
      .option("overwriteSchema", "true")
      .saveAsTable(f"{SILVER}.postings"))

(bad.write.mode("overwrite")
    .option("overwriteSchema", "true")
    .saveAsTable(f"{SILVER}.quarantine"))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Break it on purpose
# MAGIC Run this once, screenshot the result for your README, then move on.
# MAGIC A demonstrated failure beats three paragraphs about "data quality".

# COMMAND ----------

demo = (spark.table(f"{SILVER}.postings").limit(1)
        .withColumn("salary_min", F.lit(9_999_999.0))
        .withColumn("created_date", F.lit("2019-01-01").cast("date")))

caught = demo.filter(f"NOT ({cond})").count()
print(f"deliberately broken records caught: {caught} of 1")
assert caught == 1, "quality rules did not catch the bad record"

# COMMAND ----------

# MAGIC %md ## The headline numbers

# COMMAND ----------

p = spark.table(f"{SILVER}.postings")

display(p.select(
    F.count("*").alias("live_postings"),
    F.round(F.avg("age_days"), 1).alias("avg_age_days"),
    F.expr("percentile_approx(age_days, 0.5)").alias("median_age"),
    F.round(100 * F.avg(
        F.when(F.col("age_days") > 30, 1).otherwise(0)), 1)
     .alias("pct_over_30d"),
    F.round(100 * F.avg(
        F.when(F.col("age_days") > 60, 1).otherwise(0)), 1)
     .alias("pct_over_60d"),
    F.round(100 * F.avg(
        F.when(F.col("is_agency"), 1).otherwise(0)), 1)
     .alias("pct_agency"),
))
