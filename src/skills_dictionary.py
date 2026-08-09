SKILLS = {
 # languages
 "sql":         {"cat": "language",   "aliases": [r"\bsql\b"]},
 "python":      {"cat": "language",   "aliases": [r"\bpython\b"]},
 "scala":       {"cat": "language",   "aliases": [r"\bscala\b"]},
 "java":        {"cat": "language",   "aliases": [r"\bjava\b(?!script)"]},
 "javascript":  {"cat": "language",   "aliases": [r"\bjavascript\b",
                                                 r"\btypescript\b"]},
 "php":         {"cat": "language",   "aliases": [r"\bphp\b"]},
 "r_lang":      {"cat": "language",   "aliases": [
                                                 r"(?<=[ ,/(])r(?=[ ,/)])"]},

 # processing
 "spark":       {"cat": "processing", "aliases": [r"\bapache spark\b",
                                                 r"\bpyspark\b",
                                                 r"\bspark\b"]},
 "hadoop":      {"cat": "legacy",     "aliases": [r"\bhadoop\b",
                                                 r"\bhdfs\b",
                                                 r"\bmapreduce\b",
                                                 r"\bhive\b"]},
 "kafka":       {"cat": "streaming",  "aliases": [r"\bkafka\b"]},
 "flink":       {"cat": "streaming",  "aliases": [r"\bflink\b"]},

 # platforms
 "databricks":  {"cat": "platform",   "aliases": [r"\bdatabricks\b"]},
 "snowflake":   {"cat": "warehouse",  "aliases": [r"\bsnowflake\b"]},
 "bigquery":    {"cat": "warehouse",  "aliases": [r"\bbigquery\b"]},
 "redshift":    {"cat": "warehouse",  "aliases": [r"\bredshift\b"]},
 "synapse":     {"cat": "warehouse",  "aliases": [r"\bsynapse\b"]},

 # orchestration / transform
 "airflow":     {"cat": "orchestr",   "aliases": [r"\bapache airflow\b",
                                                 r"\bairflow\b"]},
 "dbt":         {"cat": "transform",  "aliases": [r"\bdbt\b"]},
 "ssis":        {"cat": "legacy",     "aliases": [r"\bssis\b"]},
 "talend":      {"cat": "legacy",     "aliases": [r"\btalend\b"]},

 # databases
 "postgres":    {"cat": "database",   "aliases": [r"\bpostgresql\b",
                                                 r"\bpostgres\b"]},
 "mysql":       {"cat": "database",   "aliases": [r"\bmysql\b"]},
 "mssql":       {"cat": "database",   "aliases": [r"\bsql server\b",
                                                 r"\bt-sql\b",
                                                 r"\bms sql\b"]},
 "oracle":      {"cat": "database",   "aliases": [r"\boracle\b"]},
 "mongodb":     {"cat": "database",   "aliases": [r"\bmongodb\b",
                                                 r"\bmongo\b"]},
 "elastic":     {"cat": "database",   "aliases": [r"\belasticsearch\b"]},

 # cloud
 "aws":         {"cat": "cloud",      "aliases": [r"\baws\b",
                                                 r"\bamazon web services\b"]},
 "azure":       {"cat": "cloud",      "aliases": [r"\bazure\b",
                                                 r"\bdata factory\b"]},
 "gcp":         {"cat": "cloud",      "aliases": [r"\bgcp\b",
                                                 r"\bgoogle cloud\b"]},

 # devops
 "docker":      {"cat": "devops",     "aliases": [r"\bdocker\b"]},
 "kubernetes":  {"cat": "devops",     "aliases": [r"\bkubernetes\b",
                                                 r"\bk8s\b"]},
 "terraform":   {"cat": "devops",     "aliases": [r"\bterraform\b"]},
 "git":         {"cat": "devops",     "aliases": [r"\bgithub\b",
                                                 r"\bgitlab\b",
                                                 r"\bgit\b"]},
 "cicd":        {"cat": "devops",     "aliases": [r"\bci/cd\b",
                                                 r"\bjenkins\b"]},

 # bi
 "powerbi":     {"cat": "bi",         "aliases": [r"\bpower ?bi\b"]},
 "tableau":     {"cat": "bi",         "aliases": [r"\btableau\b"]},
 "looker":      {"cat": "bi",         "aliases": [r"\blooker\b"]},
 "qlik":        {"cat": "bi",         "aliases": [r"\bqlik\b"]},
 "excel":       {"cat": "bi",         "aliases": [r"\bexcel\b"]},

 # ml
 "pytorch":     {"cat": "ml",         "aliases": [r"\bpytorch\b"]},
 "tensorflow":  {"cat": "ml",         "aliases": [r"\btensorflow\b"]},
 "sklearn":     {"cat": "ml",         "aliases": [r"\bscikit-?learn\b",
                                                 r"\bsklearn\b"]},
 "llm":         {"cat": "ml",         "aliases": [r"\bllm\b",
                                                 r"\bgenai\b",
                                                 r"\bgenerative ai\b",
                                                 r"\brag\b"]},

 # practice
 "sap":           {"cat": "enterprise", "aliases": [r"\bsap\b"]},
 "etl":           {"cat": "practice",   "aliases": [r"\betl\b", r"\belt\b"]},
 "datawarehouse": {"cat": "practice",   "aliases": [
                                                    r"\bdata warehouse\b", r"\bdwh\b",
                                                    r"\bdata lakehouse\b", r"\bdata lake\b"]},
}


CATEGORY = {k: v["cat"] for k, v in SKILLS.items()}
