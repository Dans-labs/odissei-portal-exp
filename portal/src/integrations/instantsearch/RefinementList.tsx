import { useRefinementList } from "react-instantsearch";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Checkbox } from "#/components/Checkbox";

export function RefinementList({ attribute }: { attribute: string }) {
  const { items, refine } = useRefinementList({ attribute });

  const selectedValues = items.filter((item) => item.isRefined).map((item) => item.value);

  return (
    <CheckboxGroup
      aria-label={attribute}
      value={selectedValues}
      onValueChange={(nextValues) => {
        const previous = new Set(selectedValues);
        const next = new Set(nextValues);

        // Toggle removed values
        previous.forEach((value) => {
          if (!next.has(value)) {
            refine(value);
          }
        });

        // Toggle added values
        next.forEach((value) => {
          if (!previous.has(value)) {
            refine(value);
          }
        });
      }}
      className="space-y-2"
    >
      {items.map((item) => (
        <Checkbox key={item.value} label={item.label} value={item.value} count={item.count} />
      ))}
    </CheckboxGroup>
  );
}
