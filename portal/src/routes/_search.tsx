import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { InstantSearch, InstantSearchSSRProvider } from "react-instantsearch";
import { createSearchClient } from "#/integrations/instantsearch/client";
import { getSearchServerState } from "#/integrations/instantsearch/search-state";
import { FacetSidebar } from "#/components/FacetSidebar";
import { Hits } from "#/integrations/instantsearch/Hits";
import { Pagination } from "#/integrations/instantsearch/Pagination";
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
          <div className="mx-auto grid max-w-6xl grid-cols-[280px_1fr] gap-8 p-6">
            <FacetSidebar />
            <main className="relative">
              <Hits />
              <Pagination />
              <DatasetDrawer />
            </main>
          </div>
        </InstantSearch>
      </Drawer.Provider>
    </InstantSearchSSRProvider>
  );
}
