import { useMatch, useNavigate } from "@tanstack/react-router";
import { Drawer } from "@base-ui/react/drawer";
import { Tabs } from "@base-ui/react/tabs";
import { useEffect, useState } from "react";
import {
  CalendarIcon,
  DocumentIcon,
  CircleStackIcon,
  ArrowTopRightOnSquareIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { SourceBadge, LicenseBadge } from "./Badges";
import { formatDate, formatBytes } from "#/utils/formatters";
import { m } from "#/paraglide/messages";

type Contact = { name: string; affiliation?: string | null };

type DatasetDetail = {
  id: string;
  title: string;
  description?: string;
  authors?: string[];
  contacts?: Contact[];
  rights_holders?: string[];
  data_source: string;
  license?: string;
  date_of_deposit?: string;
  doi?: string;
  doi_url?: string;
  file_count?: number;
  file_access_request?: boolean;
  total_file_size_bytes?: number;
  subjects?: string[];
  keywords?: string[];
  audience?: string[];
  languages?: string[];
  personal_data_present?: string;
  nbn?: string;
  bag_id?: string;
};

export function DatasetDrawer() {
  const navigate = useNavigate();

  const match = useMatch({
    from: "/_search/view/$",
    shouldThrow: false,
  });

  const isOpen = Boolean(match);

  const [dataset, setDataset] = useState<DatasetDetail | null>(match?.loaderData?.dataset ?? null);

  useEffect(() => {
    if (match?.loaderData?.dataset) {
      setDataset(match.loaderData.dataset);
    }
  }, [match?.loaderData?.dataset]);

  return (
    <Drawer.Root
      open={isOpen}
      swipeDirection="right"
      onOpenChange={(open) => {
        if (!open) navigate({ to: "/" });
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className="
            fixed inset-0 bg-zinc-950/20 backdrop-blur-sm
            transition-opacity duration-300
            data-ending-style:opacity-0 data-starting-style:opacity-0
          "
        />

        <Drawer.Viewport className="fixed inset-y-0 right-0 z-50 flex">
          <Drawer.Popup
            className="
              h-full w-screen max-w-2xl overflow-y-auto
              rounded-l-4xl border-l border-zinc-200 bg-[#fafaf9]
              shadow-2xl
              transition-[translate,opacity] duration-300 ease-out
              data-starting-style:translate-x-full
              data-ending-style:translate-x-full
            "
          >
            {dataset && (
              <Drawer.Content>
                <DatasetDetails dataset={dataset} />
              </Drawer.Content>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* Content wrapper */
export function DatasetDetails({ dataset }: { dataset: DatasetDetail }) {
  return (
    <>
      <Header dataset={dataset} />
      <div className="space-y-8 px-8 py-8">
        <CtaAndStats dataset={dataset} />

        {dataset.description && (
          <section>
            <SectionTitle>{m.description()}</SectionTitle>
            <Drawer.Description className="mt-3 text-sm leading-7 text-zinc-600">
              {dataset.description}
            </Drawer.Description>
          </section>
        )}
        <DetailTabs dataset={dataset} />
      </div>
    </>
  );
}

/* Header */
function Header({ dataset }: { dataset: DatasetDetail }) {
  return (
    <div
      className="
        sticky top-0 z-10 border-b border-zinc-200
        bg-[#fafaf9]/90 px-8 py-6 backdrop-blur
      "
    >
      <div className="flex justify-between gap-6">
        <div>
          <Drawer.Title className="text-2xl font-semibold tracking-tight text-zinc-950">
            {dataset.title}
          </Drawer.Title>

          <div className="mt-3 flex flex-wrap gap-2">
            <SourceBadge source={dataset.data_source} />
            {dataset.license && <LicenseBadge license={dataset.license} />}
          </div>
        </div>

        <Drawer.Close
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-full text-zinc-500 transition
            hover:bg-zinc-200 hover:text-zinc-900
            cursor-pointer
          "
        >
          ✕
        </Drawer.Close>
      </div>
    </div>
  );
}

/* ------------------------------ CTA + quick stats ------------------------------ */

function CtaAndStats({ dataset }: { dataset: DatasetDetail }) {
  const size = formatBytes(dataset.total_file_size_bytes);

  return (
    <section className="space-y-4">
      <a
        href={dataset.doi_url ?? (dataset.doi ? `https://doi.org/${dataset.doi}` : "#")}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex w-full items-center justify-center gap-2
          rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600
          px-5 py-3 text-sm font-medium text-white shadow-sm
          transition hover:brightness-110 active:scale-[0.99]
        "
      >
        {m.goToDatasetSource()}
        <ArrowTopRightOnSquareIcon className="size-4" />
      </a>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<CalendarIcon className="size-4" />}
          label={m.deposited()}
          value={formatDate(dataset.date_of_deposit) ?? "—"}
        />
        <StatTile
          icon={<DocumentIcon className="size-4" />}
          label={m.files()}
          value={
            dataset.file_count
              ? `${dataset.file_count}`
              : dataset.file_access_request
                ? m.onRequest()
                : m.none()
          }
        />
        <StatTile
          icon={<CircleStackIcon className="size-4" />}
          label={m.size()}
          value={size ?? "—"}
        />
      </div>
    </section>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-zinc-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

/* ---------------------------------- Tabs ---------------------------------- */

function DetailTabs({ dataset }: { dataset: DatasetDetail }) {
  return (
    <Tabs.Root defaultValue="people" className="w-full">
      <Tabs.List className="relative z-1 flex gap-6 border-b border-zinc-200">
        <TabTrigger value="people">{m.people()}</TabTrigger>
        <TabTrigger value="classification">{m.classification()}</TabTrigger>
        <TabTrigger value="access">{m.rightsAndAccess()}</TabTrigger>
        <TabTrigger value="identifiers">{m.identifiers()}</TabTrigger>

        <Tabs.Indicator
          className="
            absolute bottom-0 left-0 z-10 h-0.5 rounded-full bg-cyan-500
            transition-[translate,width] duration-200 ease-in-out
            translate-x-(--active-tab-left)
            w-(--active-tab-width)
          "
        />
      </Tabs.List>

      <Tabs.Panel value="people" className="mt-6">
        <PeoplePanel dataset={dataset} />
      </Tabs.Panel>

      <Tabs.Panel value="classification" className="mt-6">
        <ClassificationPanel dataset={dataset} />
      </Tabs.Panel>

      <Tabs.Panel value="access" className="mt-6">
        <AccessPanel dataset={dataset} />
      </Tabs.Panel>

      <Tabs.Panel value="identifiers" className="mt-6">
        <IdentifiersPanel dataset={dataset} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function TabTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Tab
      value={value}
      className="
        relative -mb-px cursor-pointer
        py-3 text-sm font-medium text-zinc-400
        transition-colors
        hover:text-zinc-700
        data-active:text-zinc-950
        focus-visible:outline-none
      "
    >
      {children}
    </Tabs.Tab>
  );
}

/* --------------------------------- Panels --------------------------------- */

function PeoplePanel({ dataset }: { dataset: DatasetDetail }) {
  const hasContacts = dataset.contacts && dataset.contacts.length > 0;

  return (
    <div className="space-y-5">
      {dataset.authors?.length ? (
        <PanelGroup title={m.authors()}>
          <div className="flex flex-wrap gap-2">
            {dataset.authors.map((a) => (
              <Chip key={a}>{a}</Chip>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {hasContacts ? (
        <PanelGroup title={m.contacts()}>
          <div className="space-y-2">
            {dataset.contacts!.map((c) => (
              <div
                key={c.name}
                className="
                  flex items-center gap-3 rounded-2xl border
                  border-zinc-200 bg-white px-4 py-3
                "
              >
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-full bg-zinc-100 text-zinc-500
                  "
                >
                  <UserIcon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900">{c.name}</div>
                  {c.affiliation && <div className="text-xs text-zinc-400">{c.affiliation}</div>}
                </div>
              </div>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {dataset.rights_holders?.length ? (
        <PanelGroup title={m.rightsHolders()}>
          <div className="flex flex-wrap gap-2">
            {dataset.rights_holders.map((r) => (
              <Chip key={r}>{r}</Chip>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {!dataset.authors?.length && !hasContacts && !dataset.rights_holders?.length && (
        <EmptyState />
      )}
    </div>
  );
}

function ClassificationPanel({ dataset }: { dataset: DatasetDetail }) {
  return (
    <div className="space-y-5">
      {dataset.subjects?.length ? (
        <PanelGroup title={m.subjects()}>
          <div className="flex flex-wrap gap-2">
            {dataset.subjects.map((s) => (
              <Chip key={s} tone="cyan">
                {s}
              </Chip>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {dataset.keywords?.length ? (
        <PanelGroup title={m.keywords()}>
          <div className="flex flex-wrap gap-2">
            {dataset.keywords.map((k) => (
              <Chip key={k}>{k}</Chip>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {dataset.languages?.length ? (
        <PanelGroup title={m.languages()}>
          <div className="flex flex-wrap gap-2">
            {dataset.languages.map((l) => (
              <Chip key={l}>{l}</Chip>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {dataset.audience?.length ? (
        <PanelGroup title={m.audienceClassification()}>
          <div className="space-y-2">
            {dataset.audience.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-between gap-2 rounded-2xl
                  border border-zinc-200 bg-white px-4 py-3 text-sm
                  text-zinc-600 transition hover:border-cyan-300 hover:text-cyan-700
                "
              >
                <span className="truncate">{url}</span>
                <ArrowTopRightOnSquareIcon className="size-4" />
              </a>
            ))}
          </div>
        </PanelGroup>
      ) : null}

      {!dataset.subjects?.length &&
        !dataset.keywords?.length &&
        !dataset.languages?.length &&
        !dataset.audience?.length && <EmptyState />}
    </div>
  );
}

function AccessPanel({ dataset }: { dataset: DatasetDetail }) {
  const isPersonalData = dataset.personal_data_present?.toLowerCase() === "yes";

  return (
    <div className="space-y-3">
      <MetadataRow label={m.license()} value={dataset.license} />
      <MetadataRow label={m.dataSource()} value={dataset.data_source} />

      <div className="flex justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <span className="text-sm text-zinc-400">{m.fileAccess()}</span>
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
            text-xs font-semibold
            ${dataset.file_access_request ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}
          `}
        >
          {dataset.file_access_request ? (
            <LockClosedIcon className="size-4" />
          ) : (
            <LockOpenIcon className="size-4" />
          )}
          {dataset.file_access_request ? "Request required" : "Open access"}
        </span>
      </div>

      <div className="flex justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <span className="text-sm text-zinc-400">{m.personalDataPresent()}</span>
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
            text-xs font-semibold
            ${isPersonalData ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}
          `}
        >
          {dataset.personal_data_present ?? "Unknown"}
        </span>
      </div>
    </div>
  );
}

function IdentifiersPanel({ dataset }: { dataset: DatasetDetail }) {
  return (
    <div className="space-y-3">
      {dataset.doi && <CopyableField label="DOI" value={dataset.doi} />}
      {dataset.nbn && <CopyableField label="NBN" value={dataset.nbn} />}
      {dataset.bag_id && <CopyableField label="BAG ID" value={dataset.bag_id} />}
    </div>
  );
}

/* -------------------------------- Primitives -------------------------------- */

function PanelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{children}</h2>
  );
}

function MetadataRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-right text-sm font-medium text-zinc-900">{value}</span>
    </div>
  );
}

function Chip({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "cyan" }) {
  const styles =
    tone === "cyan"
      ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
      : "bg-zinc-100 text-zinc-600 ring-zinc-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-400">
      {m.noInformationAvailable()}
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-sm text-zinc-900">{value}</span>
        <button
          onClick={handleCopy}
          className="
            flex shrink-0 items-center gap-1 rounded-full px-2 py-1
            text-xs font-medium text-zinc-400 transition
            hover:bg-zinc-100 hover:text-zinc-700
            cursor-pointer
          "
        >
          {copied ? <CheckIcon className="size-4" /> : <DocumentDuplicateIcon className="size-4" />}
          {copied ? m.copied() : m.copy()}
        </button>
      </div>
    </div>
  );
}
