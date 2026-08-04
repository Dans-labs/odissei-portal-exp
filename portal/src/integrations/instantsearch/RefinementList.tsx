import { useRefinementList } from "react-instantsearch";
import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";

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
        <label
          key={item.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-900"
        >
          <Checkbox.Root
            value={item.value}
            className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white transition-colors data-[checked]:border-black data-[checked]:bg-black"
          >
            <Checkbox.Indicator>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>

          <span>{item.label}</span>
          <span className="text-gray-500">({item.count})</span>
        </label>
      ))}
    </CheckboxGroup>
  );
}

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-3 w-3 text-white"
  >
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);
