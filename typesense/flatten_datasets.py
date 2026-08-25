#!/usr/bin/env python3
"""
flatten_datasets.py

Walks a directory tree of DOI-named folders, each containing
./metadata/dataset-metadata.json in Dataverse export format, and flattens
each into a scalar/array document suitable for indexing in Typesense,
Meilisearch, or similar.

Output:
  - One flattened JSON file per dataset, mirroring input (for incremental
    re-index / upsert of a single DOI).
  - One combined NDJSON file (all datasets, one JSON object per line) for
    bulk (re-)import into the search engine.

Usage:
  python flatten_datasets.py /path/to/doi-folders /path/to/output

  Optional flags:
    --pattern    glob pattern relative to each DOI folder
                 (default: metadata/dataset-metadata.json)
    --combined   filename for the combined NDJSON
                 (default: all_datasets.jsonl)
"""

import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime


# ---------------------------------------------------------------------------
# Low-level helpers for pulling values out of Dataverse's field structure
# ---------------------------------------------------------------------------

def strip_html(value):
    """Dataverse description fields often contain <p> tags etc. Strip them
    for a clean search-indexable string."""
    if value is None:
        return None
    text = re.sub(r"<[^>]+>", " ", value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def get_block_fields(dataset_json, block_name):
    """Return the 'fields' list of a given metadata block, or [] if absent."""
    blocks = dataset_json.get("metadataBlocks", {})
    block = blocks.get(block_name, {})
    return block.get("fields", [])


def find_field(fields, type_name):
    """Find a field dict by typeName within a fields list."""
    for f in fields:
        if f.get("typeName") == type_name:
            return f
    return None


def primitive_values(fields, type_name):
    """
    Extract value(s) from a primitive or controlledVocabulary field.
    Always returns a list (empty if missing), so downstream code doesn't
    need to special-case single vs multiple.
    """
    field = find_field(fields, type_name)
    if field is None:
        return []
    val = field.get("value")
    if val is None:
        return []
    if isinstance(val, list):
        return [v for v in val if v is not None]
    return [val]


def primitive_value(fields, type_name):
    """Same as primitive_values but returns a single scalar (or None)."""
    vals = primitive_values(fields, type_name)
    return vals[0] if vals else None

def extract_year_from_date_string(date_str):
    """
    Best-effort year extraction from a date-like string.
    Handles full ISO dates ("2023-05-01"), year-only strings ("2023"),
    and anything else that at least starts with a 4-digit year.
    """
    if not date_str:
        return None

    try:
        return datetime.fromisoformat(date_str).year
    except ValueError:
        pass

    match = re.match(r"^(\d{4})", str(date_str).strip())
    if match:
        return int(match.group(1))

    return None


def extract_publication_year(citation, fallback_dates):
    """
    Resolve a single publication year for faceting/range filtering.

    Prefers the explicit publicationYear field from the citation metadata,
    falling back to the first usable year found in fallback_dates (in order).
    Always returns an int or None — never a raw/malformed string — since
    this feeds a Typesense int32 facet field.
    """
    raw_year = primitive_value(citation, "publicationYear")
    if raw_year is not None:
        try:
            return int(str(raw_year).strip()[:4])
        except (ValueError, TypeError):
            pass

    for date_str in fallback_dates:
        year = extract_year_from_date_string(date_str)
        if year is not None:
            return year

    return None


def compound_values(fields, type_name, subfield_names):
    """
    Extract values from a compound field (multiple=true), which is a list
    of dicts, each dict mapping sub-typeName -> field-dict.

    subfield_names: list of the sub-field typeNames you want extracted, in
    order. Returns a list of dicts {subfield_name: value, ...} — one dict
    per compound entry, only including subfields that were present.
    """
    field = find_field(fields, type_name)
    if field is None:
        return []
    entries = field.get("value")
    if not isinstance(entries, list):
        return []

    results = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        row = {}
        for sub in subfield_names:
            sub_field = entry.get(sub)
            if isinstance(sub_field, dict):
                row[sub] = sub_field.get("value")
        if row:
            results.append(row)
    return results


def compound_single_values(fields, type_name, subfield_name):
    """
    Convenience for the common case: a compound field where you only
    want one sub-value per entry, flattened into a plain list of strings.
    E.g. author -> [{"authorName": "..."}] -> ["..."]
    """
    rows = compound_values(fields, type_name, [subfield_name])
    return [r[subfield_name] for r in rows if subfield_name in r and r[subfield_name]]


def normalize_file_metadata(dataset_json):
    """
    'fileMetadata' lives inside metadataBlocks, sibling to citation,
    dansRights, etc. (NOT a top-level key — dataSource is the one that's
    top-level, sibling to license/metadataBlocks). It can be:
      - absent (no file metadata harvested yet)
      - a single object (one file)
      - a list of objects (multiple files)

    Returns (files, file_count, total_size_bytes, has_restricted_files).
    'has_restricted_files' is None if there's no file metadata at all yet,
    so the frontend can distinguish "unknown" from "known, zero restricted".
    """
    raw = dataset_json.get("metadataBlocks", {}).get("fileMetadata")
    if raw is None:
        return [], 0, 0, None

    entries = raw if isinstance(raw, list) else [raw]
    entries = [e for e in entries if isinstance(e, dict)]

    files = []
    total_size = 0
    any_restricted = False
    for e in entries:
        size = e.get("size") or 0
        restricted = bool(e.get("private"))
        files.append({
            "name": e.get("name"),
            "mimetype": e.get("mimetype"),
            "size_bytes": size,
            "restricted": restricted,
        })
        total_size += size if isinstance(size, (int, float)) else 0
        any_restricted = any_restricted or restricted

    return files, len(files), total_size, any_restricted


# ---------------------------------------------------------------------------
# Main flattening logic
# ---------------------------------------------------------------------------

def flatten_dataset(dataset_json, source_path, doi_from_folder=None):
    citation = get_block_fields(dataset_json, "citation")
    rights = get_block_fields(dataset_json, "dansRights")
    relation = get_block_fields(dataset_json, "dansRelationMetadata")
    temporal_spatial = get_block_fields(dataset_json, "dansTemporalSpatial")
    vault = get_block_fields(dataset_json, "dansDataVaultMetadata")

    # --- identifiers -------------------------------------------------
    dataverse_pid = primitive_value(vault, "dansDataversePid")  # e.g. "doi:10.17026/..."
    doi = None
    if dataverse_pid:
        doi = dataverse_pid.replace("doi:", "").strip()
    if not doi:
        doi = doi_from_folder

    doi_url = f"https://doi.org/{doi}" if doi else None

    # --- descriptions (strip HTML, join multiple) ---------------------
    descriptions_raw = compound_single_values(citation, "dsDescription", "dsDescriptionValue")
    descriptions = [strip_html(d) for d in descriptions_raw if strip_html(d)]

    # --- relations (compound: type/text/uri) ---------------------------
    relations_raw = compound_values(
        relation, "dansRelation",
        ["dansRelationType", "dansRelationText", "dansRelationURI"],
    )
    relations = [
        {
            "type": r.get("dansRelationType"),
            "text": r.get("dansRelationText"),
            "uri": r.get("dansRelationURI"),
        }
        for r in relations_raw
    ]

    # --- dataset contacts (compound: name/affiliation) ------------------
    contacts_raw = compound_values(
        citation, "datasetContact",
        ["datasetContactName", "datasetContactAffiliation"],
    )
    contacts = [
        {
            "name": c.get("datasetContactName"),
            "affiliation": c.get("datasetContactAffiliation"),
        }
        for c in contacts_raw
    ]

    files, file_count, total_size_bytes, has_restricted = normalize_file_metadata(dataset_json)

    flat = {
        # identifiers
        "id": doi,                      # use DOI as the search-engine document id
        "doi": doi,
        "doi_url": doi_url,
        "bag_id": primitive_value(vault, "dansBagId"),
        "nbn": primitive_value(vault, "dansNbn"),

        # provenance of the harvested record itself
        "data_source": dataset_json.get("dataSource", "DANS"),

        # core citation info
        "title": primitive_value(citation, "title"),
        "authors": compound_single_values(citation, "author", "authorName"),
        "contributors": compound_single_values(citation, "contributor", "contributorName"),
        "contacts": contacts,
        "descriptions": descriptions,
        "description": descriptions[0] if descriptions else None,  # convenience: first/short desc

        # facetable classification
        "subjects": primitive_values(citation, "subject"),
        "keywords": compound_single_values(citation, "keyword", "keywordValue"),
        "languages": primitive_values(citation, "language"),

        # dates
        "production_date": primitive_value(citation, "productionDate"),
        "distribution_date": primitive_value(citation, "distributionDate"),
        "date_of_deposit": primitive_value(citation, "dateOfDeposit"),
        "publication_year": extract_publication_year(
            citation,
            fallback_dates=[
                primitive_value(citation, "distributionDate"),
                primitive_value(citation, "productionDate"),
                primitive_value(citation, "dateOfDeposit"),
            ],
        ),

        # coverage
        "temporal_coverage": primitive_values(temporal_spatial, "dansTemporalCoverage"),
        "spatial_coverage": primitive_values(temporal_spatial, "dansSpatialCoverageText"),

        # rights / access
        "license": dataset_json.get("license"),
        "file_access_request": dataset_json.get("fileAccessRequest"),
        "rights_holders": primitive_values(rights, "dansRightsHolder"),
        "personal_data_present": find_field(rights, "dansPersonalDataPresent").get("value")
            if find_field(rights, "dansPersonalDataPresent") else None,

        # relations / audience
        "relations": relations,
        "audience": primitive_values(relation, "dansAudience"),
        "collections": primitive_values(relation, "dansCollection"),

        # data sources
        "data_sources": primitive_values(citation, "dataSources"),

        # --- file-level metadata -----------------------------------------
        # 'has_restricted_files' is None when fileMetadata hasn't been
        # harvested for this dataset yet, vs False when it has and none
        # are restricted — lets the frontend distinguish "unknown" from
        # "known, zero restricted".
        "file_count": file_count,
        "total_file_size_bytes": total_size_bytes,
        "has_restricted_files": has_restricted,
        "files": files,  # [{"name", "mimetype", "size_bytes", "restricted"}, ...]

        # provenance
        "_source_path": str(source_path),
    }

    return flat


# ---------------------------------------------------------------------------
# Directory walking / IO
# ---------------------------------------------------------------------------

def safe_filename(doi_or_fallback):
    return re.sub(r"[^A-Za-z0-9._-]", "_", doi_or_fallback)


def run(input_root, output_root, pattern, combined_filename):
    input_root = Path(input_root)
    output_root = Path(output_root)
    flattened_dir = output_root / "flattened"
    flattened_dir.mkdir(parents=True, exist_ok=True)

    combined_path = output_root / combined_filename

    matches = sorted(input_root.glob(f"*/{pattern}"))
    if not matches:
        # fall back to a recursive search in case folder depth varies
        matches = sorted(input_root.rglob(Path(pattern).name))

    if not matches:
        print(f"No files matching '{pattern}' found under {input_root}", file=sys.stderr)
        return

    n_ok, n_fail = 0, 0

    with open(combined_path, "w", encoding="utf-8") as combined_f:
        for path in matches:
            doi_folder_guess = path.parents[1].name if len(path.parents) > 1 else path.parent.name
            try:
                with open(path, "r", encoding="utf-8") as f:
                    dataset_json = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                print(f"[SKIP] {path}: could not read/parse ({e})", file=sys.stderr)
                n_fail += 1
                continue

            try:
                flat = flatten_dataset(dataset_json, path, doi_from_folder=doi_folder_guess)
            except Exception as e:
                print(f"[SKIP] {path}: flattening error ({e})", file=sys.stderr)
                n_fail += 1
                continue

            if not flat.get("doi"):
                print(f"[WARN] {path}: no DOI found, using folder name as id", file=sys.stderr)
                flat["id"] = flat["id"] or doi_folder_guess
                flat["doi"] = flat["doi"] or doi_folder_guess

            out_name = safe_filename(flat["id"]) + ".json"
            with open(flattened_dir / out_name, "w", encoding="utf-8") as out_f:
                json.dump(flat, out_f, ensure_ascii=False, indent=2)

            combined_f.write(json.dumps(flat, ensure_ascii=False) + "\n")
            n_ok += 1

    print(f"Done. {n_ok} datasets flattened, {n_fail} skipped.")
    print(f"Per-dataset files: {flattened_dir}")
    print(f"Combined NDJSON:   {combined_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input_root", help="Root directory containing DOI-named folders")
    parser.add_argument("output_root", help="Directory to write flattened output into")
    parser.add_argument(
        "--pattern",
        default="metadata/dataset-metadata.json",
        help="Path (relative to each top-level folder) to the metadata JSON file",
    )
    parser.add_argument(
        "--combined",
        default="all_datasets.jsonl",
        dest="combined_filename",
        help="Filename for the combined NDJSON output",
    )
    args = parser.parse_args()
    run(args.input_root, args.output_root, args.pattern, args.combined_filename)


if __name__ == "__main__":
    main()
