#!/usr/bin/env python3
"""
import_to_typesense.py

Reads the combined NDJSON produced by flatten_datasets.py and bulk-upserts
every record into the Typesense 'datasets' collection.

Handles two things Typesense is picky about:
  1. No explicit nulls: optional fields with value None (or empty list,
     for the file-count/restricted-files case) must be omitted from the
     document entirely, not sent as null.
  2. Date fields: adds *_timestamp (int64, unix seconds) alongside the
     existing *_date strings, so the frontend can do real numeric range
     filtering/sorting on dates, not just string comparisons.

Usage:
  pip install typesense
  python import_to_typesense.py /path/to/all_datasets.jsonl --api-key xyz-local-dev-key

Re-run any time your flattened data changes — this uses upsert, so
existing documents with the same id (DOI) are overwritten, not duplicated.
"""

import argparse
import json
import sys
from datetime import datetime, timezone

import typesense

from typesense_schema import COLLECTION_NAME, OPTIONAL_FIELDS, DROP_FIELDS

BATCH_SIZE = 200


def parse_date_to_timestamp(date_str):
    """Best-effort parse of common date formats found in the source data
    (full ISO dates like '2008-08-01', or occasionally just a year)."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
        try:
            dt = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
            return int(dt.timestamp())
        except ValueError:
            continue
    return None


def prepare_document(record: dict) -> dict:
    doc = {k: v for k, v in record.items() if k not in DROP_FIELDS}

    # Typesense's own document id must be a string and, by convention here,
    # equal to the DOI (also used as the 'id' field in flatten_datasets.py).
    doc["id"] = str(doc.get("id") or doc.get("doi") or "")

    # Derive numeric timestamps for range filtering/sorting.
    prod_ts = parse_date_to_timestamp(doc.get("production_date"))
    if prod_ts is not None:
        doc["production_timestamp"] = prod_ts
    dist_ts = parse_date_to_timestamp(doc.get("distribution_date"))
    if dist_ts is not None:
        doc["distribution_timestamp"] = dist_ts

    # Strip None / empty values for optional fields — Typesense rejects
    # explicit nulls, so "no value" must mean "key absent".
    cleaned = {}
    for key, value in doc.items():
        if value is None:
            if key in OPTIONAL_FIELDS:
                continue  # omit
            # required field missing — leave it out and let Typesense
            # surface a clear error rather than silently sending null
            continue
        if isinstance(value, list) and len(value) == 0 and key in OPTIONAL_FIELDS:
            continue  # omit empty arrays for optional fields too
        cleaned[key] = value

    return cleaned


def batched(iterable, size):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("jsonl_path", help="Path to all_datasets.jsonl")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", default="8108")
    parser.add_argument("--protocol", default="http")
    parser.add_argument("--api-key", required=True)
    args = parser.parse_args()

    client = typesense.Client({
        "nodes": [{"host": args.host, "port": args.port, "protocol": args.protocol}],
        "api_key": args.api_key,
        "connection_timeout_seconds": 10,
    })

    n_ok, n_fail = 0, 0

    def doc_stream():
        with open(args.jsonl_path, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f"[SKIP] line {line_no}: bad JSON ({e})", file=sys.stderr)
                    continue
                yield prepare_document(record)

    for batch in batched(doc_stream(), BATCH_SIZE):
        results = client.collections[COLLECTION_NAME].documents.import_(batch, {"action": "upsert"})
        for i, result in enumerate(results):
            if result.get("success"):
                n_ok += 1
            else:
                n_fail += 1
                print(f"[FAIL] doc id={batch[i].get('id')}: {result.get('error')}", file=sys.stderr)

    print(f"Imported {n_ok} documents ({n_fail} failed) into '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
