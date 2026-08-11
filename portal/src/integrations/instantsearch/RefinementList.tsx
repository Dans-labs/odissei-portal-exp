import { useState } from "react";
import { m } from "#/paraglide/messages";
import { useRefinementList } from "react-instantsearch";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Checkbox } from "#/components/Checkbox";

export function RefinementList({
  attribute,
  searchable = false,
  limit = 8,
  showMoreLimit = 40,
}: {
  attribute: string;
  searchable?: boolean;
  limit?: number;
  showMoreLimit?: number;
}) {
  const [query, setQuery] = useState("");

  const { items, refine, searchForItems, canToggleShowMore, toggleShowMore, isShowingMore } =
    useRefinementList({ attribute, limit, showMore: true, showMoreLimit });

  const selectedValues = items.filter((item) => item.isRefined).map((item) => item.value);

  return (
    <div className="space-y-2">
      {searchable && (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchForItems(e.target.value);
          }}
          placeholder="Filter…"
          className="
            w-full rounded-lg border border-zinc-200 bg-zinc-50
            px-2.5 py-1.5 text-xs outline-none
            transition
            placeholder:text-zinc-400
            focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100
          "
        />
      )}

      <CheckboxGroup
        aria-label={attribute}
        value={selectedValues}
        onValueChange={(nextValues) => {
          const previous = new Set(selectedValues);
          const next = new Set(nextValues);
          previous.forEach((value) => {
            if (!next.has(value)) refine(value);
          });
          next.forEach((value) => {
            if (!previous.has(value)) refine(value);
          });
        }}
        className="space-y-1.5"
      >
        {items.length === 0 && <p className="py-1 text-xs text-zinc-400">{m.noMatches()}</p>}
        {items.map((item) => (
          <Checkbox key={item.value} label={item.label} value={item.value} count={item.count} />
        ))}
      </CheckboxGroup>

      {canToggleShowMore && (
        <button
          onClick={toggleShowMore}
          className="text-xs font-medium text-cyan-600 transition hover:text-cyan-700 cursor-pointer"
        >
          {isShowingMore ? m.showLess() : m.showMore()}
        </button>
      )}
    </div>
  );
}
