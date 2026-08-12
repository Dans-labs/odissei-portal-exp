// Rendered on both the server (getServerState) and the client (SearchLayout),
// from the same import, so the two trees can never drift out of sync and
// silently break SSR caching again.
import { FacetSidebar } from "#/components/FacetSidebar";
import { Hits } from "./Hits";
import { Pagination } from "./Pagination";

export default function SearchWrapper() {
  return (
    <div className="mx-auto flex flex-col md:flex-row max-w-[1600px] gap-4 px-4 py-4 md:gap-8 md:px-8 md:py-8">
      <FacetSidebar />
      <main className="min-w-0 flex-1">
        <Hits />
        <Pagination />
      </main>
    </div>
  );
}
