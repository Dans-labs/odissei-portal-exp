import { usePagination, useHitsPerPage } from "react-instantsearch";
import { m } from "#/paraglide/messages";
import { Button } from "@base-ui/react/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Select } from "#/components/Select";

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
        flex-wrap
        gap-2
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
    <Select
      onValueChange={(value) => refine(Number(value))}
      items={items.map(({ label, value }) => ({ label, value: value.toString() }))}
      value={items.find(({ isRefined }) => isRefined)?.value.toString() ?? "10"}
      label={m.hitsPerPage()}
    />
  );
}
