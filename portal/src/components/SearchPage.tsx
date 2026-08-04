import { Hits } from "#/integrations/instantsearch/Hits";
import { Pagination } from "#/integrations/instantsearch/Pagination";

export function SearchPage() {
  return (
    <main>
      <Hits />
      <Pagination />
    </main>
  );
}
