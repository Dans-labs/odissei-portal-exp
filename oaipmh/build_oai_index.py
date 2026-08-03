#!/usr/bin/env python3
"""
build_oai_index.py

Builds/refreshes a small SQLite index from the combined NDJSON produced by
flatten_datasets.py, for use by oai_pmh_server.py.

Why SQLite and not just re-reading the JSONL every request:
  - OAI-PMH selective harvesting (`from`/`until`) needs a datestamp filter.
  - ListIdentifiers/ListRecords need stable, resumable pagination
    (resumptionToken) over potentially thousands of records.
  Both are trivial with an indexed SQL table, painful with a flat file scan
  on every request.

IMPORTANT — about the 'datestamp' column:
  OAI-PMH's incremental-harvesting model depends on an accurate
  "last modified" timestamp per record. Your current flattened JSON doesn't
  carry one (production/distribution dates describe the *dataset*, not
  when *your harvest record* last changed). As a placeholder, this script
  uses each record's file mtime on disk. That's good enough to get a
  working, spec-compliant endpoint today, but it will drift from reality
  the moment you re-run the flatten step for unrelated reasons (e.g. a
  script bugfix touches every file's mtime without the underlying dataset
  actually changing). When your harmonization pipeline can supply a real
  "last updated" field per dataset, swap that in here instead — everything
  downstream (resumption tokens, from/until filtering) keeps working
  unchanged.

Usage:
  python build_oai_index.py /path/to/flattened_output/all_datasets.jsonl /path/to/oai_index.sqlite3
"""

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS records (
    identifier   TEXT PRIMARY KEY,   -- OAI identifier, e.g. oai:yourdomain.nl:10.17026/xxx
    doi          TEXT NOT NULL,
    datestamp    TEXT NOT NULL,      -- ISO8601 UTC, e.g. 2026-08-03T10:15:00Z
    set_spec     TEXT,               -- e.g. data_source value, used for ListSets/set filtering
    deleted      INTEGER NOT NULL DEFAULT 0,
    payload      TEXT NOT NULL       -- full flattened JSON, used to render oai_dc
);
CREATE INDEX IF NOT EXISTS idx_records_datestamp ON records(datestamp);
CREATE INDEX IF NOT EXISTS idx_records_set_spec ON records(set_spec);
"""


def oai_identifier(repo_domain, doi):
    return f"oai:{repo_domain}:{doi}"


def iso_utc(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build(jsonl_path, db_path, repo_domain):
    jsonl_path = Path(jsonl_path)
    db_path = Path(db_path)

    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA)

    n_ok, n_fail = 0, 0
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as e:
                print(f"[SKIP] line {line_no}: {e}", file=sys.stderr)
                n_fail += 1
                continue

            doi = record.get("doi")
            if not doi:
                print(f"[SKIP] line {line_no}: no doi", file=sys.stderr)
                n_fail += 1
                continue

            # Placeholder datestamp: source file's mtime. See module docstring.
            source_path = record.get("_source_path")
            if source_path and Path(source_path).exists():
                datestamp = iso_utc(Path(source_path).stat().st_mtime)
            else:
                datestamp = iso_utc(datetime.now(tz=timezone.utc).timestamp())

            identifier = oai_identifier(repo_domain, doi)
            set_spec = record.get("data_source", "unknown")

            conn.execute(
                """
                INSERT INTO records (identifier, doi, datestamp, set_spec, deleted, payload)
                VALUES (?, ?, ?, ?, 0, ?)
                ON CONFLICT(identifier) DO UPDATE SET
                    doi=excluded.doi,
                    datestamp=excluded.datestamp,
                    set_spec=excluded.set_spec,
                    deleted=0,
                    payload=excluded.payload
                """,
                (identifier, doi, datestamp, set_spec, json.dumps(record, ensure_ascii=False)),
            )
            n_ok += 1

    conn.commit()
    conn.close()
    print(f"Indexed {n_ok} records ({n_fail} skipped) into {db_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("jsonl_path", help="Path to all_datasets.jsonl (from flatten_datasets.py)")
    parser.add_argument("db_path", help="Path to write/update the SQLite index")
    parser.add_argument(
        "--repo-domain",
        default="example.org",
        help="Domain used to build OAI identifiers, e.g. oai:<repo-domain>:<doi>. "
             "Should be a domain you control (used only as a namespace string, not fetched).",
    )
    args = parser.parse_args()
    build(args.jsonl_path, args.db_path, args.repo_domain)


if __name__ == "__main__":
    main()
