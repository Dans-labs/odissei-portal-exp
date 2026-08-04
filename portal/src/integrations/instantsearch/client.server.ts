import Typesense from "typesense";
import { getPublicTypesenseConfig } from "./env.server";

export function createTypesenseClient() {
  const config = getPublicTypesenseConfig();
  return new Typesense.Client({
    apiKey: config.apiKey,
    nodes: [config.node],
    connectionTimeoutSeconds: 5,
  });
}
