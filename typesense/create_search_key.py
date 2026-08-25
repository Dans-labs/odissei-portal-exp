#!/usr/bin/env python3
# typesense/create_search_key.py
"""
Creates a scoped, search-only Typesense API key for the frontend.
Prints the value once — Typesense never returns it again after creation,
so copy it straight into portal/.env.production.

Usage (from inside the tools container, admin key via TYPESENSE_API_KEY env):
  python create_search_key.py --host typesense --port 8108
"""

import argparse
import os
import sys

import typesense

from typesense_schema import COLLECTION_NAME


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", default="8108")
    parser.add_argument("--protocol", default="http")
    args = parser.parse_args()

    admin_key = os.environ.get("TYPESENSE_API_KEY")
    if not admin_key:
        print("TYPESENSE_API_KEY (admin key) must be set in the environment.", file=sys.stderr)
        sys.exit(1)

    client = typesense.Client({
        "nodes": [{"host": args.host, "port": args.port, "protocol": args.protocol}],
        "api_key": admin_key,
        "connection_timeout_seconds": 5,
    })

    key = client.keys.create({
        "description": "Public search-only key (frontend)",
        "actions": ["documents:search"],
        "collections": [COLLECTION_NAME],
    })

    print("Search-only key created — save this now, it won't be shown again:")
    print(key["value"])


if __name__ == "__main__":
    main()