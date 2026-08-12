import { usePagination, useHitsPerPage } from "react-instantsearch";
import { m } from "#/paraglide/messages";
import { Button } from "@base-ui/react/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Select } from "#/components/Select";
import { cn } from "#/utils/cn";
import { card, button, paginationButton, gradient } from "#/utils/surfaces";

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
    <div className="mt-10 flex justify-center flex-wrap gap-4">
      <div className={cn(card, "flex py-2")}>
        <Button
          disabled={isFirstPage}
          onClick={() => onPageChange(currentRefinement - 1)}
          className={cn(button, paginationButton)}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(button, paginationButton, page === currentRefinement ? gradient : "")}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          disabled={isLastPage}
          onClick={() => onPageChange(currentRefinement + 1)}
          className={cn(button, paginationButton)}
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
