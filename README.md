# 1. Copy env template and start Typesense
cp .env.example .env    # edit the API key for anything beyond local dev
docker compose up -d

# 2. Flatten your source data (if not already done)
python3 flatten_datasets.py ./doi-folders ./flattened_output

# 3. Create the collection
pip install typesense
python3 setup_typesense_collection.py --api-key xyz-local-dev-key

# 4. Bulk import
python3 import_to_typesense.py ./flattened_output/all_datasets.jsonl --api-key xyz-local-dev-key

# OAI PMH
python3 build_oai_index.py ./flattened_output/all_datasets.jsonl ./oai_index.sqlite3 --repo-domain yourdomain.nl
python3 oai_pmh_server.py --db ./oai_index.sqlite3 --repo-name "Your Portal" --base-url https://yourdomain.nl/oai --admin-email you@yourdomain.nl

# Frontend
See portal