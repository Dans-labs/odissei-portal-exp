type NodeConfig = {
  host: string;
  port: number;
  protocol: "http" | "https";
  path?: string;
};

function getNode(): NodeConfig {
  return {
    host: process.env.TYPESENSE_HOST!,
    port: Number(process.env.TYPESENSE_PORT!),
    protocol: process.env.TYPESENSE_PROTOCOL as "http" | "https",
    path: process.env.TYPESENSE_PATH ?? "",
  };
}

// Ships to the browser via InstantSearch — must be a search-only scoped key
export function getPublicTypesenseConfig() {
  return {
    apiKey: process.env.TYPESENSE_API_KEY!,
    node: getNode(),
  };
}
