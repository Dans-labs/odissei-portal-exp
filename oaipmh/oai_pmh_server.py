#!/usr/bin/env python3
"""
oai_pmh_server.py

A minimal, spec-compliant OAI-PMH 2.0 data provider, serving records out of
the SQLite index built by build_oai_index.py. Runs independently of your
search engine (Typesense/Meilisearch) — OAI-PMH is a separate consumer of
the same underlying flattened metadata.

Supports the 6 standard verbs:
  Identify, ListMetadataFormats, ListSets, ListIdentifiers, ListRecords, GetRecord

Metadata format: oai_dc (Dublin Core) — the one format every OAI-PMH
harvester is required to support, so it's the safe default. Adding a second
format (e.g. datacite XML) later just means writing another
`render_<format>()` function and registering it in METADATA_FORMATS.

Run:
  pip install flask
  python oai_pmh_server.py --db /path/to/oai_index.sqlite3

Then e.g.:
  curl "http://localhost:5000/oai?verb=Identify"
  curl "http://localhost:5000/oai?verb=ListRecords&metadataPrefix=oai_dc"
"""

import argparse
import sqlite3
import json
import base64
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from flask import Flask, request, Response

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Config (set via CLI args / edit here)
# ---------------------------------------------------------------------------
CONFIG = {
    "db_path": "oai_index.sqlite3",
    "repository_name": "My Dataset Portal",
    "base_url": "http://localhost:5000/oai",
    "admin_email": "admin@example.org",
    "page_size": 100,
}

OAI_NS = "http://www.openarchives.org/OAI/2.0/"
OAI_DC_NS = "http://www.openarchives.org/OAI/2.0/oai_dc/"
DC_NS = "http://purl.org/dc/elements/1.1/"


def get_db():
    conn = sqlite3.connect(CONFIG["db_path"])
    conn.row_factory = sqlite3.Row
    return conn


def now_utc_iso():
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# oai_dc rendering — maps your flattened record shape to Dublin Core.
# Extend METADATA_FORMATS with more render_* functions for other formats.
# ---------------------------------------------------------------------------

def render_oai_dc(payload: dict) -> str:
    def dc_elements(tag, values):
        return "".join(f"<dc:{tag}>{escape(str(v))}</dc:{tag}>" for v in values if v)

    title = [payload.get("title")]
    creators = payload.get("authors") or []
    subjects = (payload.get("subjects") or []) + (payload.get("keywords") or [])
    descriptions = payload.get("descriptions") or []
    publishers = payload.get("rights_holders") or ["DANS"]
    dates = [payload.get("distribution_date") or payload.get("production_date")]
    types = ["Dataset"]
    identifiers = [payload.get("doi_url")]
    languages = payload.get("languages") or []
    rights = [payload.get("license")]
    coverage = (payload.get("spatial_coverage") or []) + (payload.get("temporal_coverage") or [])
    contributors = payload.get("contributors") or []
    sources = [payload.get("data_source")]

    xml = (
        '<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ '
        'http://www.openarchives.org/OAI/2.0/oai_dc.xsd">'
        + dc_elements("title", title)
        + dc_elements("creator", creators)
        + dc_elements("subject", subjects)
        + dc_elements("description", descriptions)
        + dc_elements("publisher", publishers)
        + dc_elements("contributor", contributors)
        + dc_elements("date", dates)
        + dc_elements("type", types)
        + dc_elements("identifier", identifiers)
        + dc_elements("language", languages)
        + dc_elements("rights", rights)
        + dc_elements("coverage", coverage)
        + dc_elements("source", sources)
        + "</oai_dc:dc>"
    )
    return xml


METADATA_FORMATS = {
    "oai_dc": {
        "schema": "http://www.openarchives.org/OAI/2.0/oai_dc.xsd",
        "namespace": OAI_DC_NS,
        "render": render_oai_dc,
    }
}


# ---------------------------------------------------------------------------
# resumptionToken: opaque base64 blob encoding {verb, offset, params, until-...}
# Simple offset-based pagination — fine at catalog scale (thousands-tens of
# thousands of records). If this ever needs to scale to millions, switch to
# keyset pagination (last-seen datestamp+identifier) instead of offset.
# ---------------------------------------------------------------------------

def encode_token(state: dict) -> str:
    raw = json.dumps(state, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode()


def decode_token(token: str) -> dict:
    raw = base64.urlsafe_b64decode(token.encode())
    return json.loads(raw)


# ---------------------------------------------------------------------------
# XML response helpers
# ---------------------------------------------------------------------------

def xml_response(body_inner: str, request_attrs: dict):
    attrs = "".join(f' {k}="{escape(str(v))}"' for k, v in request_attrs.items())
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="{OAI_NS}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="{OAI_NS} {OAI_NS}OAI-PMH.xsd">
  <responseDate>{now_utc_iso()}</responseDate>
  <request{attrs}>{escape(CONFIG['base_url'])}</request>
  {body_inner}
</OAI-PMH>"""
    return Response(xml, mimetype="text/xml")


def error_response(code: str, message: str, request_attrs: dict = None):
    inner = f'<error code="{escape(code)}">{escape(message)}</error>'
    return xml_response(inner, request_attrs or {})


def header_xml(row):
    return (
        f'<header{" status=\"deleted\"" if row["deleted"] else ""}>'
        f'<identifier>{escape(row["identifier"])}</identifier>'
        f'<datestamp>{escape(row["datestamp"])}</datestamp>'
        f'<setSpec>{escape(row["set_spec"] or "")}</setSpec>'
        f'</header>'
    )


def record_xml(row, metadata_prefix):
    header = header_xml(row)
    if row["deleted"]:
        return f"<record>{header}</record>"
    payload = json.loads(row["payload"])
    metadata = METADATA_FORMATS[metadata_prefix]["render"](payload)
    return f"<record>{header}<metadata>{metadata}</metadata></record>"


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

def query_records(conn, from_ts=None, until_ts=None, set_spec=None, offset=0, limit=100):
    clauses = []
    params = []
    if from_ts:
        clauses.append("datestamp >= ?")
        params.append(from_ts)
    if until_ts:
        clauses.append("datestamp <= ?")
        params.append(until_ts)
    if set_spec:
        clauses.append("set_spec = ?")
        params.append(set_spec)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    total = conn.execute(f"SELECT COUNT(*) FROM records {where}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM records {where} ORDER BY datestamp, identifier LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    return rows, total


# ---------------------------------------------------------------------------
# Verb handlers
# ---------------------------------------------------------------------------

@app.route("/oai", methods=["GET", "POST"])
def oai_endpoint():
    params = request.values
    verb = params.get("verb")
    request_attrs = {"verb": verb} if verb else {}

    if not verb:
        return error_response("badVerb", "Missing verb parameter")

    handler = VERB_HANDLERS.get(verb)
    if handler is None:
        return error_response("badVerb", f"Illegal verb: {verb}")

    return handler(params)


def handle_identify(params):
    conn = get_db()
    earliest = conn.execute("SELECT MIN(datestamp) FROM records").fetchone()[0] or now_utc_iso()
    conn.close()
    body = f"""<Identify>
    <repositoryName>{escape(CONFIG['repository_name'])}</repositoryName>
    <baseURL>{escape(CONFIG['base_url'])}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>{escape(CONFIG['admin_email'])}</adminEmail>
    <earliestDatestamp>{escape(earliest)}</earliestDatestamp>
    <deletedRecord>persistent</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
  </Identify>"""
    return xml_response(body, {"verb": "Identify"})


def handle_list_metadata_formats(params):
    identifier = params.get("identifier")  # optional; we support the same formats for all records
    formats_xml = "".join(
        f"<metadataFormat><metadataPrefix>{prefix}</metadataPrefix>"
        f"<schema>{info['schema']}</schema>"
        f"<metadataNamespace>{info['namespace']}</metadataNamespace></metadataFormat>"
        for prefix, info in METADATA_FORMATS.items()
    )
    attrs = {"verb": "ListMetadataFormats"}
    if identifier:
        attrs["identifier"] = identifier
    return xml_response(f"<ListMetadataFormats>{formats_xml}</ListMetadataFormats>", attrs)


def handle_list_sets(params):
    conn = get_db()
    rows = conn.execute(
        "SELECT DISTINCT set_spec FROM records WHERE set_spec IS NOT NULL AND deleted = 0"
    ).fetchall()
    conn.close()
    sets_xml = "".join(
        f"<set><setSpec>{escape(r['set_spec'])}</setSpec>"
        f"<setName>{escape(r['set_spec'])}</setName></set>"
        for r in rows
    )
    if not rows:
        return error_response("noSetHierarchy", "No sets defined")
    return xml_response(f"<ListSets>{sets_xml}</ListSets>", {"verb": "ListSets"})


def _list_headers_or_records(params, include_metadata: bool):
    verb = "ListRecords" if include_metadata else "ListIdentifiers"
    resumption_token = params.get("resumptionToken")

    if resumption_token:
        try:
            state = decode_token(resumption_token)
        except Exception:
            return error_response("badResumptionToken", "Could not parse resumptionToken")
        metadata_prefix = state["metadataPrefix"]
        from_ts, until_ts, set_spec = state.get("from"), state.get("until"), state.get("set")
        offset = state["offset"]
        request_attrs = {"verb": verb, "resumptionToken": resumption_token}
    else:
        metadata_prefix = params.get("metadataPrefix")
        if not metadata_prefix:
            return error_response("badArgument", "Missing required metadataPrefix")
        if metadata_prefix not in METADATA_FORMATS:
            return error_response("cannotDisseminateFormat", f"Unknown metadataPrefix: {metadata_prefix}")
        from_ts = params.get("from")
        until_ts = params.get("until")
        set_spec = params.get("set")
        offset = 0
        request_attrs = {"verb": verb, "metadataPrefix": metadata_prefix}
        if from_ts:
            request_attrs["from"] = from_ts
        if until_ts:
            request_attrs["until"] = until_ts
        if set_spec:
            request_attrs["set"] = set_spec

    conn = get_db()
    rows, total = query_records(
        conn, from_ts=from_ts, until_ts=until_ts, set_spec=set_spec,
        offset=offset, limit=CONFIG["page_size"],
    )
    conn.close()

    if not rows:
        return error_response("noRecordsMatch", "No records match the given criteria", request_attrs)

    if include_metadata:
        items_xml = "".join(record_xml(r, metadata_prefix) for r in rows)
    else:
        items_xml = "".join(header_xml(r) for r in rows)

    next_offset = offset + len(rows)
    resumption_xml = ""
    if next_offset < total:
        next_state = {
            "metadataPrefix": metadata_prefix,
            "from": from_ts,
            "until": until_ts,
            "set": set_spec,
            "offset": next_offset,
        }
        token = encode_token(next_state)
        resumption_xml = f'<resumptionToken completeListSize="{total}" cursor="{offset}">{token}</resumptionToken>'
    elif resumption_token:
        # final page of a multi-page response still returns an (empty) resumptionToken
        resumption_xml = '<resumptionToken completeListSize="%d" cursor="%d"/>' % (total, offset)

    tag = "ListRecords" if include_metadata else "ListIdentifiers"
    return xml_response(f"<{tag}>{items_xml}{resumption_xml}</{tag}>", request_attrs)


def handle_list_identifiers(params):
    return _list_headers_or_records(params, include_metadata=False)


def handle_list_records(params):
    return _list_headers_or_records(params, include_metadata=True)


def handle_get_record(params):
    identifier = params.get("identifier")
    metadata_prefix = params.get("metadataPrefix")
    request_attrs = {"verb": "GetRecord"}
    if identifier:
        request_attrs["identifier"] = identifier
    if metadata_prefix:
        request_attrs["metadataPrefix"] = metadata_prefix

    if not identifier or not metadata_prefix:
        return error_response("badArgument", "identifier and metadataPrefix are required", request_attrs)
    if metadata_prefix not in METADATA_FORMATS:
        return error_response("cannotDisseminateFormat", f"Unknown metadataPrefix: {metadata_prefix}", request_attrs)

    conn = get_db()
    row = conn.execute("SELECT * FROM records WHERE identifier = ?", (identifier,)).fetchone()
    conn.close()

    if row is None:
        return error_response("idDoesNotExist", f"No such identifier: {identifier}", request_attrs)

    return xml_response(f"<GetRecord>{record_xml(row, metadata_prefix)}</GetRecord>", request_attrs)


VERB_HANDLERS = {
    "Identify": handle_identify,
    "ListMetadataFormats": handle_list_metadata_formats,
    "ListSets": handle_list_sets,
    "ListIdentifiers": handle_list_identifiers,
    "ListRecords": handle_list_records,
    "GetRecord": handle_get_record,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=CONFIG["db_path"], help="Path to oai_index.sqlite3")
    parser.add_argument("--repo-name", default=CONFIG["repository_name"])
    parser.add_argument("--base-url", default=CONFIG["base_url"], help="Public base URL of this OAI endpoint")
    parser.add_argument("--admin-email", default=CONFIG["admin_email"])
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5000)
    args = parser.parse_args()

    CONFIG["db_path"] = args.db
    CONFIG["repository_name"] = args.repo_name
    CONFIG["base_url"] = args.base_url
    CONFIG["admin_email"] = args.admin_email

    app.run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
