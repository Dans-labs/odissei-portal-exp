import { createFileRoute } from "@tanstack/react-router";
import { LoadingIndicator } from "#/integrations/instantsearch/Loading";
import { useMemo } from "react";
import { InstantSearch, InstantSearchSSRProvider } from "react-instantsearch";
import SearchWrapper from "#/integrations/instantsearch/SearchWrapper";
import { createSearchClient } from "#/integrations/instantsearch/client";
import { getSearchServerState } from "#/integrations/instantsearch/search-state";
import { DatasetDrawer } from "#/components/DatasetDrawer";
import { Drawer } from "@base-ui/react/drawer";

export const Route = createFileRoute("/_search")({
  loader: async () => getSearchServerState(),
  component: SearchLayout,
});

function SearchLayout() {
  const { config, serverState } = Route.useLoaderData();
  const searchClient = useMemo(() => createSearchClient(config), [config]);

  return (
    <InstantSearchSSRProvider {...serverState}>
      <Drawer.Provider>
        <Drawer.IndentBackground />
        <InstantSearch searchClient={searchClient} indexName="datasets">
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <LoadingIndicator />
            <SearchWrapper />
            <DatasetDrawer />
          </div>
        </InstantSearch>
      </Drawer.Provider>
    </InstantSearchSSRProvider>
  );
}
