import { CircleStackIcon, ScaleIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { m } from "#/paraglide/messages";

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
  { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200" },
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
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

const badgeClass =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        ${badgeClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function LinkBadge({ children, className = "", link }: BadgeProps) {
  return (
    <a
      className={`
        ${badgeClass}
        ${className}
        transition
        hover:text-cyan-600 hover:scale-105
      `}
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
    <Badge className={`${bg} ${text} ${ring}`}>
      <CircleStackIcon className="size-4" />
      {source}
    </Badge>
  );
}

export function LicenseBadge({ license }: LicenseBadgeProps) {
  return (
    <Badge className="bg-slate-50 text-slate-700 ring-slate-200">
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
      className="bg-zinc-50 text-zinc-600 shrink-0 relative z-10"
      link={requested ? `https://dab.surf.nl/dataset?pid=doi:${pid}` : undefined}
    >
      <DocumentIcon className="size-4" />
      {label}
    </BadgeVariant>
  );
}
