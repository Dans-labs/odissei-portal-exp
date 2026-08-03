export function getTypesenseConfig() {
  return {
    apiKey: process.env.TYPESENSE_SEARCH_API_KEY!,
    node: {
      host: process.env.TYPESENSE_HOST!,
      port: Number(process.env.TYPESENSE_PORT!),
      protocol: process.env.TYPESENSE_PROTOCOL as "http" | "https",
      path: process.env.TYPESENSE_PATH ?? "",
    },
  };
}
