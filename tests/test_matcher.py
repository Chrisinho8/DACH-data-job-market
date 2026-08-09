
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "src"))

from matcher import extract, evaluate      

def test_sql_not_matched_inside_postgresql():
    assert extract("We use PostgreSQL daily") == ["postgres"]


def test_sql_not_matched_inside_mysql():
    assert extract("Legacy stack on MySQL") == ["mysql"]


def test_java_not_matched_inside_javascript():
    assert "java" not in extract("Strong JavaScript skills required")


def test_java_still_matched_on_its_own():
    assert "java" in extract("Java and Scala experience")


def test_r_not_matched_in_rnd():
    assert "r_lang" not in extract("Our R&D team in Berlin")


def test_r_not_matched_in_a_name():
    assert "r_lang" not in extract("Contact R. Mueller for details")


def test_r_matched_with_tech_context():
    assert "r_lang" in extract("Sprachen: Python, R, SQL")


def test_german_posting():
    txt = "Kenntnisse in Python und Erfahrung mit Apache Spark"
    assert set(extract(txt)) == {"python", "spark"}


def test_german_real_snippet():
    txt = ("Technisch betreiben wir zwei Generationen parallel: ein "
           "ueber Jahre gewachsenes, hochbelastetes Kernsystem "
           "(PHP / MySQL) und einen modernen Node-Stack")
    assert set(extract(txt)) == {"php", "mysql"}


def test_umlauts_do_not_break_matching():
    txt = "Für diese Rolle brauchst du Erfahrung mit Databricks"
    assert "databricks" in extract(txt)


def test_empty_input():
    assert extract("") == []
    assert extract(None) == []


def test_no_duplicates_returned():
    txt = "Python, python, PYTHON everywhere"
    assert extract(txt).count("python") == 1


def test_result_is_sorted():
    out = extract("Spark, Airflow, Python")
    assert out == sorted(out)


def test_evaluate_perfect_score():
    rows = [{"description": "We use Python and Spark",
             "skills_true": "python;spark"}]
    r = evaluate(rows)
    assert r["precision"] == 1.0
    assert r["recall"] == 1.0


def test_evaluate_catches_a_miss():
    rows = [{"description": "We use Python",
             "skills_true": "python;spark"}]
    r = evaluate(rows)
    assert r["recall"] < 1.0
