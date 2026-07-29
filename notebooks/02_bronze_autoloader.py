# Databricks notebook source
# MAGIC %md
# MAGIC # 02 - Bronze: Auto Loader
# MAGIC
# MAGIC Incrementally ingests the cached JSON files into Delta. Append only,
# MAGIC nothing cleaned, `_rescued_data` preserved.
# MAGIC
# MAGIC `trigger(availableNow=True)` processes everything waiting and then
# MAGIC **stops**. That is what keeps this inside the Free Edition compute
# MAGIC budget. A continuous stream would drain it overnight.

# COMMAND ----------

CAT    = "jobs"
BRONZE = f"{CAT}.bronze"
VOL    = f"/Volumes/{CAT}/bronze/raw"
CHK    = f"/Volumes/{CAT}/bronze/checkpoints"

from pyspark.sql import functions as F

# COMMAND ----------

# MAGIC %md ## Land the raw API responses

# COMMAND ----------

q = (spark.readStream
       .format("cloudFiles")
       .option("cloudFiles.format", "json")
       .option("cloudFiles.inferColumnTypes", "true")
       .option("cloudFiles.schemaLocation", f"{CHK}/schema")
       .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
       .option("multiLine", "true")
       .option("rescuedDataColumn", "_rescued_data")
       .load(VOL)
       .withColumn("source_file", F.col("_metadata.file_path"))
       .withColumn("ingest_ts", F.current_timestamp())
     .writeStream
       .option("checkpointLocation", f"{CHK}/bronze")
       .option("mergeSchema", "true")
       .trigger(availableNow=True)
       .toTable(f"{BRONZE}.responses_raw"))

q.awaitTermination()
print("bronze load complete")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Explode the results array
# MAGIC Each file is one API response containing up to 50 postings.

# COMMAND ----------

raw = spark.table(f"{BRONZE}.responses_raw")

# Filename encodes the query: role__city__pN__date.json
fname = F.element_at(F.split(F.col("source_file"), "/"), -1)
parts = F.split(F.regexp_replace(fname, r"\.json$", ""), "__")

flat = (raw
    .withColumn("query_role", F.regexp_replace(
        F.element_at(parts, 1), "-", " "))
    .withColumn("query_city", F.element_at(parts, 2))
    .withColumn("query_page", F.regexp_replace(
        F.element_at(parts, 3), "p", "").cast("int"))
    .withColumn("pull_date", F.to_date(F.element_at(parts, 4)))
    .withColumn("r", F.explode("results"))
    .select(
        "ingest_ts", "source_file", "_rescued_data",
        "query_role", "query_city", "query_page", "pull_date",
        F.col("r.*")))

(flat.write
     .mode("overwrite")
     .option("overwriteSchema", "true")
     .saveAsTable(f"{BRONZE}.postings_flat"))

print(f"{flat.count():,} raw posting rows")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Inspect what the API actually gave us
# MAGIC Run this before writing any silver logic. The schema is the contract,
# MAGIC and the contract here is thinner than the docs suggest.

# COMMAND ----------

spark.table(f"{BRONZE}.postings_flat").printSchema()

# COMMAND ----------

df = spark.table(f"{BRONZE}.postings_flat")
n = df.count()

cols = [c for c in df.columns if not c.startswith("_")]
rows = []
for c in cols:
    nn = df.filter(F.col(c).isNotNull()).count()
    rows.append((c, nn, round(100.0 * nn / n, 1)))

import pandas as pd
display(pd.DataFrame(rows, columns=["column", "non_null", "pct"])
          .sort_values("pct"))

# COMMAND ----------

# MAGIC %md
# MAGIC ### The two things to check here
# MAGIC 1. **`salary_min` / `salary_max` fill rate.** If it is near zero, every
# MAGIC    salary claim is off the table. Do not fight it, just drop that
# MAGIC    section and say so in the README.
# MAGIC 2. **`description` length.** The API truncates to roughly 450
# MAGIC    characters. Confirm below, then treat skill extraction as a
# MAGIC    supporting section with a stated limitation, not the headline.

# COMMAND ----------

display(df.select(
    F.count("*").alias("postings"),
    F.avg(F.length("description")).alias("avg_desc_chars"),
    F.max(F.length("description")).alias("max_desc_chars"),
    F.sum(F.when(F.col("description").endswith("…"), 1)
           .otherwise(0)).alias("truncated"),
    F.sum(F.when(F.col("salary_min").isNotNull(), 1)
           .otherwise(0)).alias("has_salary")))
