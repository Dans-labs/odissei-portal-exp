import { useHits } from "react-instantsearch";
import { Link } from "@tanstack/react-router";
import { m } from "#/paraglide/messages";
import { CalendarIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";
import { SourceBadge, LicenseBadge, FileCountBadge } from "#/components/Badges";
import { formatDate } from "#/utils/formatters";

type DatasetHit = {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  data_source: string;
  license?: string;
  date_of_deposit?: string;
  doi?: string;
  doi_url?: string;
  file_count?: number;
  file_access_request?: boolean;
};

export function Hits() {
  const { items, results } = useHits<DatasetHit>();

  return (
    <div>
      <p className="mb-4 text-right text-sm text-gray-500">
        {m.resultCount({ count: results?.nbHits ?? 0 })}
      </p>
      <div className="space-y-4">
        {items.map((hit) => (
          <ResultCard key={hit.id} hit={hit} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ hit }: { hit: DatasetHit }) {
  const formattedDate = formatDate(hit.date_of_deposit);

  return (
    <article
      className="
        group
        relative
        rounded-3xl
        border border-zinc-200
        bg-white
        p-6
        transition-all
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:shadow-lg
      "
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
          <Link
            to="/view/$"
            params={{ _splat: hit.id }}
            className="
              outline-none
              transition
              after:absolute after:inset-0 after:content-['']
              group-hover:text-cyan-600
              focus-visible:text-cyan-600
              focus-visible:after:rounded-3xl
              focus-visible:after:ring-4
              focus-visible:after:ring-cyan-100
            "
          >
            {hit.title}
          </Link>
        </h3>

        <FileCountBadge count={hit.file_count} requested={hit.file_access_request} pid={hit.id} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceBadge source={hit.data_source} />
        {hit.license && <LicenseBadge license={hit.license} />}
        {formattedDate && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
            <CalendarIcon className="size-4" />
            {formattedDate}
          </span>
        )}
      </div>

      {hit.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{hit.description}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {hit.authors?.length ? (
          <p className="text-xs text-zinc-400">{hit.authors.join(", ")}</p>
        ) : (
          <span />
        )}

        {hit.doi && (
          <a
            href={hit.doi_url ?? `https://doi.org/${hit.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              relative
              inline-flex items-center gap-1
              rounded-full
              px-1
              text-xs font-medium text-zinc-500
              underline decoration-zinc-300 underline-offset-2
              transition
              hover:text-cyan-600 hover:decoration-cyan-400
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-cyan-200
            "
          >
            {hit.doi}
            <ArrowTopRightOnSquareIcon className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}
