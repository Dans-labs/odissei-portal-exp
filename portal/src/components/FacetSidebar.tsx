import { ClearRefinements } from "react-instantsearch";
import { SearchBox } from "#/integrations/instantsearch/SearchBox";
import { RefinementList } from "#/integrations/instantsearch/RefinementList";
import { ToggleRefinement } from "#/integrations/instantsearch/ToggleRefinement";
import { RangeInput } from "#/integrations/instantsearch/RangeInput";
import { m } from "#/paraglide/messages";
import { useCurrentRefinements } from "react-instantsearch";

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
      <div className="space-y-6">
        <SearchBox />

        {items.length > 0 && (
          <ClearRefinements
            classNames={{
              button: `
                w-full rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-600
                px-4 py-2
                text-sm font-medium text-white
                shadow-sm
                transition
                hover:brightness-105
                active:scale-[0.98]
                cursor-pointer
                `,
            }}
          />
        )}

        <FilterSection title={m.dataSource()}>
          <RefinementList attribute="data_source" />
        </FilterSection>

        <FilterSection title={m.subjects()}>
          <RefinementList attribute="subjects" />
        </FilterSection>

        <FilterSection title={m.license()}>
          <RefinementList attribute="license" />
        </FilterSection>

        <FilterSection title={m.language()}>
          <RefinementList attribute="languages" />
        </FilterSection>

        <FilterSection title={m.accessConditions()}>
          <ToggleRefinement attribute="file_access_request" label={m.restrictedAccess()} />
        </FilterSection>

        <RangeInput attribute="file_count" label={m.fileCount()} />
      </div>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>

      {children}
    </section>
  );
}
