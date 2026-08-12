import { Collapsible } from "@base-ui/react/collapsible";
import { useState } from "react";

export function FilterSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger
        className="
          flex w-full cursor-pointer items-center justify-between gap-2
          text-xs font-semibold uppercase tracking-wider text-gray-400
          transition-colors
          hover:text-gray-600
        "
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronIcon
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </Collapsible.Trigger>

      <Collapsible.Panel
        className="
          h-(--collapsible-panel-height)
          overflow-hidden
          transition-[height] duration-200 ease-out
          data-starting-style:h-0
          data-ending-style:h-0
        "
      >
        <div className="pt-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
