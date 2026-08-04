import { useSearchBox } from "react-instantsearch";

export function SearchBox() {
  const { query, refine } = useSearchBox();
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => refine(e.target.value)}
      placeholder="Search…"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
    />
  );
}
