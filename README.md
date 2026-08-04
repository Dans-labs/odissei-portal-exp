# Experimental Odissei Portal
Runs the portal without Dataverse. Data flattener for harvested data. Uses Typesense for searching, a Tanstack Start and React based frontend, and a Flask server for OAI PMH functionality.

## Flatten data
```bash
python3 flatten_datasets.py ./data ./flattened_output
```

## Setup Typesense
1. Copy env template and start Typesense
```bash
cd typsense
cp .env.example .env    # edit the API key for anything beyond local dev
docker compose up -d
```

2. Create the collection
```bash
pip install typesense
python3 setup_typesense_collection.py --api-key xyz-local-dev-key
```

3. Bulk import
```bash
python3 import_to_typesense.py ../flattened_output/all_datasets.jsonl --api-key xyz-local-dev-key
```

## Setup OAI PMH server
```bash
python3 build_oai_index.py ./flattened_output/all_datasets.jsonl ./oai_index.sqlite3 --repo-domain yourdomain.nl
python3 oai_pmh_server.py --db ./oai_index.sqlite3 --repo-name "Your Portal" --base-url https://yourdomain.nl/oai --admin-email you@yourdomain.nl
```

## Frontend
See [Portal readme](/portal/README.md)
