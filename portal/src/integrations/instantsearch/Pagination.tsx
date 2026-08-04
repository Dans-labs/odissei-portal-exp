import { usePagination } from "react-instantsearch";
import { Button } from "@base-ui/react/button";

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
          <Arrow className="rotate-180" />
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
          <Arrow />
        </Button>
      </div>
    </div>
  );
}

const Arrow = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`size-6 ${className ?? ""}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
    />
  </svg>
);
