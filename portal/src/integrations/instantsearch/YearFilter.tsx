import { useMemo, useRef } from "react";
import { useRefinementList } from "react-instantsearch";
import { m } from "#/paraglide/messages";
import { cn } from "#/utils/cn";
import { gradient } from "#/utils/surfaces";

const YEARLY_VIEW_THRESHOLD = 40; // spans wider than this collapse into decades

export function YearFilter({ attribute = "publication_year" }: { attribute?: string }) {
  // sortBy "name" = chronological (facet value), not count — we want time order, not popularity order
  const { items, refine } = useRefinementList({
    attribute,
    limit: 500,
    sortBy: ["name:asc"],
  });

  const lastClickedRef = useRef<number | null>(null);

  const years = useMemo(
    () =>
      items.map((item) => ({
        year: Number(item.value),
        count: item.count,
        selected: item.isRefined,
      })),
    [items],
  );

  const span = years.length > 0 ? years[years.length - 1].year - years[0].year + 1 : 0;

  const useDecades = span > YEARLY_VIEW_THRESHOLD;

  const buckets = useMemo(() => {
    if (!useDecades) return years;

    const decadeMap = new Map<
      number,
      { year: number; count: number; selected: boolean; yearsInBucket: number[] }
    >();
    for (const y of years) {
      const decadeStart = Math.floor(y.year / 10) * 10;
      const existing = decadeMap.get(decadeStart);
      if (existing) {
        existing.count += y.count;
        existing.yearsInBucket.push(y.year);
        existing.selected = existing.selected && y.selected;
      } else {
        decadeMap.set(decadeStart, {
          year: decadeStart,
          count: y.count,
          selected: y.selected,
          yearsInBucket: [y.year],
        });
      }
    }
    return Array.from(decadeMap.values()).sort((a, b) => a.year - b.year);
  }, [years, useDecades]);

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const selectedYears = years.filter((y) => y.selected);

  if (years.length === 0) return null;

  const handleBarClick = (
    bucket: { year: number; count: number; selected: boolean; yearsInBucket?: number[] },
    shiftKey: boolean,
  ) => {
    const targetYears = "yearsInBucket" in bucket ? bucket.yearsInBucket! : [bucket.year];

    if (shiftKey && lastClickedRef.current !== null) {
      const [lo, hi] = [lastClickedRef.current, bucket.year].sort((a, b) => a - b);
      years
        .filter((y) => y.year >= lo && y.year <= hi && !y.selected)
        .forEach((y) => refine(String(y.year)));
    } else {
      targetYears.forEach((y) => refine(String(y)));
    }

    lastClickedRef.current = bucket.year;
  };

  return (
    <div>
      <div className="flex h-16 items-end gap-px">
        {buckets.map((bucket) => {
          const heightPct = Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 8 : 3);
          return (
            <button
              key={bucket.year}
              type="button"
              disabled={bucket.count === 0}
              title={
                useDecades
                  ? `${bucket.year}s · ${bucket.count} datasets`
                  : `${bucket.year} · ${bucket.count} dataset${bucket.count === 1 ? "" : "s"}`
              }
              onClick={(e) => handleBarClick(bucket, e.shiftKey)}
              className="group relative h-full flex-1 cursor-pointer disabled:cursor-default"
            >
              <span
                className={cn(
                  `absolute inset-x-0 bottom-0 rounded-t-xs transition-colors`,
                  bucket.selected
                    ? gradient
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
                  bucket.count === 0 ? "opacity-30" : "",
                )}
                style={{ height: `${heightPct}%` }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-xs font-medium">
        <span>
          {buckets[0]?.year}
          {useDecades ? "s" : ""}
        </span>
        <span>
          {useDecades ? `${buckets[buckets.length - 1]?.year}s` : buckets[buckets.length - 1]?.year}
        </span>
      </div>

      {selectedYears.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedYears.map((y) => (
            <button
              key={y.year}
              onClick={() => refine(String(y.year))}
              className="
                inline-flex items-center gap-1 rounded-full
                bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-500 px-2 py-0.5 text-xs font-medium 
                transition hover:bg-cyan-100 dark:hover:bg-cyan-800 cursor-pointer
              "
            >
              {y.year}
              <span className="text-cyan-400">✕</span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] text-gray-400">{m.yearFilterHint()}</p>
    </div>
  );
}
