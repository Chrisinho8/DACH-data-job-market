# Databricks notebook source
# MAGIC %md
# MAGIC # 03 - Silver: parse, classify, deduplicate, validate
# MAGIC
# MAGIC ## Scope decisions encoded here
# MAGIC
# MAGIC The Adzuna `what=` parameter is a keyword search, not a title
# MAGIC match, so broad queries like "business intelligence" and
# MAGIC "ai engineer" drag in a lot of unrelated roles. Every posting is
# MAGIC therefore reclassified from its **actual job title**, and anything
# MAGIC that is not a data or AI role is excluded.
# MAGIC
# MAGIC | Group | Decision |
# MAGIC |---|---|
# MAGIC | Classic data roles | kept, split into families |
# MAGIC | AI / ML engineering | kept, own family |
# MAGIC | German *Controlling* / finance | excluded |
# MAGIC | Entry programmes (Ausbildung, duales Studium, Werkstudent, Praktikum, Trainee) | excluded |
# MAGIC | Data **centre** infrastructure | excluded, false friend |
# MAGIC | General software / cloud / DevOps | excluded |
# MAGIC | Speculative applications, parse artefacts | quarantined as invalid |
# MAGIC
# MAGIC Where a title names both data and AI, **data wins**, so
# MAGIC "Data & AI Consultant" is a data role, not an AI one.
# MAGIC
# MAGIC Excluded rows are written to `silver.excluded` so the decision is
# MAGIC auditable rather than invisible.

# COMMAND ----------

CAT      = "jobs"
BRONZE   = f"{CAT}.bronze"
SILVER   = f"{CAT}.silver"

from pyspark.sql import functions as F, Window
import datetime

SNAPSHOT = datetime.date.today().isoformat()

# COMMAND ----------

# MAGIC %md ## Load the latest snapshot only
# MAGIC Bronze appends every weekly run. Silver must represent
# MAGIC "what was live at the most recent pull", not a growing archive.

# COMMAND ----------

b = spark.table(f"{BRONZE}.postings_flat")

latest = b.agg(F.max("pull_date")).first()[0]
b = b.filter(F.col("pull_date") == latest)
print(f"using snapshot {latest}: {b.count():,} rows")

# COMMAND ----------

# MAGIC %md ## Helpers

# COMMAND ----------

def col_or_null(df, name, cast="string"):
    """Adzuna omits some fields entirely on some records."""
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


AGENCY_RX = (r"(consulting|personal|recruit|staffing|hays|"
             r"randstad|michael page|robert half|experis|"
             r"gulp|solcom|amoria|darwin|huzzle|talent)")

a2 = F.expr("try_element_at(location.area, 2)")
a3 = F.expr("try_element_at(location.area, 3)")

# COMMAND ----------

# MAGIC %md ## Classification patterns

# COMMAND ----------

INVALID = (r"^initiativbewerbung|initiativbewerbung|talentpool|"
           r"^deine aufgaben|^\"+title|^zum \d|^wachstum durch")

ENTRY = (r"\bausbildung\b|duales? studium|dualer bachelor|"
         r"\bwerkstudent|werkstudierend|\bpraktikum\b|\bpraktikant|"
         r"\btrainee\b|traineeprogramm|bachelor thesis|"
         r"master student|studienkolleg|bachelor of science|"
         r"\bdhbw\b|\bhwr\b|b\.\s?a\.\s+in\b|"
         r"^b\.\s?a\.|abschlussarbeit")

DATACENTRE = r"data\s*cent(er|re)|rechenzentrum|\bdceo\b"

FINANCE = (r"controlling|\bcontroller\b|finanzen|buchhalt|"
           r"\bfp&a\b|financial planning|finance transformation|"
           r"finance\s*&\s*accounting|finance business partner|"
           r"kaufmaennisch|vertriebscontrolling|"
           r"finance-consulting|finance solutions|"
           r"transaction advisory")

R_ARCHITECT = r"data\s+[\w\s\-&/]*architect|datenarchitekt"
R_ANALYTICS_ENG = r"analytics engineer"
R_ENGINEER = (r"data engineer|dateningenieur|\bbig data\b|"
              r"data platform|data scraping|data processing|"
              r"data\s*&\s*ai[\s\-]*engineer|"
              r"data\s+(migration|integration|pipeline)|"
              r"datenbankadministrator|database administrator|"
              r"\bdba\b")
R_DWH = (r"data warehouse|\bdwh\b|\betl\b|\bdbt\b|sap bw|"
         r"datasphere|data.?lake|data vault|data modeler|"
         r"data mesh|business data cloud")
R_GOVERNANCE = (r"data governance|data quality|data privacy|"
                r"master data|data steward|data management|"
                r"data strategy|data protection")
R_SCIENTIST = r"data scientist|data science"
R_ANALYST = r"data analyst|datenanalyst|\bbi analyst"
R_CONSULTANT = (r"data\s*&\s*ai|data and ai|data\s*&\s*analytics|"
                r"data analytics|data consultant|daten- und "
                r"prozessanalyse|\bdata expert\b|data insights|"
                r"\bit\s*&\s*data\b|business data")
R_BI = (r"\bbi\b|business intelligence|power ?bi|\btableau\b|"
        r"\bqlik\b|\bcelonis\b|sap analytics|process mining|"
        r"process intelligence|\bsac\b|reporting analyst|"
        r"\bjedox\b")

R_AIML = (r"mas?chine\s*learning|\bml engineer|\bmlops\b|"
          r"\bai/ml\b|deep learning|reinforcement learning|"
          r"foundation model|\bai\b|\bki\b|"
          r"artificial intelligence|\bgenai\b|generative ai|"
          r"\bllm\b|\bllmops\b|agentic|prompt engineer|"
          r"applied scientist|ai-native")

# COMMAND ----------

# MAGIC %md ## Parse and classify

# COMMAND ----------

CITY_STATES = ["berlin", "hamburg", "bremen", "wien",
               "basel-stadt", "genf", "geneve", "geneva"]

a2 = F.expr("try_element_at(location.area, 2)")
a3 = F.expr("try_element_at(location.area, 3)")

s = (b
    .withColumn("title_raw", F.trim(F.col("title")))
    .withColumn("title_norm", fold(F.col("title")))
    .withColumn("description",
                F.coalesce(F.col("description"), F.lit("")))
    .withColumn("desc_chars", F.length("description"))
    .withColumn("desc_truncated",
                F.col("description").endswith("…"))


    .withColumn("company", F.trim(F.col("company.display_name")))
    .withColumn("company_norm", fold(F.col("company")))
    .withColumn("is_agency",
                F.col("company_norm").rlike(AGENCY_RX))

    .withColumn("city_raw", F.col("location.display_name"))
    .withColumn("region", F.coalesce(fold(a2), F.lit("unknown")))
  

    .withColumn("city",
        F.when(fold(a2).isin(*CITY_STATES), fold(a2))
         .when(a3.isNotNull(), fold(a3))
         .otherwise(F.coalesce(fold(a2), F.lit("unknown"))))
    # "muenchen (kreis)" -> "muenchen"
    .withColumn("city",
        F.trim(F.regexp_replace(F.col("city"),
                                r"\s*\(.*?\)\s*$", "")))
    # "graz-umgebung" -> "graz", "linz-land" -> "linz"
    .withColumn("city",
        F.regexp_replace(F.col("city"),
                         r"[-\s](umgebung|umland|land|stadt)$", ""))
    # "region hannover" -> "hannover"
    .withColumn("city",
        F.regexp_replace(F.col("city"),
                         r"^(region|regionalverband)\s+", ""))
    # "freiburg im breisgau" -> "freiburg"
    # "bern-mittelland" -> "bern"
    .withColumn("city",
        F.regexp_replace(F.col("city"),
                         r"(\s+im\s+breisgau|-mittelland)$", ""))
    .withColumn("city",
        F.regexp_replace(F.col("city"), " am main$", ""))
    .withColumn("city", F.trim(F.col("city")))

    .withColumn("category", F.col("category.label"))

    .withColumn("salary_min", col_or_null(b, "salary_min", "double"))
    .withColumn("salary_max", col_or_null(b, "salary_max", "double"))
    .withColumn("salary_is_predicted",
                col_or_null(b, "salary_is_predicted") == "1")
    .withColumn("contract_type", col_or_null(b, "contract_type"))
    .withColumn("contract_time", col_or_null(b, "contract_time"))
    .withColumn("currency",
        F.when(F.col("country") == "ch", "CHF").otherwise("EUR"))

    .withColumn("created_ts", F.to_timestamp("created"))
    .withColumn("created_date", F.to_date("created_ts"))
    .withColumn("snapshot_date", F.lit(SNAPSHOT).cast("date"))
    .withColumn("age_days",
                F.datediff(F.col("snapshot_date"),
                           F.col("created_date")))

   
    .withColumn("seniority",
        F.when(F.col("title_norm").rlike(
            r"\b(senior|sr\.?|lead|principal|head|director|"
            r"staff|chief|\bvp\b)\b"), "senior")
         .when(F.col("title_norm").rlike(
            r"\b(junior|jr\.?|entry|graduate|absolvent|"
            r"einsteiger|associate)\b"), "junior")
         .otherwise("mid"))

    # --- role classification ----------------------------------
    # Order is deliberate:
    #   1. junk        -> invalid
    #   2. hard excludes that must beat every positive rule
    #   3. data families, most specific first
    #   4. AI / ML
    #   5. anything left -> other
    .withColumn("role_family",
        F.when(F.col("title_norm").rlike(INVALID), "invalid")

         .when(F.col("title_norm").rlike(ENTRY), "entry programme")
         .when(F.col("title_norm").rlike(DATACENTRE), "data centre")
         .when(F.col("title_norm").rlike(FINANCE), "finance")

         .when(F.col("title_norm").rlike(R_ARCHITECT),
               "data architect")
         .when(F.col("title_norm").rlike(R_ANALYTICS_ENG),
               "analytics engineer")
         .when(F.col("title_norm").rlike(R_ENGINEER),
               "data engineer")
         .when(F.col("title_norm").rlike(R_DWH), "dwh / etl")
         .when(F.col("title_norm").rlike(R_GOVERNANCE),
               "data governance")
         .when(F.col("title_norm").rlike(R_SCIENTIST),
               "data scientist")
         .when(F.col("title_norm").rlike(R_ANALYST), "data analyst")
         .when(F.col("title_norm").rlike(R_CONSULTANT),
               "data consultant")
         .when(F.col("title_norm").rlike(R_BI), "bi developer")

         .when(F.col("title_norm").rlike(R_AIML), "ai / ml")

         .otherwise("other"))

    .withColumn("gendered_tag",
        F.col("title_norm").rlike(
            r"\(?\s*[mwdfxa](\s*/\s*[mwdfxa]){1,3}"))

    .withColumn("language",
        F.when(F.col("description").rlike(
            r"\b(und|der|die|das|mit|für|Kenntnisse|Erfahrung|"
            r"Wir suchen|Deine|Ihre)\b"), "de")
         .otherwise("en"))

    .withColumn("posting_id", F.sha2(F.concat_ws("|",
        F.lower(F.trim("title_raw")),
        F.lower(F.coalesce(F.col("company"), F.lit(""))),
        F.col("city"),
        F.substring(F.lower("description"), 1, 200)), 256))

    .withColumnRenamed("id", "adzuna_id")
)

# COMMAND ----------

# MAGIC %md ## Duplicates
# MAGIC Two different numbers, and only the second is a finding.

# COMMAND ----------

total  = s.count()
by_id  = s.select("adzuna_id").distinct().count()
unique = s.select("posting_id").distinct().count()

print(f"raw posting rows      : {total:,}")
print(f"unique adzuna_id      : {by_id:,}")
print(f"unique after hashing  : {unique:,}")
print(f"query overlap         : {1 - by_id/total:.1%}  "
      f"(artefact of overlapping searches, do not publish)")
print(f"genuine repost rate   : {(by_id - unique)/by_id:.1%}  "
      f"(same job relisted under a new id)")

# COMMAND ----------

# MAGIC %md ## Quality rules

# COMMAND ----------

RULES = {
    "title_present":
        "title_raw IS NOT NULL AND length(title_raw) > 3",
    "not_invalid":
        "role_family <> 'invalid'",
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
    flag = "   <-- check" if n > total * 0.05 else ""
    print(f"{name:18} failed: {n:6,}{flag}")

# COMMAND ----------

cond = " AND ".join(f"({r})" for r in RULES.values())

# keep the EARLIEST listing of each job, so age_days measures how
# long the role has really been advertised
w = Window.partitionBy("posting_id").orderBy(F.asc("created_ts"))

passed = (s.filter(cond)
           .withColumn("rn", F.row_number().over(w))
           .filter("rn = 1").drop("rn"))

quarantine = s.filter(f"NOT ({cond})")

print(f"passed quality  : {passed.count():,}")
print(f"quarantined     : {quarantine.count():,}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Scope filter
# MAGIC Everything that is not a data or AI role is removed here, and
# MAGIC written to `silver.excluded` so the decision can be audited.

# COMMAND ----------

KEEP = ["data engineer", "data analyst", "data scientist",
        "data architect", "analytics engineer", "dwh / etl",
        "data governance", "data consultant", "bi developer",
        "ai / ml"]

clean    = passed.filter(F.col("role_family").isin(KEEP))
excluded = passed.filter(~F.col("role_family").isin(KEEP))

n_keep, n_drop = clean.count(), excluded.count()

print(f"kept     : {n_keep:,} data and AI roles")
print(f"excluded : {n_drop:,} "
      f"({n_drop / (n_keep + n_drop):.1%})")
print()
display(excluded.groupBy("role_family").count()
                .orderBy(F.desc("count")))

# COMMAND ----------

COLS = ["posting_id", "adzuna_id", "country", "title_raw",
        "title_norm", "role_family", "seniority", "gendered_tag",
        "company", "company_norm", "is_agency",
        "city", "city_raw", "region", "category", "language",
        "description", "desc_chars", "desc_truncated",
        "salary_min", "salary_max", "salary_is_predicted",
        "contract_type", "contract_time",
        "created_date", "age_days", "snapshot_date",
        "query_role", "ingest_ts"]

(clean.select(*COLS).write.mode("overwrite")
      .option("overwriteSchema", "true")
      .saveAsTable(f"{SILVER}.postings"))

(excluded.select(*COLS).write.mode("overwrite")
         .option("overwriteSchema", "true")
         .saveAsTable(f"{SILVER}.excluded"))

(quarantine.write.mode("overwrite")
           .option("overwriteSchema", "true")
           .saveAsTable(f"{SILVER}.quarantine"))

# COMMAND ----------

# MAGIC %md ## Headline numbers

# COMMAND ----------

p = spark.table(f"{SILVER}.postings")

display(p.select(
    F.count("*").alias("live_postings"),
    F.countDistinct("company").alias("employers"),
    F.round(F.avg("age_days"), 1).alias("avg_age_days"),
    F.expr("percentile_approx(age_days, 0.5)").alias("median_age"),
    F.round(100 * F.avg(
        F.when(F.col("age_days") > 30, 1).otherwise(0)), 1)
     .alias("pct_over_30d"),
    F.round(100 * F.avg(
        F.when(F.col("age_days") > 60, 1).otherwise(0)), 1)
     .alias("pct_over_60d"),
    F.round(100 * F.avg(
        F.when(F.col("age_days") > 90, 1).otherwise(0)), 1)
     .alias("pct_over_90d"),
    F.round(100 * F.avg(
        F.when(F.col("language") == "en", 1).otherwise(0)), 1)
     .alias("pct_english"),
    F.round(100 * F.avg(
        F.when(F.col("salary_min").isNotNull(), 1).otherwise(0)), 1)
     .alias("pct_with_salary"),
))

# COMMAND ----------

display(p.groupBy("role_family").count().orderBy(F.desc("count")))