import { ClearRefinements, useCurrentRefinements } from "react-instantsearch";
import { SearchBox } from "#/integrations/instantsearch/SearchBox";
import { RefinementList } from "#/integrations/instantsearch/RefinementList";
import { ToggleRefinement } from "#/integrations/instantsearch/ToggleRefinement";
import { RangeInput } from "#/integrations/instantsearch/RangeInput";
import { YearFilter } from "#/integrations/instantsearch/YearFilter";
import { FilterSection } from "./FilterSection";
import { m } from "#/paraglide/messages";
import {
  CircleStackIcon,
  CalendarIcon,
  ScaleIcon,
  TagIcon,
  GlobeAltIcon,
  HashtagIcon,
  LockClosedIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

export function FacetSidebar() {
  const { items } = useCurrentRefinements();

  return (
    <aside
      className="
        sticky top-8 h-fit w-80 shrink-0
        rounded-3xl border border-zinc-200/80
        bg-white/80 p-6 shadow-sm backdrop-blur
      "
    >
      <div className="space-y-5">
        <SearchBox />

        {items.length > 0 && (
          <ClearRefinements
            classNames={{
              button: `
                w-full rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-600
                px-4 py-2
                text-sm font-medium text-white
                shadow-sm transition hover:brightness-105
                active:scale-[0.98] cursor-pointer
              `,
            }}
          />
        )}

        <div className="space-y-5 [&>section]:pt-5 [&>section:first-child]:pt-0">
          <FilterSection title={m.dataSource()} icon={<CircleStackIcon className="size-4" />}>
            <RefinementList attribute="data_source" />
          </FilterSection>

          <FilterSection title={m.publicationYear()} icon={<CalendarIcon className="size-4" />}>
            <YearFilter attribute="publication_year" />
          </FilterSection>

          <FilterSection title={m.license()} icon={<ScaleIcon className="size-4" />}>
            <RefinementList attribute="license" />
          </FilterSection>

          <FilterSection title={m.subjects()} icon={<TagIcon className="size-4" />}>
            <RefinementList attribute="subjects" searchable showMoreLimit={40} />
          </FilterSection>

          <FilterSection
            title={m.language()}
            icon={<GlobeAltIcon className="size-4" />}
            defaultOpen={false}
          >
            <RefinementList attribute="languages" />
          </FilterSection>

          <FilterSection
            title={m.keywords()}
            icon={<HashtagIcon className="size-4" />}
            defaultOpen={false}
          >
            <RefinementList attribute="keywords" searchable showMoreLimit={60} />
          </FilterSection>

          <FilterSection
            title={m.accessConditions()}
            icon={<LockClosedIcon className="size-4" />}
            defaultOpen={false}
          >
            <ToggleRefinement attribute="file_access_request" label={m.restrictedAccess()} />
          </FilterSection>

          <FilterSection
            title={m.fileCount()}
            icon={<DocumentIcon className="size-4" />}
            defaultOpen={false}
          >
            <RangeInput attribute="file_count" label={m.fileCount()} />
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}
