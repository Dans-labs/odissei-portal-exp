# Experimental Odissei Portal

Runs the portal without Dataverse. Flattens harvested data into a shape suitable for indexing. Uses Typesense for search, a TanStack Start + React frontend, and a Flask server for OAI-PMH functionality.

## Local development

Typesense runs in Docker; the frontend runs on your host via `pnpm dev` (not containerized in dev — see `docker-compose.override.yml`, which only adjusts the `typesense` service).

1. **Start Typesense**

```bash
   cp .env.example .env   # set TYPESENSE_API_KEY
   docker compose up -d
```

   `docker-compose.override.yml` is auto-loaded here, so this also publishes `8108` to `localhost` and enables permissive CORS — neither of which happens in prod.

2. **Flatten your source data.** Two flatteners depending on where your data comes from:

```bash
   # DOI-folder/metadata/dataset-metadata.json source
   cd typesense
   python3 flatten_datasets.py ../raw-data ../flattened_output

   # native Dataverse API export (DOI-folder/source/dataverse-json-export.json)
   python3 flatten_dataverse_datasets.py ../raw-data ../flattened_output
```

   Both write to the same `flattened_output/` shape (per-dataset JSON + a combined `all_datasets.jsonl`), so records from either source import into the same collection.

3. **Create the collection**

```bash
   pip install typesense
   python3 setup_typesense_collection.py --api-key xyz-local-dev-key
   # add --drop to wipe and recreate after a schema change
```

4. **Bulk import**

```bash
   python3 import_to_typesense.py ../flattened_output/all_datasets.jsonl --api-key xyz-local-dev-key
```

5. **Run the frontend** — see [Portal README](/portal/README.md). Its `portal/.env` already points at `localhost:8108` with the dev key, matching what step 1 published.

## Production deployment

Typesense is **not exposed to the host or internet directly** — only reachable via the internal Docker network (`app-internal`) and, publicly, through Traefik. `docker-compose.prod.yml` adds the Traefik routing labels and the frontend's public Typesense config on top of the base file; it's never used alone.

### Prerequisites

- Traefik is already running on the host and its network is named
  `traefik-network` (external, not created by this repo). Confirm with
  `docker network ls` — if it's named differently, update `traefik-network`
  in both the `networks:` block and every `traefik.docker.network=` label
  in `docker-compose.prod.yml`.

### First-time setup

1. **Set the real secrets**

```bash
   # /.env — admin/write key, server + scripts only, never shipped to the browser
   openssl rand -hex 32   # paste the result as TYPESENSE_API_KEY
```

```bash
   # /portal/.env.production — filled in during key generation below
   TYPESENSE_API_KEY=
```

2. **DNS**: point both subdomains at the server's IP before bringing Traefik up (needed for Let's Encrypt's HTTP-01 challenge, which requires port 80 reachable). E.g.:

```bash
odissei-index.dansdemo.nl A/AAAA -> <server IP> # Typesense
odissei-portal.dansdemo.nl A/AAAA -> <server IP> # frontend
```

3. **Bring up Typesense + frontend**

```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build
```

   - `-f docker-compose.prod.yml` adds the Traefik labels and `TYPESENSE_PUBLIC_*` env vars, and (via explicit `-f`) suppresses the dev-only override file.
   - `--profile prod` turns on the `frontend` service (off by default so a plain `docker compose up` in dev never tries to build/run it).
   - `--build` matters here specifically — `up -d` alone reuses whatever image already exists; only `--build` re-runs `pnpm run build` inside the Dockerfile with current source. A plain `--force-recreate` restarts the *container*, not the *image* — use `--build` any time frontend source changed, `--force-recreate` alone is only enough for an env-var-only change.

4. **Create the collection and populate it**, via the `tools` profile — a one-off container on the same internal network, so scripts reach Typesense by its Docker DNS name (`typesense`) without any port ever being exposed:

```bash
   docker compose --profile tools run --rm tools setup_typesense_collection.py \
     --host typesense --port 8108 --api-key "$TYPESENSE_API_KEY"

   docker compose --profile tools run --rm tools import_to_typesense.py \
     /data/flattened_output/all_datasets.jsonl \
     --host typesense --port 8108 --api-key "$TYPESENSE_API_KEY"
```

   (`flattened_output/` needs to actually exist on the server — sync it over via `rsync`/`scp`, or re-run the flatten step on the server itself.)

5. **Generate the frontend's scoped API key.** Search-only, but also needs `documents:get` for the detail-page single-record lookup:

```bash
   docker compose --profile tools run --rm tools create_search_key.py --host typesense --port 8108
```

   Copy the printed value into `portal/.env.production`, then rebuild/recreate the frontend so it picks it up:

```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build frontend
```

   This key is scoped to `["documents:search", "documents:get"]` on the `datasets` collection only — no write access, can't touch any other collection.

### Redeploying after changes

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build
```

Same command covers code changes, dependency bumps, or Dockerfile edits. If you only changed an env var in `docker-compose.prod.yml` (no source change), `--force-recreate` instead of `--build` is enough and faster.

### Re-running admin scripts later (new data, schema change, key rotation)

Always via the `tools` profile — never by exposing Typesense's port:

```bash
# after a schema change in typesense_schema.py:
docker compose --profile tools run --rm tools setup_typesense_collection.py \
  --host typesense --port 8108 --api-key "$TYPESENSE_API_KEY" --drop

docker compose --profile tools run --rm tools import_to_typesense.py \
  /data/flattened_output/all_datasets.jsonl \
  --host typesense --port 8108 --api-key "$TYPESENSE_API_KEY"
```

### Notes on the prod setup

- **Healthcheck** doesn't use `curl` — the official Typesense image doesn't ship it. It's a raw TCP probe via bash instead (see `docker-compose.yml`).
- **CORS** is enforced by Traefik middleware (`typesense-cors`), locked to `https://odissei-portal.dansdemo.nl` — Typesense's own `TYPESENSE_ENABLE_CORS` is `false` in prod (only `true` in the dev override).
- **Rate limiting** on the Typesense router via Traefik's `ratelimit` middleware (20 req/s average, burst 50) — tune in `docker-compose.prod.yml` if needed.
- **The admin API is technically reachable over the public domain too** (Traefik's rule is a plain `Host(...)` with no path restriction) — the admin key, not network isolation, is what actually protects collection-management endpoints once Traefik's in front of it. Keep that key long/random and don't reuse it anywhere else.
- **`TYPESENSE_PUBLIC_HOST`/`PORT`/`PROTOCOL`** in `docker-compose.prod.yml` exist because the frontend uses two different Typesense configs: an internal one (`typesense:8108`) for its own SSR fetch, and a public one (`odissei-index.dansdemo.nl:443`) that gets sent to the browser for every refinement after hydration. Mixing these up is the most common thing to break after a deploy — if refinements in the browser start erroring with a `typesense:8108` URL in the console, it almost always means the frontend image wasn't actually rebuilt (see the `--build` note above).

## Setup OAI-PMH server

Not currently containerized — run directly:

```bash
cd typesense
python3 build_oai_index.py ../flattened_output/all_datasets.jsonl ../oai_index.sqlite3 --repo-domain yourdomain.nl
python3 oai_pmh_server.py --db ../oai_index.sqlite3 --repo-name "Your Portal" --base-url https://yourdomain.nl/oai --admin-email you@yourdomain.nl
```

## Frontend

See [Portal README](/portal/README.md).