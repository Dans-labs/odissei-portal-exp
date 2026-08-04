import { useToggleRefinement } from "react-instantsearch";
import { Checkbox } from "#/components/Checkbox";

export function ToggleRefinement({ attribute, label }: { attribute: string; label: string }) {
  const { value, refine } = useToggleRefinement({ attribute });
  return (
    <Checkbox
      onCheckedChange={(checked) => refine({ isRefined: checked })}
      label={label}
      count={value.count ?? undefined}
      checked={value.isRefined}
    />
  );
}
