"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { ClearRefinements, useCurrentRefinements } from "react-instantsearch";
import { SearchBox } from "#/integrations/instantsearch/SearchBox";
import { RefinementList } from "#/integrations/instantsearch/RefinementList";
import { ToggleRefinement } from "#/integrations/instantsearch/ToggleRefinement";
import { RangeInput } from "#/integrations/instantsearch/RangeInput";
import { YearFilter } from "#/integrations/instantsearch/YearFilter";
import { FilterSection } from "./FilterSection";
import { m } from "#/paraglide/messages";
import {
  CircleStackIcon,
  CalendarIcon,
  ScaleIcon,
  TagIcon,
  GlobeAltIcon,
  HashtagIcon,
  LockClosedIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import styles from "./FacetSidebar.module.css";

// Height of the collapsed "peek" state — handle + search box + padding.
const PEEK_SNAP_POINT = "98px";
const EXPANDED_SNAP_POINT = 1;

function useIsDesktop(query = "(min-width: 768px)") {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return isDesktop;
}

function ClearRefinementsButton() {
  const { items } = useCurrentRefinements();
  if (items.length === 0) return null;

  return (
    <ClearRefinements
      classNames={{
        button: `
          w-full rounded-xl
          bg-gradient-to-r from-cyan-500 to-blue-600
          px-4 py-2
          text-sm font-medium text-white
          shadow-sm transition hover:brightness-105
          active:scale-[0.98] cursor-pointer
        `,
      }}
      translations={{
        resetButtonText: m.clearRefinements(),
      }}
    />
  );
}

function FiltersList() {
  return (
    <div className="space-y-5 [&>section]:pt-5 [&>section:first-child]:pt-0">
      <FilterSection title={m.dataSource()} icon={<CircleStackIcon className="size-4" />}>
        <RefinementList attribute="data_source" />
      </FilterSection>

      <FilterSection title={m.publicationYear()} icon={<CalendarIcon className="size-4" />}>
        <YearFilter attribute="publication_year" />
      </FilterSection>

      <FilterSection title={m.license()} icon={<ScaleIcon className="size-4" />}>
        <RefinementList attribute="license" />
      </FilterSection>

      <FilterSection title={m.subjects()} icon={<TagIcon className="size-4" />}>
        <RefinementList attribute="subjects" searchable showMoreLimit={40} />
      </FilterSection>

      <FilterSection
        title={m.language()}
        icon={<GlobeAltIcon className="size-4" />}
        defaultOpen={false}
      >
        <RefinementList attribute="languages" />
      </FilterSection>

      <FilterSection
        title={m.keywords()}
        icon={<HashtagIcon className="size-4" />}
        defaultOpen={false}
      >
        <RefinementList attribute="keywords" searchable showMoreLimit={60} />
      </FilterSection>

      <FilterSection
        title={m.accessConditions()}
        icon={<LockClosedIcon className="size-4" />}
        defaultOpen={false}
      >
        <ToggleRefinement attribute="file_access_request" label={m.restrictedAccess()} />
      </FilterSection>

      <FilterSection
        title={m.fileCount()}
        icon={<DocumentIcon className="size-4" />}
        defaultOpen={false}
      >
        <RangeInput attribute="file_count" label={m.fileCount()} />
      </FilterSection>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside
      className="
        sticky top-8 h-fit w-80 shrink-0
        rounded-3xl border border-zinc-200/80
        bg-white/80 p-6 shadow-sm backdrop-blur
      "
    >
      <div className="space-y-5">
        <SearchBox />
        <ClearRefinementsButton />
        <FiltersList />
      </div>
    </aside>
  );
}

function MobileFacetDrawer() {
  const [snapPoint, setSnapPoint] = useState<Drawer.Root.SnapPoint | null>(PEEK_SNAP_POINT);
  const isExpanded = snapPoint === EXPANDED_SNAP_POINT;

  return (
    <Drawer.Root
      open
      modal={isExpanded}
      snapPoints={[PEEK_SNAP_POINT, EXPANDED_SNAP_POINT]}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
      snapToSequentialPoints
    >
      <Drawer.SwipeArea
        className="fixed inset-x-0 bottom-0 z-30 h-24 pointer-events-auto md:hidden"
        swipeDirection="up"
      />

      <Drawer.Portal>
        <Drawer.Backdrop
          className={`${styles.Backdrop} fixed inset-0 z-20 bg-gray-600 md:hidden backdrop-blur ${isExpanded ? "pointer-events-auto" : "pointer-events-none"}`}
          onClick={() => setSnapPoint(PEEK_SNAP_POINT)}
        />

        <Drawer.Viewport
          className={`fixed inset-x-0 bottom-0 z-30 pointer-events-none md:hidden ${isExpanded ? "h-auto" : ""}`}
        >
          <Drawer.Popup
            className={`
              ${styles.Popup}
              pointer-events-auto
              flex h-[85vh] flex-col
              rounded-t-3xl border-t border-zinc-200/80
              bg-white${!isExpanded ? "/80" : ""} shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur
            `}
          >
            {/* Handle bar — the ONLY thing that toggles open <-> closed */}
            <button
              type="button"
              className="flex w-full shrink-0 flex-col items-center pt-3 pb-3"
              onClick={() => setSnapPoint(isExpanded ? PEEK_SNAP_POINT : EXPANDED_SNAP_POINT)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              <span className={styles.HandleBar} />
            </button>

            {/* Search box: opens the sheet on focus, but never closes it */}
            <div
              className="px-6 pb-3 mb-4"
              onFocusCapture={() => {
                if (!isExpanded) setSnapPoint(EXPANDED_SNAP_POINT);
              }}
            >
              <SearchBox />
            </div>

            <Drawer.Content className={styles.Content}>
              <div className="space-y-5">
                <ClearRefinementsButton />
                <FiltersList />
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function FacetSidebar() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <DesktopSidebar /> : <MobileFacetDrawer />;
}
