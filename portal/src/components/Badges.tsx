import { CircleStackIcon, ScaleIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { m } from "#/paraglide/messages";
import { cn } from "#/utils/cn";
import { badge } from "#/utils/surfaces";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  link?: string;
};

type SourceBadgeProps = {
  source: string;
};

type LicenseBadgeProps = {
  license: string;
};

const SOURCE_PALETTE = [
  {
    bg: "bg-cyan-50 dark:bg-gray-900",
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "ring-cyan-200 dark:ring-cyan-800",
  },
  {
    bg: "bg-violet-50 dark:bg-gray-900",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-200 dark:ring-violet-800",
  },
  {
    bg: "bg-amber-50 dark:bg-gray-900",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  {
    bg: "bg-emerald-50 dark:bg-gray-900",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-200 dark:ring-emerald-800",
  },
  {
    bg: "bg-rose-50 dark:bg-gray-900",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-200 dark:ring-rose-800",
  },
  {
    bg: "bg-blue-50 dark:bg-gray-900",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-200 dark:ring-blue-800",
  },
];

// Deterministic color per source name.
function colorForSource(source: string) {
  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }

  return SOURCE_PALETTE[Math.abs(hash) % SOURCE_PALETTE.length];
}

export function Badge({ children, className = "" }: BadgeProps) {
  return <span className={cn(badge, className)}>{children}</span>;
}

export function LinkBadge({ children, className = "", link }: BadgeProps) {
  return (
    <a
      className={cn(badge, className, "transition hover:text-cyan-600 hover:scale-105")}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const { bg, text, ring } = colorForSource(source);

  return (
    <Badge className={cn(bg, text, ring)}>
      <CircleStackIcon className="size-4" />
      {source}
    </Badge>
  );
}

export function LicenseBadge({ license }: LicenseBadgeProps) {
  return (
    <Badge className="bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600">
      <ScaleIcon className="size-4" />
      {license}
    </Badge>
  );
}

export function FileCountBadge({
  count,
  requested,
  pid,
}: {
  count?: number;
  requested?: boolean;
  pid?: string;
}) {
  const n = count ?? 0;
  const label =
    n === 0 ? (requested ? m.requestAccess() : m.noFiles()) : m.fileCountDetails({ count: n });

  const BadgeVariant = requested ? LinkBadge : Badge;

  return (
    <BadgeVariant
      className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700 shrink-0 relative z-10"
      link={requested ? `https://dab.surf.nl/dataset?pid=doi:${pid}` : undefined}
    >
      <DocumentIcon className="size-4" />
      {label}
    </BadgeVariant>
  );
}
