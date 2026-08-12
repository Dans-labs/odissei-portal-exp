import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckIcon } from "@heroicons/react/24/solid";

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  count,
  value,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
  count?: number;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <BaseCheckbox.Root
        {...(checked ? { checked } : {})}
        {...(onCheckedChange ? { onCheckedChange } : {})}
        value={value}
        className="flex shrink-0 h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 transition-colors data-checked:bg-cyan-600"
      >
        <BaseCheckbox.Indicator>
          <CheckIcon className="size-3 text-white" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>

      <span>
        {label}{" "}
        {count && (
          <span className="bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-md px-1 py-0.5">
            {count}
          </span>
        )}
      </span>
    </label>
  );
}
