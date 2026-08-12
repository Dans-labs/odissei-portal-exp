import { useSortBy } from "react-instantsearch";
import { Select } from "#/components/Select";
import { m } from "#/paraglide/messages";

export function SortBy() {
  const { options, currentRefinement, refine } = useSortBy({
    items: [
      { value: "datasets", label: m.sortByRelevance() },
      { value: "datasets/sort/title:asc", label: m.sortByTitleAsc() },
      { value: "datasets/sort/title:desc", label: m.sortByTitleDesc() },
      { value: "datasets/sort/date_of_deposit_timestamp:asc", label: m.sortByDateOfDepositAsc() },
      { value: "datasets/sort/date_of_deposit_timestamp:desc", label: m.sortByDateOfDepositDesc() },
    ],
  });

  return (
    <Select
      onValueChange={(value) => refine(value ?? "")}
      items={options.map((item) => ({ label: item.label, value: item.value }))}
      value={currentRefinement}
      label={m.sortBy()}
    />
  );
}
