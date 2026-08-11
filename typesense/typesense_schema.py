"""
typesense_schema.py

Defines the Typesense collection schema for flattened dataset records
(the output of flatten_datasets.py). Imported by both
setup_typesense_collection.py (creates the collection) and
import_to_typesense.py (needs to know which fields are optional, so it can
correctly strip absent/None values before sending documents — Typesense
rejects explicit nulls; optional fields must simply be omitted).

Field type notes:
  - string[]  -> faceted multi-value fields (authors, subjects, keywords...)
  - object[]  -> nested arrays of sub-documents (contacts, relations, files).
                 Requires enable_nested_fields=True on the collection.
  - *_timestamp (int64) -> derived from the corresponding *_date string, so
    you get real numeric range filtering/sorting (e.g. filter_by=
    production_timestamp:[1230768000..1262304000]). The original *_date
    string is kept too, for display.
  - has_restricted_files is a bool that's genuinely nullable in your data
    (null = "no file metadata harvested yet"). Typesense has no tri-state
    bool, so the import script omits the field entirely when it's None,
    and you distinguish "unknown" from "false" in your frontend by checking
    whether the field is present in the returned document at all.
"""

COLLECTION_NAME = "datasets"

SCHEMA = {
    "name": COLLECTION_NAME,
    "enable_nested_fields": True,
    "fields": [
        {"name": "id", "type": "string"},  # Typesense's own doc id — we set it to the DOI
        {"name": "doi", "type": "string", "facet": False},
        {"name": "doi_url", "type": "string", "facet": False, "index": False, "optional": True},
        {"name": "bag_id", "type": "string", "facet": False, "index": False, "optional": True},
        {"name": "nbn", "type": "string", "facet": False, "index": False, "optional": True},

        {"name": "data_source", "type": "string", "facet": True},

        {"name": "title", "type": "string", "sort": True},
        {"name": "authors", "type": "string[]", "facet": True, "optional": True},
        {"name": "contributors", "type": "string[]", "facet": True, "optional": True},
        {"name": "contacts", "type": "object[]", "optional": True, "index": False},

        {"name": "description", "type": "string", "facet": False, "optional": True},
        {"name": "descriptions", "type": "string[]", "facet": False, "optional": True, "index": False},

        {"name": "subjects", "type": "string[]", "facet": True, "optional": True},
        {"name": "keywords", "type": "string[]", "facet": True, "optional": True},
        {"name": "languages", "type": "string[]", "facet": True, "optional": True},

        {"name": "production_date", "type": "string", "facet": False, "optional": True, "index": False},
        {"name": "production_timestamp", "type": "int64", "facet": False, "optional": True},
        {"name": "distribution_date", "type": "string", "facet": False, "optional": True, "index": False},
        {"name": "distribution_timestamp", "type": "int64", "facet": False, "optional": True},
        {"name": "date_of_deposit", "type": "string", "facet": False, "optional": True, "index": False},
        {"name": "publication_year", "type": "int32", "facet": True, "optional": True},

        {"name": "temporal_coverage", "type": "string[]", "facet": True, "optional": True},
        {"name": "spatial_coverage", "type": "string[]", "facet": True, "optional": True},

        {"name": "license", "type": "string", "facet": True, "optional": True},
        {"name": "file_access_request", "type": "bool", "facet": True, "optional": True},
        {"name": "rights_holders", "type": "string[]", "facet": True, "optional": True},
        {"name": "personal_data_present", "type": "string", "facet": True, "optional": True},

        {"name": "relations", "type": "object[]", "optional": True, "index": False},
        {"name": "audience", "type": "string[]", "facet": True, "optional": True},
        {"name": "collections", "type": "string[]", "facet": True, "optional": True},
        {"name": "data_sources", "type": "string[]", "facet": False, "optional": True, "index": False},

        {"name": "file_count", "type": "int32", "facet": True, "optional": True},
        {"name": "total_file_size_bytes", "type": "int64", "facet": False, "optional": True},
        {"name": "has_restricted_files", "type": "bool", "facet": True, "optional": True},
        {"name": "files", "type": "object[]", "optional": True, "index": False},
    ],
}

# Fields present in flatten_datasets.py output that we deliberately don't
# send to Typesense at all (internal/provenance only).
DROP_FIELDS = {"_source_path"}

# Names of the schema fields (used by the import script to know what's
# optional and therefore droppable-if-empty/None).
OPTIONAL_FIELDS = {f["name"] for f in SCHEMA["fields"] if f.get("optional")}
