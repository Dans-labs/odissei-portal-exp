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
          <div className="min-h-screen bg-[#fafaf9] text-zinc-950">
            <div className="mx-auto flex max-w-[1600px] gap-8 px-8 py-8">
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
