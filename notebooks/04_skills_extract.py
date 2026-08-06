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
# MAGIC
# MAGIC

# COMMAND ----------

CAT    = "jobs"
SILVER = f"{CAT}.silver"

from pyspark.sql import functions as F
from pyspark.sql.types import ArrayType, StringType
import re

# COMMAND ----------

# MAGIC %md ## The dictionary
# MAGIC

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


 # --- ML frameworks: how a model gets trained -----------------
 "pytorch":    {"cat": "ml_framework", "aliases": [r"\bpytorch\b"]},
 "tensorflow": {"cat": "ml_framework", "aliases": [r"\btensorflow\b"]},
 "keras":      {"cat": "ml_framework", "aliases": [r"\bkeras\b"]},
 "sklearn":    {"cat": "ml_framework", "aliases": [r"\bscikit-?learn\b",
                                                   r"\bsklearn\b"]},
 "xgboost":    {"cat": "ml_framework", "aliases": [r"\bxgboost\b",
                                                   r"\blightgbm\b",
                                                   r"\bcatboost\b"]},
 "jax":        {"cat": "ml_framework", "aliases": [r"\bjax\b"]},

 # --- MLOps: how a model reaches production -------------------
 # Kept separate from ml_framework because these are the skills
 # that separate "trained a model in a notebook" from "runs a
 # model as a service", and that gap is the whole MLOps story.
 "mlflow":     {"cat": "mlops",      "aliases": [r"\bmlflow\b"]},
 "kubeflow":   {"cat": "mlops",      "aliases": [r"\bkubeflow\b"]},
 "sagemaker":  {"cat": "mlops",      "aliases": [r"\bsagemaker\b",
                                                 r"\bsage maker\b"]},
 "vertexai":   {"cat": "mlops",      "aliases": [r"\bvertex ai\b",
                                                 r"\bvertex\b"]},
 "azureml":    {"cat": "mlops",      "aliases": [r"\bazure ml\b",
                                                 r"\bazure machine "
                                                 r"learning\b",
                                                 r"\bazure ai foundry\b"]},
 "ray":        {"cat": "mlops",      "aliases": [r"\bray serve\b",
                                                 r"\bray\.io\b",
                                                 r"\banyscale\b"]},
 "wandb":      {"cat": "mlops",      "aliases": [r"\bweights ?& ?biases\b",
                                                 r"\bwandb\b"]},
 "bentoml":    {"cat": "mlops",      "aliases": [r"\bbentoml\b",
                                                 r"\bseldon\b",
                                                 r"\btriton\b",
                                                 r"\bkserve\b"]},
 "featurestore": {"cat": "mlops",    "aliases": [r"\bfeature store\b",
                                                 r"\bfeast\b",
                                                 r"\btecton\b"]},

 # --- Generative AI -------------------------------------------
 # "llm" and "rag" used to be aliases of one skill, which made it
 # impossible to see whether DACH employers are asking for models
 # or for retrieval on top of them. They are now separate.
 "llm":        {"cat": "genai",      "aliases": [r"\bllms?\b",
                                                 r"\blarge language "
                                                 r"models?\b",
                                                 r"\bsprachmodell\w*\b",
                                                 r"\bfoundation models?\b"]},
 "genai":      {"cat": "genai",      "aliases": [r"\bgenai\b",
                                                 r"\bgen[\s\-]?ai\b",
                                                 r"\bgenerative ai\b",
                                                 r"\bgenerative ki\b"]},
 "rag":        {"cat": "genai",      "aliases": [r"\bretrieval[\s\-]"
                                                 r"augmented\w*\b",
                                                 r"\brag\b"]},
 "ai_agents":  {"cat": "genai",      "aliases": [r"\bagentic\b",
                                                 r"\bai agents?\b",
                                                 r"\bki[\s\-]agenten?\b",
                                                 r"\bmulti[\s\-]agent\b",
                                                 r"\bmcp\b"]},
 "prompting":  {"cat": "genai",      "aliases": [r"\bprompt[\s\-]?"
                                                 r"engineer\w*\b",
                                                 r"\bprompting\b"]},
 "langchain":  {"cat": "genai",      "aliases": [r"\blangchain\b",
                                                 r"\blanggraph\b",
                                                 r"\bllama[\s\-]?index\b",
                                                 r"\bsemantic kernel\b",
                                                 r"\bhaystack\b"]},
 "huggingface": {"cat": "genai",     "aliases": [r"\bhugging ?face\b",
                                                 r"\btransformers "
                                                 r"library\b"]},
 "openai_api": {"cat": "genai",      "aliases": [r"\bopenai\b",
                                                 r"\bgpt-?[45]\b",
                                                 r"\banthropic\b",
                                                 # not bare "Claude":
                                                 # it is a first name
                                                 # in Swiss postings
                                                 r"\bclaude (api|sonnet|"
                                                 r"opus|code)\b",
                                                 r"\bazure openai\b",
                                                 r"\bmistral\b",
                                                 r"\bgemini\b"]},
 "vectordb":   {"cat": "genai",      "aliases": [r"\bvector (db|"
                                                 r"database|store)\b",
                                                 r"\bvektordatenbank\b",
                                                 r"\bpinecone\b",
                                                 r"\bweaviate\b",
                                                 r"\bqdrant\b",
                                                 r"\bmilvus\b",
                                                 r"\bchroma\b",
                                                 r"\bpgvector\b",
                                                 r"\bfaiss\b"]},
 "finetuning": {"cat": "genai",      "aliases": [r"\bfine[\s\-]?tun\w*\b",
                                                 # LoRaWAN is an IoT
                                                 # radio protocol and
                                                 # shows up in DACH
                                                 # embedded postings
                                                 r"\blora\b(?!wan)",
                                                 r"\bpeft\b",
                                                 r"\brlhf\b",
                                                 r"\bembeddings?\b"]},
 "ai_eval":    {"cat": "genai",      "aliases": [r"\bllm[\s\-]?as[\s\-]?"
                                                 r"a[\s\-]?judge\b",
                                                 r"\bhallucination\w*\b",
                                                 r"\bguardrails?\b",
                                                 r"\bevals?\b",
                                                 r"\bai safety\b",
                                                 r"\bai alignment\b"]},

 # --- NLP and computer vision ---------------------------------
 "nlp":        {"cat": "nlp_cv",     "aliases": [r"\bnlp\b",
                                                 r"\bnatural language "
                                                 r"processing\b",
                                                 r"\bsprachverarbeitung\b",
                                                 r"\bspacy\b",
                                                 r"\bnltk\b"]},
 "cv":         {"cat": "nlp_cv",     "aliases": [r"\bcomputer vision\b",
                                                 r"\bbildverarbeitung\b",
                                                 r"\bbilderkennung\b",
                                                 r"\bopencv\b",
                                                 r"\byolo\b",
                                                 r"\bobject detection\b"]},
 "deeplearning": {"cat": "nlp_cv",   "aliases": [r"\bdeep learning\b",
                                                 r"\bneural network\w*\b",
                                                 r"\bneuronale netze\b",
                                                 r"\btransformer\b",
                                                 r"\bdiffusion model\w*\b"]},


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

# --- the AI additions, where the false-positive risk lives ------
ok &= check("LoRaWAN is not fine-tuning",
            "finetuning" not in extract("LoRaWAN Sensorik im Feld"))
ok &= check("LoRA is fine-tuning",
            "finetuning" in extract("LoRA fine-tuning of open models"))
ok &= check("Claude the first name is not a vendor",
            "openai_api" not in extract("Ansprechpartner: Claude Meier"))
ok &= check("Claude API is a vendor",
            "openai_api" in extract("Erfahrung mit der Claude API"))
ok &= check("rag and llm are now separate skills",
            set(extract("RAG pipelines on top of LLMs"))
            == {"rag", "llm"})
ok &= check("azure ml does not swallow the azure cloud skill",
            extract("Azure ML") == ["azureml"])
ok &= check("genai german spelling",
            "genai" in extract("Erfahrung mit generativer KI ist "
                               "ein Plus")
            or "genai" in extract("Generative KI Projekte"))
ok &= check("mlops stack parsed",
            set(extract("MLflow und Kubeflow auf Kubernetes"))
            == {"mlflow", "kubeflow", "kubernetes"})
ok &= check("vector db recognised",
            "vectordb" in extract("Wir nutzen pgvector fuer Suche"))
ok &= check("transformers library goes to huggingface not deep learning",
            "huggingface" in extract("Hugging Face transformers library"))

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