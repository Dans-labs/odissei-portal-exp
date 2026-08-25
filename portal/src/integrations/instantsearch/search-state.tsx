import { createServerFn } from "@tanstack/react-start";
import { renderToString } from "react-dom/server";
import { getServerState, InstantSearch } from "react-instantsearch";
import { createSearchClient } from "./client";
import { getInternalTypesenseConfig, getPublicTypesenseConfig } from "./env.server";
import SearchWrapper from "./SearchWrapper";

export const getSearchServerState = createServerFn({ method: "GET" }).handler(async () => {
  const searchClient = createSearchClient(getInternalTypesenseConfig()); // SSR only

  const serverState = await getServerState(
    <InstantSearch searchClient={searchClient} indexName="datasets">
      <SearchWrapper />
    </InstantSearch>,
    { renderToString },
  );

  return {
    config: getPublicTypesenseConfig(), // <-- this is what the client hydrates with
    serverState: JSON.parse(JSON.stringify(serverState)),
  };
});
