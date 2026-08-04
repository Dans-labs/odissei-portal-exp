import { useHits } from "react-instantsearch";
import { Link } from "@tanstack/react-router";
import { m } from "#/paraglide/messages";

type DatasetHit = {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  data_source: string;
  license?: string;
};

export function Hits() {
  const { items, results } = useHits<DatasetHit>();
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500 text-right">
        {m.resultCount({ count: results?.nbHits ?? 0 })}
      </p>
      <div className="space-y-4">
        {items.map((hit) => (
          <Link
            to="/view/$"
            params={{ _splat: hit.id }}
            className="
    group
    block
    rounded-3xl
    border border-zinc-200
    bg-white
    p-6
    transition-all
    hover:-translate-y-0.5
    hover:border-zinc-300
    hover:shadow-lg
    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-cyan-100
  "
          >
            <article>
              <h3
                className="
        text-lg
        font-semibold
        tracking-tight
        text-zinc-950
        transition
        group-hover:text-cyan-600
      "
              >
                {hit.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{hit.data_source}</Badge>

                {hit.license && <Badge>{hit.license}</Badge>}
              </div>

              {hit.description && (
                <p
                  className="
          mt-4
          line-clamp-2
          text-sm
          leading-6
          text-zinc-600
        "
                >
                  {hit.description}
                </p>
              )}

              {hit.authors?.length && (
                <p className="mt-5 text-xs text-zinc-400">{hit.authors.join(", ")}</p>
              )}
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
      rounded-full
      bg-zinc-100
      px-3
      py-1
      text-xs
      font-medium
      text-zinc-600
    "
    >
      {children}
    </span>
  );
}
