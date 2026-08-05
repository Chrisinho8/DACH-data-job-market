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
# MAGIC | AI / ML roles | kept, split into **seven** families, see below |
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
# MAGIC
# MAGIC ## Why AI was split
# MAGIC
# MAGIC A single `ai / ml` bucket was the largest family on the site and
# MAGIC also the least trustworthy one, because the rule ended in a bare
# MAGIC `\bai\b|\bki\b` catch-all. Any title containing "AI" landed in it,
# MAGIC including plain software engineering roles. The old caveat said so
# MAGIC out loud, which is not a fix.
# MAGIC
# MAGIC It is now seven families, tested most specific first:
# MAGIC
# MAGIC | Family | What it means |
# MAGIC |---|---|
# MAGIC | `genai / llm` | LLM, RAG, agentic, prompt, foundation models |
# MAGIC | `mlops` | ML platform, ML infrastructure, model serving |
# MAGIC | `ml engineer` | classic ML, deep learning, CV, NLP |
# MAGIC | `ai research` | applied / research scientist, research engineer |
# MAGIC | `ai consultant` | AI consulting, architecture, strategy, product |
# MAGIC | `ai engineer` | title says exactly "AI Engineer" / "KI-Entwickler" |
# MAGIC | `ai (other)` | mentions AI, says nothing about what the job is |
# MAGIC
# MAGIC `ai (other)` is deliberately kept and published rather than hidden.
# MAGIC Its size **is** the finding: it measures how much DACH "AI hiring"
# MAGIC is a keyword on a job advert rather than a described role. Sum the
# MAGIC seven families to reproduce the old single number.

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

# --- AI, split seven ways -------------------------------------
# Applied in this order: research, genai, mlops, ml, consultant,
# engineer, other. A title matching more than one lands in the FIRST
# that hits, so the specific rules must come before the vague ones.
# Nothing here contains a bare \bai\b except R_AI_OTHER, which is the
# last rule on purpose.

# Generative AI. The word "generative"/"gen" carries the meaning, so
# do not let a bare "model" or "agent" in here: "agent" alone is an
# insurance job in German postings.
R_GENAI = (r"\bgenai\b|\bgen[\s\-]?ai\b|generative ai|generative ki|"
           r"\bllms?\b|\bllmops\b|large language model|"
           r"sprachmodell|foundation model|grundlagenmodell|"
           r"\brag\b|retrieval[\s\-]augmented|"
           r"prompt[\s\-]?engineer|agentic|\bai agent|\bki[\s\-]agent|"
           r"conversational ai|chatbot engineer|"
           r"\bai[\s\-]native|copilot engineer")

# Operating and serving models, not building them.
R_MLOPS = (r"\bmlops\b|\bml[\s\-]?ops\b|\bmodel ops\b|"
           r"ml[\s\-](platform|infrastructure|infra|engineer[\s\-]platform)|"
           r"machine learning (platform|infrastructure|infra|operations)|"
           r"model (serving|deployment|monitoring)|"
           r"\bai (platform|infrastructure|infra)\b|"
           r"\bki[\s\-]plattform\b|feature store")

# Classic ML including deep learning, CV and NLP.
R_ML = (r"mas?chine\s*learning|\bml[\s\-]?engineer|\bml[\s\-]?ingenieur|"
        r"maschinelles lernen|deep learning|\bdl engineer\b|"
        r"reinforcement learning|bestaerkendes lernen|"
        r"computer vision|bildverarbeitung|bilderkennung|"
        r"\bnlp\b|natural language processing|"
        r"sprachverarbeitung|speech recognition|spracherkennung|"
        r"\bai/ml\b|\bai\s*&\s*ml\b|recommender|"
        r"predictive model|forecasting engineer")

# People paid to publish or prototype, not to ship a service.
R_AI_RESEARCH = (r"applied scientist|research scientist|"
                 r"research engineer|forschungsingenieur|"
                 r"\bai research|\bki[\s\-]forsch|"
                 r"machine learning (researcher|scientist)|"
                 r"\bphd\b.*\b(ai|ml)\b")

# Advisory, architecture, strategy and product, not implementation.
R_AI_CONSULT = (r"\bai\s+(consultant|consulting|architect|advisor|"
                r"strategy|strateg|transformation|solution|"
                r"presales|sales engineer|product manager|"
                r"product owner|governance|ethics|compliance)|"
                r"\bki[\s\-]?(berater|architekt|strategie|"
                r"transformation)|"
                r"artificial intelligence (consultant|architect|"
                r"strategy|advisor)|"
                r"(consultant|architect|berater)\s+(fuer\s+)?"
                r"(ai|ki|artificial intelligence)\b")

# The title literally says "AI Engineer" / "KI-Entwickler" and no more.
# A real and growing job family in DACH, but a vague one, so it is
# reported separately rather than folded into ML engineering.
R_AI_ENGINEER = (r"\bai\s*[\-/]?\s*(engineer|developer|entwickler|"
                 r"specialist|spezialist|expert)|"
                 r"\bki\s*[\-/]?\s*(engineer|developer|entwickler|"
                 r"spezialist|experte)|"
                 r"artificial intelligence engineer|"
                 r"\bai software engineer\b")

# Last resort. Mentions AI, tells you nothing else. Published as its
# own family so the reader can see how large it is.
R_AI_OTHER = (r"\bai\b|\bki\b|artificial intelligence|"
              r"kuenstliche intelligenz")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Classifier tests
# MAGIC The seven AI rules overlap by design, so the *order* is the
# MAGIC classifier. Ordering bugs are silent: a title still lands
# MAGIC somewhere, just in the wrong family. These run in plain Python
# MAGIC against the same regex strings Spark uses, and fail the notebook
# MAGIC before anything is written.

# COMMAND ----------

import re as _re

_ORDER = [
    ("invalid", INVALID), ("entry programme", ENTRY),
    ("data centre", DATACENTRE), ("finance", FINANCE),
    ("data architect", R_ARCHITECT),
    ("analytics engineer", R_ANALYTICS_ENG),
    ("data engineer", R_ENGINEER), ("dwh / etl", R_DWH),
    ("data governance", R_GOVERNANCE),
    ("data scientist", R_SCIENTIST), ("data analyst", R_ANALYST),
    ("data consultant", R_CONSULTANT), ("bi developer", R_BI),
    ("ai research", R_AI_RESEARCH), ("genai / llm", R_GENAI),
    ("mlops", R_MLOPS), ("ml engineer", R_ML),
    ("ai consultant", R_AI_CONSULT), ("ai engineer", R_AI_ENGINEER),
    ("ai (other)", R_AI_OTHER),
]


def _fold(s):
    s = s.lower().strip()
    for a, b_ in [("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")]:
        s = s.replace(a, b_)
    return s


def classify(title):
    """Mirror of the F.when() chain below. If you edit one, edit both."""
    n = _fold(title)
    for fam, rx in _ORDER:
        if _re.search(rx, n):
            return fam
    return "other"


CASES = [
    # the seven AI families
    ("Machine Learning Engineer (m/w/d)",    "ml engineer"),
    ("Senior ML Engineer - Computer Vision", "ml engineer"),
    ("Deep Learning Engineer",               "ml engineer"),
    ("NLP Engineer",                         "ml engineer"),
    ("MLOps Engineer",                       "mlops"),
    ("ML Platform Engineer (f/m/x)",         "mlops"),
    ("Model Deployment Engineer",            "mlops"),
    ("GenAI Engineer",                       "genai / llm"),
    ("LLM Engineer / RAG Specialist",        "genai / llm"),
    ("Prompt Engineer (Remote)",             "genai / llm"),
    ("Agentic AI Developer",                 "genai / llm"),
    ("Generative KI Spezialist",             "genai / llm"),
    ("Applied Scientist, Machine Learning",  "ai research"),
    ("AI Research Engineer",                 "ai research"),
    ("Research Scientist Deep Learning",     "ai research"),
    ("AI Consultant (m/w/d)",                "ai consultant"),
    ("KI-Berater Digitalisierung",           "ai consultant"),
    ("AI Solution Architect",                "ai consultant"),
    ("AI Product Manager",                   "ai consultant"),
    ("AI Engineer",                          "ai engineer"),
    ("KI-Entwickler (m/w/d)",                "ai engineer"),
    ("Artificial Intelligence Engineer",     "ai engineer"),
    ("AI Specialist",                        "ai engineer"),
    # the vague bucket: these are the ones that used to inflate ai / ml
    ("Software Engineer with AI focus",      "ai (other)"),
    ("Projektmanager KI",                    "ai (other)"),
    ("Fullstack Developer (AI Startup)",     "ai (other)"),
    # data still beats AI
    ("Data & AI Consultant",                 "data consultant"),
    ("Data Engineer AI Platform",            "data engineer"),
    ("Data Scientist NLP",                   "data scientist"),
    ("Senior Data Analyst",                  "data analyst"),
    ("Business Intelligence Developer",      "bi developer"),
    ("Analytics Engineer",                   "analytics engineer"),
    # excludes still beat everything
    ("Werkstudent AI Engineering",           "entry programme"),
    ("Controlling Specialist AI",            "finance"),
    ("Rechenzentrum Techniker",              "data centre"),
    ("Versicherungsagent",                   "other"),
]

fails = [(t, classify(t), e) for t, e in CASES if classify(t) != e]
for t, got, exp in fails:
    print(f"FAIL  {t!r} -> {got}, expected {exp}")
print(f"{len(CASES) - len(fails)}/{len(CASES)} classifier tests passed")
assert not fails, "classifier ordering is wrong, fix it before writing"

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
    #   4. AI families, most specific first, vague catch-all last
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

         # research first: it is the narrowest rule, and it is a
         # separate hiring track. "Applied Scientist, Machine
         # Learning" is a research job, not an ML engineering one,
         # so it must not be caught by R_ML.
         .when(F.col("title_norm").rlike(R_AI_RESEARCH), "ai research")
         .when(F.col("title_norm").rlike(R_GENAI), "genai / llm")
         .when(F.col("title_norm").rlike(R_MLOPS), "mlops")
         .when(F.col("title_norm").rlike(R_ML), "ml engineer")
         .when(F.col("title_norm").rlike(R_AI_CONSULT), "ai consultant")
         .when(F.col("title_norm").rlike(R_AI_ENGINEER), "ai engineer")
         .when(F.col("title_norm").rlike(R_AI_OTHER), "ai (other)")

         .otherwise("other"))

    # Coarse grouping, so a chart can still show "all AI" in one bar
    # without anyone having to hardcode the seven names again.
    .withColumn("role_group",
        F.when(F.col("role_family").isin(
            "genai / llm", "mlops", "ml engineer", "ai research",
            "ai consultant", "ai engineer", "ai (other)"), "ai")
         .when(F.col("role_family").isin(
            "data engineer", "data analyst", "data scientist",
            "data architect", "analytics engineer", "dwh / etl",
            "data governance", "data consultant", "bi developer"),
            "data")
         .otherwise("excluded"))

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

DATA_FAMILIES = ["data engineer", "data analyst", "data scientist",
                 "data architect", "analytics engineer", "dwh / etl",
                 "data governance", "data consultant", "bi developer"]

# Order here is the order the site should show them in.
AI_FAMILIES = ["ai engineer", "genai / llm", "ml engineer", "mlops",
               "ai consultant", "ai research", "ai (other)"]

KEEP = DATA_FAMILIES + AI_FAMILIES

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

# MAGIC %md
# MAGIC ### How the AI split landed
# MAGIC Two things to read here.
# MAGIC
# MAGIC 1. The total across the seven families must equal what the old
# MAGIC    single `ai / ml` family produced. If it does not, a title is
# MAGIC    escaping into `other` and a rule is too narrow.
# MAGIC 2. The `ai (other)` share. If it is above roughly a third, the
# MAGIC    specific rules are missing real patterns and should be widened
# MAGIC    before any of these numbers are published as findings.

# COMMAND ----------

ai = clean.filter(F.col("role_group") == "ai")
n_ai = ai.count()

display(ai.groupBy("role_family")
          .count()
          .withColumn("pct_of_ai",
                      F.round(100.0 * F.col("count") / n_ai, 1))
          .orderBy(F.desc("count")))

vague = ai.filter(F.col("role_family") == "ai (other)").count()
print(f"AI roles total : {n_ai:,}")
print(f"ai (other)     : {vague:,} ({vague/max(n_ai,1):.1%})")
if vague / max(n_ai, 1) > 0.35:
    print("  <-- too vague. Widen the specific rules before "
          "publishing per-family findings.")

# a hand check: 15 random vague titles, to see what is being missed
display(ai.filter(F.col("role_family") == "ai (other)")
          .select("title_raw", "company")
          .orderBy(F.rand()).limit(15))

# COMMAND ----------

COLS = ["posting_id", "adzuna_id", "country", "title_raw",
        "title_norm", "role_family", "role_group",
        "seniority", "gendered_tag",
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