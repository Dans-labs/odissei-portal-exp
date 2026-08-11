import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "@heroicons/react/24/solid";

export function Select({
  onValueChange,
  items,
  value,
  label,
}: {
  onValueChange: (value: string | null) => void;
  items: { label: string; value: string }[];
  value: string;
  label: string;
}) {
  return (
    <BaseSelect.Root
      items={items}
      onValueChange={(val) => onValueChange(val)}
      value={value.toString()}
    >
      <div
        className="
          flex items-center gap-2 rounded-2xl border border-zinc-200
          bg-white py-1 pl-4 pr-2 shadow-sm
        "
      >
        <BaseSelect.Label className="cursor-default select-none whitespace-nowrap text-sm text-zinc-500">
          {label}
        </BaseSelect.Label>

        <BaseSelect.Trigger
          className="
            flex h-9 cursor-pointer select-none items-center gap-1.5
            rounded-xl px-2.5 text-sm font-medium text-zinc-900
            transition hover:bg-zinc-100
            data-popup-open:bg-zinc-100
            focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-cyan-500
          "
        >
          <BaseSelect.Value placeholder="10" />
          <BaseSelect.Icon className="text-zinc-400 transition-transform duration-200 data-popup-open:rotate-180">
            <ChevronDownIcon className="size-3.5" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>

      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="z-50 outline-none">
          <BaseSelect.Popup
            className="
              min-w-(--anchor-width) origin-(--transform-origin)
              overflow-hidden rounded-xl border border-zinc-200
              bg-white py-1 shadow-lg
              transition-[transform,opacity] duration-150 ease-out
              data-ending-style:scale-95 data-ending-style:opacity-0
              data-starting-style:scale-95 data-starting-style:opacity-0
            "
          >
            <BaseSelect.ScrollUpArrow className="flex h-4 items-center justify-center text-zinc-400">
              <ChevronUpIcon className="size-3.5" />
            </BaseSelect.ScrollUpArrow>

            <BaseSelect.List>
              {items.map(({ label, value }) => (
                <BaseSelect.Item
                  key={value}
                  value={value}
                  className="
                    relative flex cursor-pointer select-none items-center
                    gap-2 py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none
                    transition-colors
                    data-highlighted:bg-linear-to-r data-highlighted:from-cyan-500
                    data-highlighted:to-blue-600 data-highlighted:text-white
                  "
                >
                  <BaseSelect.ItemText>{label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="absolute right-3 flex items-center">
                    <CheckIcon className="size-3.5" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>

            <BaseSelect.ScrollDownArrow className="flex h-4 items-center justify-center text-zinc-400">
              <ChevronDownIcon className="size-3.5" />
            </BaseSelect.ScrollDownArrow>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
