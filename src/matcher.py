"""Dictionary-based skill extraction.

Two design decisions worth knowing about:

1. **Longest alias first, then blank the span.** Without this, "sql"
   matches inside "postgresql" and inflates the SQL count by every
   Postgres posting.

2. **"R" needs context.** A naive \\bR\\b matches "R&D", "R. Mueller"
   and half of every German address block. We only accept it when the
   surrounding document looks like it is listing technologies.
"""

import re

from skills_dictionary import SKILLS, CATEGORY

# longest alias first so specific patterns win
PATTERNS = sorted(
    ((skill, alias)
     for skill, d in SKILLS.items()
     for alias in d["aliases"]),
    key=lambda p: -len(p[1]))

COMPILED = [(skill, re.compile(alias, re.I))
            for skill, alias in PATTERNS]

R_CONTEXT = re.compile(
    r"(python|sql|statist|analys|sprachen|languages|matlab|sas)",
    re.I)


def extract(text):
    """Return the sorted set of skill keys mentioned in `text`."""
    if not text:
        return []

    remaining = text.lower()
    found = []

    for skill, rx in COMPILED:
        m = rx.search(remaining)
        if not m:
            continue

        if skill == "r_lang" and not R_CONTEXT.search(text):
            continue

        found.append(skill)

        # blank the matched span so shorter aliases cannot
        # re-match inside it
        remaining = (remaining[:m.start()]
                     + " " * (m.end() - m.start())
                     + remaining[m.end():])

    return sorted(set(found))


def categorise(skill):
    return CATEGORY.get(skill, "other")


def evaluate(labelled_rows, text_key="description",
             truth_key="skills_true"):
    """Precision and recall against hand-labelled rows.

    `labelled_rows` is an iterable of dicts. `truth_key` holds
    semicolon-separated skill keys.
    """
    tp = fp = fn = 0

    for row in labelled_rows:
        truth = {x.strip() for x in
                 str(row.get(truth_key, "")).split(";") if x.strip()}
        pred = set(extract(row.get(text_key, "")))

        tp += len(truth & pred)
        fp += len(pred - truth)
        fn += len(truth - pred)

    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = (2 * precision * recall / max(precision + recall, 1e-9))

    return {"precision": round(precision, 3),
            "recall": round(recall, 3),
            "f1": round(f1, 3),
            "tp": tp, "fp": fp, "fn": fn}
