import { createFileRoute } from "@tanstack/react-router";
import { LoadingIndicator } from "#/integrations/instantsearch/Loading";
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
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <LoadingIndicator />
            <div className="mx-auto flex flex-col md:flex-row max-w-[1600px] gap-4 px-4 py-4 md:gap-8 md:px-8 md:py-8">
              <FacetSidebar />
              <main className="min-w-0 flex-1">
                <Hits />
                <Pagination />
                <DatasetDrawer />
              </main>
            </div>
          </div>
        </InstantSearch>
      </Drawer.Provider>
    </InstantSearchSSRProvider>
  );
}
