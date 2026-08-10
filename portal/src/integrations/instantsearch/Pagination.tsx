import { usePagination } from "react-instantsearch";
import { Button } from "@base-ui/react/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

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
          onClick={() => refine(currentRefinement - 1)}
          className={`${buttonClass} disabled:opacity-30`}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            onClick={() => refine(page)}
            className={`${buttonClass} ${page === currentRefinement ? "bg-cyan-600! text-white" : ""}`}
          >
            {page + 1}
          </Button>
        ))}
        <Button
          disabled={isLastPage}
          onClick={() => refine(currentRefinement + 1)}
          className={`${buttonClass} disabled:opacity-30`}
        >
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
