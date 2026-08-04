import { useToggleRefinement } from "react-instantsearch";

export function ToggleRefinement({ attribute, label }: { attribute: string; label: string }) {
  const { value, refine } = useToggleRefinement({ attribute });
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={value.isRefined}
        onChange={(e) => refine({ isRefined: !e.target.checked })}
      />
      {label} <span className="text-gray-400">({value.count})</span>
    </label>
  );
}
