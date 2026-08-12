import { createServerFn } from "@tanstack/react-start";
import { renderToString } from "react-dom/server";
import { getServerState, InstantSearch } from "react-instantsearch";
import { createSearchClient } from "./client";
import { getPublicTypesenseConfig } from "./env.server";
import SearchWrapper from "./SearchWrapper";

export const getSearchServerState = createServerFn({ method: "GET" }).handler(async () => {
  const config = getPublicTypesenseConfig();
  const searchClient = createSearchClient(config);
  const serverState = await getServerState(
    <InstantSearch searchClient={searchClient} indexName="datasets">
      <SearchWrapper />
    </InstantSearch>,
    { renderToString },
  );

  return {
    config,
    serverState: JSON.parse(JSON.stringify(serverState)),
  };
});
