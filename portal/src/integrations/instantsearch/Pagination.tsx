import { usePagination, useHitsPerPage } from "react-instantsearch";
import { m } from "#/paraglide/messages";
import { Button } from "@base-ui/react/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { Select } from "@base-ui/react/select";

const buttonClass = `
  h-9
  min-w-9
  rounded-xl
  text-sm
  transition
  hover:bg-zinc-100
  disabled:opacity-30
  cursor-pointer
  disabled:cursor-not-allowed
  flex
  items-center
  justify-center
`;

export function Pagination() {
  const { pages, currentRefinement, refine, isFirstPage, isLastPage } = usePagination();
  const onPageChange = (page: number) => {
    // window.scrollTo({
    //   top: 0,
    //   behavior: 'smooth'
    // });
    refine(page);
  };
  return (
    <div
      className="
        mt-10
        flex
        justify-center
        "
    >
      <div
        className="
          flex
          items-center
          gap-1
          rounded-2xl
          border
          border-zinc-200
          bg-white
          py-1
          px-4
          shadow-sm
          "
      >
        <Button
          disabled={isFirstPage}
          onClick={() => onPageChange(currentRefinement - 1)}
          className={`${buttonClass} disabled:opacity-30`}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${buttonClass} ${page === currentRefinement ? "bg-cyan-600! text-white" : ""}`}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          disabled={isLastPage}
          onClick={() => onPageChange(currentRefinement + 1)}
          className={`${buttonClass} disabled:opacity-30`}
        >
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
      <HitsPerPage />
    </div>
  );
}

function HitsPerPage() {
  const { items, refine } = useHitsPerPage({
    items: [
      { label: "10", value: 10, default: true },
      { label: "20", value: 20 },
      { label: "50", value: 50 },
    ],
  });

  return (
    <Select.Root
      items={items}
      onValueChange={(value) => refine(Number(value))}
      value={items.find(({ isRefined }) => isRefined)?.value.toString() ?? "10"}
    >
      <div
        className="
          flex items-center gap-2 rounded-2xl border border-zinc-200
          bg-white py-1 pl-4 pr-2 shadow-sm ml-2
        "
      >
        <Select.Label className="cursor-default select-none whitespace-nowrap text-sm text-zinc-500">
          {m.hitsPerPage()}
        </Select.Label>

        <Select.Trigger
          className="
            flex h-9 cursor-pointer select-none items-center gap-1.5
            rounded-xl px-2.5 text-sm font-medium text-zinc-900
            transition hover:bg-zinc-100
            data-popup-open:bg-zinc-100
            focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-cyan-500
          "
        >
          <Select.Value placeholder="10" />
          <Select.Icon className="text-zinc-400 transition-transform duration-200 data-popup-open:rotate-180">
            <ChevronDownIcon className="size-3.5" />
          </Select.Icon>
        </Select.Trigger>
      </div>

      <Select.Portal>
        <Select.Positioner sideOffset={6} className="z-50 outline-none">
          <Select.Popup
            className="
              min-w-(--anchor-width) origin-(--transform-origin)
              overflow-hidden rounded-xl border border-zinc-200
              bg-white py-1 shadow-lg
              transition-[transform,opacity] duration-150 ease-out
              data-ending-style:scale-95 data-ending-style:opacity-0
              data-starting-style:scale-95 data-starting-style:opacity-0
            "
          >
            <Select.ScrollUpArrow className="flex h-4 items-center justify-center text-zinc-400">
              <ChevronUpIcon className="size-3.5" />
            </Select.ScrollUpArrow>

            <Select.List>
              {items.map(({ label, value }) => (
                <Select.Item
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
                  <Select.ItemText>{label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-3 flex items-center">
                    <CheckIcon className="size-3.5" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>

            <Select.ScrollDownArrow className="flex h-4 items-center justify-center text-zinc-400">
              <ChevronDownIcon className="size-3.5" />
            </Select.ScrollDownArrow>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
