# Databricks notebook source
# MAGIC %md
# MAGIC # 02 - Bronze: Auto Loader
# MAGIC
# MAGIC Incrementally ingests the cached JSON into Delta. Append only,
# MAGIC nothing cleaned, `_rescued_data` preserved.
# MAGIC
# MAGIC

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

# filename: country__role__pN__YYYY-MM-DD.json
fname = F.element_at(F.split(F.col("source_file"), "/"), -1)
parts = F.split(F.regexp_replace(fname, r"\.json$", ""), "__")

flat = (raw
    .withColumn("country", F.element_at(parts, 1))
    .withColumn("query_role", F.regexp_replace(
        F.element_at(parts, 2), "-", " "))
    .withColumn("query_page", F.regexp_replace(
        F.element_at(parts, 3), "p", "").cast("int"))
    .withColumn("pull_date", F.to_date(F.element_at(parts, 4)))
    .withColumn("r", F.explode("results"))
    .select(
        "ingest_ts", "source_file", "_rescued_data",
        "country", "query_role", "query_page", "pull_date",
        F.col("r.*")))

(flat.write
     .mode("overwrite")
     .option("overwriteSchema", "true")
     .saveAsTable(f"{BRONZE}.postings_flat"))

print(f"{flat.count():,} raw posting rows")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Guard: did the filename parse work?
# MAGIC If any row has a country outside de/at/ch, a file is misnamed and
# MAGIC everything downstream will silently mislabel it.

# COMMAND ----------

bad = (spark.table(f"{BRONZE}.postings_flat")
            .filter(~F.col("country").isin("de", "at", "ch")))

n_bad = bad.count()
if n_bad:
    display(bad.select("country", "source_file").distinct())
assert n_bad == 0, f"{n_bad} rows with an unexpected country code"

display(spark.table(f"{BRONZE}.postings_flat")
             .groupBy("country", "pull_date")
             .agg(F.count("*").alias("rows"),
                  F.countDistinct("id").alias("unique_ids"))
             .orderBy("pull_date", "country"))