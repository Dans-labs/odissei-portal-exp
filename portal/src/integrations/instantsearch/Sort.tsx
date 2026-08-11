import { useSortBy } from "react-instantsearch";
import { Select } from "#/components/Select";

export function SortBy() {
  const { options, currentRefinement, refine } = useSortBy({
    items: [
      { value: "datasets", label: "Relevance" },
      { value: "datasets/sort/title:asc", label: "Title (A-Z)" },
      { value: "datasets/sort/title:desc", label: "Title (Z-A)" },
    ],
  });

  return (
    <Select
      onValueChange={(value) => refine(value ?? "")}
      items={options.map((item) => ({ label: item.label, value: item.value }))}
      value={currentRefinement}
      label="Sort by"
    />
  );
}
