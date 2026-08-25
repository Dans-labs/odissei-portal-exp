type NodeConfig = {
  host: string;
  port: number;
  protocol: "http" | "https";
  path?: string;
};

function getInternalNode(): NodeConfig {
  // SSR only — resolves via Docker's internal network (typesense:8108).
  return {
    host: process.env.TYPESENSE_HOST!,
    port: Number(process.env.TYPESENSE_PORT!),
    protocol: process.env.TYPESENSE_PROTOCOL as "http" | "https",
    path: process.env.TYPESENSE_PATH ?? "",
  };
}

function getPublicNode(): NodeConfig {
  // Ships to the browser — must be publicly reachable, since this is what
  // powers every refinement after the initial SSR render. Falls back to
  // the internal values so dev (where both are localhost) needs no extra
  // env vars.
  return {
    host: process.env.TYPESENSE_PUBLIC_HOST ?? process.env.TYPESENSE_HOST!,
    port: Number(process.env.TYPESENSE_PUBLIC_PORT ?? process.env.TYPESENSE_PORT!),
    protocol: (process.env.TYPESENSE_PUBLIC_PROTOCOL ?? process.env.TYPESENSE_PROTOCOL) as
      | "http"
      | "https",
    path: process.env.TYPESENSE_PATH ?? "",
  };
}

// SSR-side fetch only — never send this one to the browser.
export function getInternalTypesenseConfig() {
  return {
    apiKey: process.env.TYPESENSE_API_KEY!,
    node: getInternalNode(),
  };
}

// Ships to the browser via InstantSearch — must be a search-only scoped key
export function getPublicTypesenseConfig() {
  return {
    apiKey: process.env.TYPESENSE_API_KEY!,
    node: getPublicNode(),
  };
}
