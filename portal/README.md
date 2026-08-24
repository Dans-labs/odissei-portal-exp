# Odissei Portal UI

Multilingual Tanstack Start + TypeScript + Vite Plus frontend for Typesense index.

## Configuration

Copy `.env.example` and fill in the values:

| Variable             | Description                             |
| -------------------- | --------------------------------------- |
| `TYPESENSE_HOST`     | Typesense server location               |
| `TYPESENSE_PORT`     | Typesense server port                   |
| `TYPESENSE_PROTOCOL` | Typesense server protocol (http, https) |
| `TYPESENSE_PATH`     | Optional sub path for Typesense server  |
| `TYPESENSE_API_KEY`  | Your read only API key for Typesense    |

For local development use `.env.development`, for production use `.env.production`.

## Running locally

Make sure Vite Plus is installed. If not, install:

```bash
curl -fsSL https://vite.plus | bash
```

and open a new terminal tab.

When Vite Plus is installed, run:

```bash
vp i
vp dev
```

## Cleanup

Use Vite Plus for linting and code formatting.

```bash
vp check
```

## Building

```bash
vp build
```

## Docker

Build the image:

```bash
docker build \
  -t odissei-portal-ui .
```

Run the container and specify the required runtime variables:

```bash
docker run --env-file .env.production -p 3000:3000 odissei-portal-ui
```

The app will be available at http://localhost:3000.
