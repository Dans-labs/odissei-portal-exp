import { useSearchBox } from "react-instantsearch";
import { Input } from "@base-ui/react/input";
import { m } from "#/paraglide/messages";

export function SearchBox() {
  const { query, refine } = useSearchBox();
  return (
    <div className="relative">
      <Input
        type="search"
        value={query}
        onChange={(e) => refine(e.target.value)}
        placeholder={m.searchPlaceholder()}
        className="
        h-12 w-full
        rounded-2xl
        border border-zinc-200
        bg-zinc-50
        px-4
        text-sm
        outline-none
        transition
        placeholder:text-zinc-400
        focus:border-zinc-400
        focus:bg-white
        focus:ring-4
        focus:ring-zinc-100
      "
      />
    </div>
  );
}
