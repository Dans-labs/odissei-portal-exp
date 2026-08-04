import { useHits } from "react-instantsearch";
import { Link } from "@tanstack/react-router";

type DatasetHit = {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  data_source: string;
  license?: string;
};

export function Hits() {
  const { items } = useHits<DatasetHit>();
  return (
    <ul className="space-y-4">
      {items.map((hit) => (
        <li key={hit.id} className="rounded-md border p-4">
          <Link to="/view/$" params={{ _splat: hit.id }} className="font-medium hover:underline">
            {hit.title}
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            {hit.authors?.join(", ")} · {hit.data_source}
          </p>
          {hit.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-700">{hit.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
