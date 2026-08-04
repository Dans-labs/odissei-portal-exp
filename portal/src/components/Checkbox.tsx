import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";

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
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-900">
      <BaseCheckbox.Root
        {...(checked ? { checked } : {})}
        {...(onCheckedChange ? { onCheckedChange } : {})}
        value={value}
        className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white transition-colors data-[checked]:border-black data-[checked]:bg-black"
      >
        <BaseCheckbox.Indicator>
          <CheckIcon />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>

      <span>{label}</span>
      {count && <span className="text-gray-500">({count})</span>}
    </label>
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
