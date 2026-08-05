# Databricks notebook source
# MAGIC %sql
# MAGIC CREATE CATALOG IF NOT EXISTS jobs;
# MAGIC CREATE SCHEMA IF NOT EXISTS jobs.bronze;
# MAGIC CREATE SCHEMA IF NOT EXISTS jobs.silver;
# MAGIC CREATE SCHEMA IF NOT EXISTS jobs.gold;
# MAGIC

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE VOLUME IF NOT EXISTS jobs.bronze.raw;
# MAGIC CREATE VOLUME IF NOT EXISTS jobs.bronze.checkpoints;