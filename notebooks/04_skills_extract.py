# Databricks notebook source
# MAGIC %md
# MAGIC # 04 - Skill extraction 
# MAGIC
# MAGIC **Read this before you publish anything from this notebook.**
# MAGIC
# MAGIC The Adzuna API truncates descriptions to roughly 450 characters, and
# MAGIC what survives is the company intro, not the requirements list. So
# MAGIC these counts measure *"skills mentioned in the title or the first
# MAGIC paragraph"*, not *"skills required"*.
# MAGIC
# MAGIC That is still a legitimate measurement. It is not the measurement
# MAGIC people will assume you made, so you have to say which one it is,
# MAGIC every single time you show these numbers.
# MAGIC
# MAGIC ## Why a dictionary and not an LLM
# MAGIC 1. **Reproducibility** - identical results on every run.
# MAGIC 2. **Defensibility** - every match points at a specific string.
# MAGIC 3. **Cost** - you have no quota to spare.

# COMMAND ----------

CAT    = "jobs"
SILVER = f"{CAT}.silver"

from pyspark.sql import functions as F
from pyspark.sql.types import ArrayType, StringType
import re

# COMMAND ----------

# MAGIC %md ## The dictionary
# MAGIC Read 30 real postings and add what you actually see. This is a
# MAGIC starting point, not a finished artefact.

# COMMAND ----------

SKILLS = {
 "sql":        {"cat": "language",   "aliases": [r"\bsql\b"]},
 "python":     {"cat": "language",   "aliases": [r"\bpython\b"]},
 "scala":      {"cat": "language",   "aliases": [r"\bscala\b"]},
 "java":       {"cat": "language",   "aliases": [r"\bjava\b(?!script)"]},
 "javascript": {"cat": "language",   "aliases": [r"\bjavascript\b",
                                                 r"\btypescript\b"]},
 "php":        {"cat": "language",   "aliases": [r"\bphp\b"]},
 "r_lang":     {"cat": "language",   "aliases": [
                    r"(?<=[ ,/(])r(?=[ ,/)])"]},


 "spark":      {"cat": "processing", "aliases": [r"\bapache spark\b",
                                                 r"\bpyspark\b",
                                                 r"\bspark\b"]},
 "hadoop":     {"cat": "legacy",     "aliases": [r"\bhadoop\b",
                                                 r"\bhdfs\b",
                                                 r"\bmapreduce\b",
                                                 r"\bhive\b"]},
 "kafka":      {"cat": "streaming",  "aliases": [r"\bkafka\b"]},
 "flink":      {"cat": "streaming",  "aliases": [r"\bflink\b"]},


 "databricks": {"cat": "platform",   "aliases": [r"\bdatabricks\b"]},
 "snowflake":  {"cat": "warehouse",  "aliases": [r"\bsnowflake\b"]},
 "bigquery":   {"cat": "warehouse",  "aliases": [r"\bbigquery\b"]},
 "redshift":   {"cat": "warehouse",  "aliases": [r"\bredshift\b"]},
 "synapse":    {"cat": "warehouse",  "aliases": [r"\bsynapse\b"]},


 "airflow":    {"cat": "orchestr",   "aliases": [r"\bapache airflow\b",
                                                 r"\bairflow\b"]},
 "dbt":        {"cat": "transform",  "aliases": [r"\bdbt\b"]},
 "ssis":       {"cat": "legacy",     "aliases": [r"\bssis\b"]},
 "talend":     {"cat": "legacy",     "aliases": [r"\btalend\b"]},


 "postgres":   {"cat": "database",   "aliases": [r"\bpostgresql\b",
                                                 r"\bpostgres\b"]},
 "mysql":      {"cat": "database",   "aliases": [r"\bmysql\b"]},
 "mssql":      {"cat": "database",   "aliases": [r"\bsql server\b",
                                                 r"\bt-sql\b",
                                                 r"\bms sql\b"]},
 "oracle":     {"cat": "database",   "aliases": [r"\boracle\b"]},
 "mongodb":    {"cat": "database",   "aliases": [r"\bmongodb\b",
                                                 r"\bmongo\b"]},
 "elastic":    {"cat": "database",   "aliases": [r"\belasticsearch\b"]},


 "aws":        {"cat": "cloud",      "aliases": [r"\baws\b",
                                                 r"\bamazon web services\b"]},
 "azure":      {"cat": "cloud",      "aliases": [r"\bazure\b",
                                                 r"\bdata factory\b"]},
 "gcp":        {"cat": "cloud",      "aliases": [r"\bgcp\b",
                                                 r"\bgoogle cloud\b"]},


 "docker":     {"cat": "devops",     "aliases": [r"\bdocker\b"]},
 "kubernetes": {"cat": "devops",     "aliases": [r"\bkubernetes\b",
                                                 r"\bk8s\b"]},
 "terraform":  {"cat": "devops",     "aliases": [r"\bterraform\b"]},
 "git":        {"cat": "devops",     "aliases": [r"\bgithub\b",
                                                 r"\bgitlab\b",
                                                 r"\bgit\b"]},
 "cicd":       {"cat": "devops",     "aliases": [r"\bci/cd\b",
                                                 r"\bjenkins\b"]},


 "powerbi":    {"cat": "bi",         "aliases": [r"\bpower ?bi\b"]},
 "tableau":    {"cat": "bi",         "aliases": [r"\btableau\b"]},
 "looker":     {"cat": "bi",         "aliases": [r"\blooker\b"]},
 "qlik":       {"cat": "bi",         "aliases": [r"\bqlik\b"]},
 "excel":      {"cat": "bi",         "aliases": [r"\bexcel\b"]},


 "pytorch":    {"cat": "ml",         "aliases": [r"\bpytorch\b"]},
 "tensorflow": {"cat": "ml",         "aliases": [r"\btensorflow\b"]},
 "sklearn":    {"cat": "ml",         "aliases": [r"\bscikit-?learn\b",
                                                 r"\bsklearn\b"]},
 "llm":        {"cat": "ml",         "aliases": [r"\bllm\b",
                                                 r"\bgenai\b",
                                                 r"\bgenerative ai\b",
                                                 r"\brag\b"]},


 "sap":        {"cat": "enterprise", "aliases": [r"\bsap\b"]},
 "etl":        {"cat": "practice",   "aliases": [r"\betl\b", r"\belt\b"]},
 "datawarehouse": {"cat": "practice", "aliases": [
                    r"\bdata warehouse\b", r"\bdwh\b",
                    r"\bdata lakehouse\b", r"\bdata lake\b"]},
}

CATEGORY = {k: v["cat"] for k, v in SKILLS.items()}

# COMMAND ----------

# MAGIC %md ## The matcher
# MAGIC Longest alias first, then blank the matched span, so `sql` cannot
# MAGIC re-match inside `postgresql`.

# COMMAND ----------

PATTERNS = sorted(
    ((s, a) for s, d in SKILLS.items() for a in d["aliases"]),
    key=lambda p: -len(p[1]))

COMPILED = [(s, re.compile(a, re.I)) for s, a in PATTERNS]

# "R" alone is far too noisy in German text (R&D, R. Mueller,
# street names). Only accept it when the document looks like it
# is listing technologies.
R_CONTEXT = re.compile(
    r"(python|sql|statist|analys|sprachen|languages|matlab|sas)",
    re.I)


def extract(text):
    if not text:
        return []
    t, found = text.lower(), []
    for skill, rx in COMPILED:
        m = rx.search(t)
        if not m:
            continue
        if skill == "r_lang" and not R_CONTEXT.search(text):
            continue
        found.append(skill)
        t = (t[:m.start()]
             + " " * (m.end() - m.start())
             + t[m.end():])
    return sorted(set(found))


# COMMAND ----------

# MAGIC %md ## Tests 

# COMMAND ----------

def check(name, cond):
    print(f"{'PASS' if cond else 'FAIL'}  {name}")
    return cond

ok = True
ok &= check("sql not matched inside postgresql",
            extract("We use PostgreSQL daily") == ["postgres"])
ok &= check("java not matched inside javascript",
            "java" not in extract("Strong JavaScript skills"))
ok &= check("german posting parsed",
            set(extract("Kenntnisse in Python und Erfahrung "
                        "mit Apache Spark"))
            == {"python", "spark"})
ok &= check("R not matched in R&D",
            "r_lang" not in extract("Our R&D team in Berlin"))
ok &= check("R matched with tech context",
            "r_lang" in extract("Sprachen: Python, R, SQL"))
ok &= check("php+mysql from a real snippet",
            set(extract("Kernsystem (PHP / MySQL) und einen "
                        "modernen Node-Stack"))
            == {"php", "mysql"})

assert ok, "matcher tests failed, fix the dictionary first"

# COMMAND ----------

# MAGIC %md ## Apply

# COMMAND ----------

extract_udf = F.udf(extract, ArrayType(StringType()))

p = spark.table(f"{SILVER}.postings")

skills = (p
  .withColumn("text", F.concat_ws(" . ", "title_raw", "description"))
  .withColumn("skill", F.explode(extract_udf(F.col("text"))))
  .withColumn("skill_category",
              F.create_map(*[F.lit(x) for kv in CATEGORY.items()
                             for x in kv])[F.col("skill")])
  .select("posting_id", "skill", "skill_category",
          "role_family", "seniority", "city", "language",
          "is_agency", "age_days", "snapshot_date"))

(skills.write.mode("overwrite")
       .option("overwriteSchema", "true")
       .saveAsTable(f"{SILVER}.posting_skills"))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Coverage: the number that tells you how far to trust this
# MAGIC If a large share of postings yield zero skills, that is the
# MAGIC truncation showing. Report it openly rather than hiding it.

# COMMAND ----------

n_post = p.count()
with_skill = skills.select("posting_id").distinct().count()

print(f"postings                    : {n_post:,}")
print(f"postings with >=1 skill hit : {with_skill:,}")
print(f"coverage                    : {with_skill/n_post:.1%}")
print(f"avg skills per matched post : "
      f"{skills.count()/max(with_skill,1):.2f}")