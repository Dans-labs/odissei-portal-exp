import { useState } from "react";
import { m } from "#/paraglide/messages";
import { useRefinementList } from "react-instantsearch";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Checkbox } from "#/components/Checkbox";
import { Input } from "#/components/Input";

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

  const onChange = (value: string) => {
    setQuery(value);
    searchForItems(value);
  };

  const selectedValues = items.filter((item) => item.isRefined).map((item) => item.value);

  return (
    <div className="space-y-2">
      {searchable && <Input value={query} onChange={onChange} placeholder={m.filter()} size="sm" />}

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
        {items.length === 0 && <p className="py-1 text-xs text-gray-400">{m.noMatches()}</p>}
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
