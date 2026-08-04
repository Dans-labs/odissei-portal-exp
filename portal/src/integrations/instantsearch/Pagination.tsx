import { usePagination } from "react-instantsearch";

export function Pagination() {
  const { pages, currentRefinement, refine, isFirstPage, isLastPage } = usePagination();
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
      <button
        disabled={isFirstPage}
        onClick={() => refine(currentRefinement - 1)}
        className="disabled:opacity-30"
      >
        Prev
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => refine(page)}
          className={page === currentRefinement ? "font-semibold underline" : ""}
        >
          {page + 1}
        </button>
      ))}
      <button
        disabled={isLastPage}
        onClick={() => refine(currentRefinement + 1)}
        className="disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
