import { ClearRefinements } from "react-instantsearch";
import { SearchBox } from "#/integrations/instantsearch/SearchBox";
import { RefinementList } from "#/integrations/instantsearch/RefinementList";
import { ToggleRefinement } from "#/integrations/instantsearch/ToggleRefinement";
import { RangeInput } from "#/integrations/instantsearch/RangeInput";

export function FacetSidebar() {
  return (
    <aside className="space-y-6">
      <SearchBox />
      <ClearRefinements classNames={{ button: "text-sm text-blue-600" }} />
      <div>
        <p className="mb-2 font-medium">Data source</p>
        <RefinementList attribute="data_source" />
      </div>
      <div>
        <p className="mb-2 font-medium">Subjects</p>
        <RefinementList attribute="subjects" />
      </div>
      <div>
        <p className="mb-2 font-medium">License</p>
        <RefinementList attribute="license" />
      </div>
      <div>
        <p className="mb-2 font-medium">Language</p>
        <RefinementList attribute="languages" />
      </div>
      <ToggleRefinement attribute="file_access_request" label="Restricted access" />
      <ToggleRefinement attribute="has_restricted_files" label="Has restricted files" />
      <RangeInput attribute="file_count" label="File count" />
    </aside>
  );
}
