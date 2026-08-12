import { useSearchBox } from "react-instantsearch";
import { Input } from "#/components/Input";
import { m } from "#/paraglide/messages";

export function SearchBox() {
  const { query, refine } = useSearchBox();
  return (
    <div className="relative">
      <Input
        type="search"
        value={query}
        onChange={(value) => refine(value)}
        placeholder={m.searchPlaceholder()}
        size="lg"
      />
    </div>
  );
}
