#!/usr/bin/env python3
"""
flatten_dataverse_datasets.py

Sibling to flatten_datasets.py, for a different source format.

Walks a directory tree of DOI-named folders, each containing
./source/dataverse-json-export.json — a *native Dataverse API export*
(the "datasetVersion" wrapper format, e.g. what you get back from
GET /api/datasets/:id or an OAI/native export), as opposed to the
flatten_datasets.py format which reads a bare dataset-metadata.json.

Key structural differences from the other source, handled here:
  - Everything of interest lives under top-level "datasetVersion", not
    at the document root (metadataBlocks, license, fileAccessRequest,
    files, etc. are all datasetVersion.*).
  - "publisher" is a clean top-level field for data source / archive name
    (no need to fall back to a dataSource-in-metadataBlocks convention).
  - DOI is available in multiple places (datasetVersion.datasetPersistentId,
    top-level persistentUrl, dansDataversePid inside the vault metadata
    block) and casing is inconsistent between them (e.g.
    "doi:10.17026/DANS-XNB-BV5X" vs "doi:10.17026/dans-xnb-bv5x") — we
    lowercase whatever we pick so IDs stay consistent with records
    flattened from the other source (avoids duplicate docs in Typesense
    if the same dataset gets harvested both ways).
  - "license" is an object ({name, uri, iconUri}), not a bare string.
  - "files" is a real, rich array: each entry has restricted/label/
    description plus a nested "dataFile" object with contentType,
    friendlyType, filesize, checksum, tabularData, original file
    format/size/name (for files Dataverse re-packaged, e.g. .por -> .tab),
    creationDate, etc. We keep much more of this than the other source's
    file normalizer could, since it's actually there.
  - metadataBlocks (citation, dansRights, dansRelationMetadata,
    dansTemporalSpatial, dansDataVaultMetadata) are the *same shape* as
    the other source, so all of that extraction logic is reused as-is.

Output: same shape as flatten_datasets.py (one JSON file per dataset +
one combined NDJSON), so both scripts can feed the same Typesense
collection / same import_to_typesense.py.

Usage:
  python flatten_dataverse_datasets.py /path/to/doi-folders /path/to/output

  Optional flags:
    --pattern    glob pattern relative to each DOI folder
                 (default: source/dataverse-json-export.json)
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
# Low-level helpers for pulling values out of Dataverse's metadataBlocks
# field structure. Identical to flatten_datasets.py — the metadataBlocks
# shape is shared between both source formats.
# ---------------------------------------------------------------------------

def strip_html(value):
    """Dataverse description fields often contain <p> tags etc. Strip them
    for a clean search-indexable string."""
    if value is None:
        return None
    text = re.sub(r"<[^>]+>", " ", value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def get_block_fields(metadata_blocks, block_name):
    """Return the 'fields' list of a given metadata block, or [] if absent."""
    block = metadata_blocks.get(block_name, {}) if isinstance(metadata_blocks, dict) else {}
    return block.get("fields", [])


def find_field(fields, type_name):
    """Find a field dict by typeName within a fields list."""
    for f in fields:
        if f.get("typeName") == type_name:
            return f
    return None

def bucket_file_count(n):
    if n <= 10: return "1-10"
    if n <= 50: return "11-50"
    if n <= 200: return "51-200"
    return "200+"

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


# ---------------------------------------------------------------------------
# DOI resolution — this source has several candidate locations/casings.
# ---------------------------------------------------------------------------

def _clean_doi(raw):
    if not raw:
        return None
    doi = str(raw).strip()
    doi = re.sub(r"^https?://doi\.org/", "", doi, flags=re.IGNORECASE)
    doi = re.sub(r"^doi:", "", doi, flags=re.IGNORECASE)
    doi = doi.strip()
    return doi.lower() or None  # lowercased so IDs match flatten_datasets.py output


def extract_doi(top_json, dataset_version, vault_fields, doi_from_folder=None):
    candidates = [
        primitive_value(vault_fields, "dansDataversePid"),
        dataset_version.get("datasetPersistentId"),
        top_json.get("persistentUrl"),
    ]
    for c in candidates:
        doi = _clean_doi(c)
        if doi:
            return doi
    return _clean_doi(doi_from_folder) or doi_from_folder


# ---------------------------------------------------------------------------
# File metadata — this source has a much richer files[] array than the
# other one (real dataFile objects with checksums, original formats, etc.)
# ---------------------------------------------------------------------------

def normalize_file_metadata(dataset_version):
    """
    dataset_version["files"] is a list of dicts like:
      {"description", "label", "restricted", "version", "datasetVersionId",
       "dataFile": {"id", "filename", "contentType", "friendlyType",
                     "filesize", "checksum": {"type","value"},
                     "tabularData", "originalFileFormat",
                     "originalFormatLabel", "originalFileSize",
                     "originalFileName", "creationDate", "publicationDate",
                     "fileAccessRequest", "storageIdentifier", ...}}

    Returns (files, file_count, total_size_bytes, has_restricted_files).
    'has_restricted_files' is None if there's no files array at all yet,
    so the frontend can distinguish "unknown" from "known, zero restricted".
    """
    raw = dataset_version.get("files")
    if raw is None:
        return [], 0, 0, None

    entries = raw if isinstance(raw, list) else [raw]
    entries = [e for e in entries if isinstance(e, dict)]

    files = []
    total_size = 0
    any_restricted = False
    for e in entries:
        data_file = e.get("dataFile") or {}
        checksum = data_file.get("checksum") or {}

        size = data_file.get("filesize") or 0
        if not isinstance(size, (int, float)):
            size = 0
        restricted = bool(e.get("restricted"))

        files.append({
            "name": data_file.get("filename") or e.get("label"),
            "description": e.get("description") or data_file.get("description") or None,
            "mimetype": data_file.get("contentType"),
            "friendly_type": data_file.get("friendlyType"),
            "size_bytes": size,
            "restricted": restricted,
            "tabular_data": bool(data_file.get("tabularData")),
            "checksum_type": checksum.get("type"),
            "checksum_value": checksum.get("value"),
            # present when Dataverse converted/repackaged the originally
            # deposited file (e.g. .sav/.por -> .tab for tabular ingest)
            "original_file_name": data_file.get("originalFileName"),
            "original_file_format": data_file.get("originalFileFormat"),
            "original_format_label": data_file.get("originalFormatLabel"),
            "original_file_size": data_file.get("originalFileSize"),
            "creation_date": data_file.get("creationDate"),
            "publication_date": data_file.get("publicationDate"),
            "file_access_request": data_file.get("fileAccessRequest"),
            "storage_identifier": data_file.get("storageIdentifier"),
        })
        total_size += size
        any_restricted = any_restricted or restricted

    return files, len(files), total_size, any_restricted


# ---------------------------------------------------------------------------
# Main flattening logic
# ---------------------------------------------------------------------------

def flatten_dataset(top_json, source_path, doi_from_folder=None):
    # Be defensive: if someone points this at a bare datasetVersion (no
    # wrapper), still work.
    dataset_version = top_json.get("datasetVersion", top_json)
    if not isinstance(dataset_version, dict):
        dataset_version = {}

    metadata_blocks = dataset_version.get("metadataBlocks", {})
    citation = get_block_fields(metadata_blocks, "citation")
    rights = get_block_fields(metadata_blocks, "dansRights")
    relation = get_block_fields(metadata_blocks, "dansRelationMetadata")
    temporal_spatial = get_block_fields(metadata_blocks, "dansTemporalSpatial")
    vault = get_block_fields(metadata_blocks, "dansDataVaultMetadata")

    # --- identifiers -------------------------------------------------
    doi = extract_doi(top_json, dataset_version, vault, doi_from_folder=doi_from_folder)
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

    files, file_count, total_size_bytes, has_restricted = normalize_file_metadata(dataset_version)

    # --- license: object here ({name, uri, iconUri}), not a bare string --
    license_obj = dataset_version.get("license")
    license_name = None
    license_uri = None
    if isinstance(license_obj, dict):
        license_name = license_obj.get("name")
        license_uri = license_obj.get("uri")
    elif isinstance(license_obj, str):
        license_name = license_obj

    flat = {
        # identifiers
        "id": doi,                      # use DOI as the search-engine document id
        "doi": doi,
        "doi_url": doi_url,
        "bag_id": primitive_value(vault, "dansBagId"),
        "nbn": primitive_value(vault, "dansNbn"),
        "internal_dataset_id": top_json.get("id"),
        "internal_dataset_version_id": dataset_version.get("id"),

        # provenance of the harvested record itself
        "data_source": top_json.get("publisher") or dataset_version.get("metadataBlocks", {}).get("dataSource"),

        # core citation info
        "title": primitive_value(citation, "title"),
        "alternative_titles": primitive_values(citation, "alternativeTitle"),
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
        "production_date": primitive_value(citation, "productionDate") or dataset_version.get("productionDate"),
        "distribution_date": primitive_value(citation, "distributionDate") or dataset_version.get("distributionDate"),
        "date_of_deposit": primitive_value(citation, "dateOfDeposit"),
        "publication_year": extract_publication_year(
            citation,
            fallback_dates=[
                primitive_value(citation, "distributionDate"),
                dataset_version.get("distributionDate"),
                primitive_value(citation, "productionDate"),
                dataset_version.get("productionDate"),
                primitive_value(citation, "dateOfDeposit"),
                top_json.get("publicationDate"),
            ],
        ),

        # coverage
        "temporal_coverage": primitive_values(temporal_spatial, "dansTemporalCoverage"),
        "spatial_coverage": (
            primitive_values(temporal_spatial, "dansSpatialCoverageText")
            + primitive_values(temporal_spatial, "dansSpatialCoverageControlled")
        ),

        # rights / access
        "license": license_name,
        "license_uri": license_uri,
        "file_access_request": dataset_version.get("fileAccessRequest"),
        "terms_of_access": dataset_version.get("termsOfAccess"),
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
        # 'has_restricted_files' is None when there's no files array at
        # all for this dataset yet, vs False when there is one and none
        # are restricted — lets the frontend distinguish "unknown" from
        # "known, zero restricted".
        "file_count": file_count,
        "file_count_bucket": bucket_file_count(file_count),
        "total_file_size_bytes": total_size_bytes,
        "has_restricted_files": has_restricted,
        "files": files,

        # --- version / persistent-record metadata, only available in
        # this native export format (not present in the other source) --
        "persistent_url": top_json.get("persistentUrl"),
        "version_number": dataset_version.get("versionNumber"),
        "version_state": dataset_version.get("versionState"),
        "citation_text": dataset_version.get("citation"),
        "last_update_time": dataset_version.get("lastUpdateTime"),
        "release_time": dataset_version.get("releaseTime"),

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
        default="source/dataverse-json-export.json",
        help="Path (relative to each top-level folder) to the Dataverse export JSON file",
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