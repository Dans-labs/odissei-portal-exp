#!/usr/bin/env python3
"""
setup_typesense_collection.py

Creates the 'datasets' collection in Typesense using the schema defined in
typesense_schema.py. Safe to re-run: use --drop to delete and recreate the
collection first (needed whenever you change field types, since Typesense
doesn't support in-place schema type changes for existing fields).

Usage:
  pip install typesense
  python setup_typesense_collection.py --host localhost --port 8108 --api-key xyz-local-dev-key
  python setup_typesense_collection.py --drop --api-key xyz-local-dev-key   # wipe + recreate
"""

import argparse
import sys

import typesense

from typesense_schema import SCHEMA, COLLECTION_NAME


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", default="8108")
    parser.add_argument("--protocol", default="http")
    parser.add_argument("--api-key", required=True, help="Must match TYPESENSE_API_KEY used to start the server")
    parser.add_argument("--drop", action="store_true", help="Delete the collection first if it already exists")
    args = parser.parse_args()

    client = typesense.Client({
        "nodes": [{"host": args.host, "port": args.port, "protocol": args.protocol}],
        "api_key": args.api_key,
        "connection_timeout_seconds": 5,
    })

    existing = {c["name"] for c in client.collections.retrieve()}

    if COLLECTION_NAME in existing:
        if args.drop:
            print(f"Dropping existing collection '{COLLECTION_NAME}'...")
            client.collections[COLLECTION_NAME].delete()
        else:
            print(
                f"Collection '{COLLECTION_NAME}' already exists. "
                f"Re-run with --drop to delete and recreate it (needed after schema changes).",
                file=sys.stderr,
            )
            sys.exit(1)

    print(f"Creating collection '{COLLECTION_NAME}'...")
    client.collections.create(SCHEMA)
    print("Done.")


if __name__ == "__main__":
    main()
