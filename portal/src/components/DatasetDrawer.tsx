import { useMatch, useNavigate } from "@tanstack/react-router";
import { Drawer } from "@base-ui/react/drawer";
import { useEffect, useState } from "react";
import { Button } from "@base-ui/react/button";

export function DatasetDrawer() {
  const navigate = useNavigate();

  const match = useMatch({
    from: "/_search/view/$",
    shouldThrow: false,
  });

  const isOpen = Boolean(match);

  const [dataset, setDataset] = useState(match?.loaderData?.dataset ?? null);

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
        if (!open) {
          navigate({ to: "/" });
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className="
            fixed
            inset-0
            bg-zinc-950/20
            backdrop-blur-sm
            transition-opacity
            duration-300
            data-ending-style:opacity-0
            data-starting-style:opacity-0
          "
        />

        <Drawer.Viewport
          className="
            fixed
            inset-y-0
            right-0
            z-50
            flex
          "
        >
          <Drawer.Popup
            className="
              h-full
              w-screen
              max-w-2xl
      
              overflow-y-auto

              rounded-l-[2rem]

              border-l
              border-zinc-200

              bg-[#fafaf9]

              shadow-2xl

              transition-[translate,opacity]
              duration-300
              ease-out

              data-starting-style:translate-x-full
              data-ending-style:translate-x-full
            "
          >
            {dataset && (
              <Drawer.Content>
                {/* Header */}

                <div
                  className="
                  sticky
                  top-0
                  z-10

                  border-b
                  border-zinc-200

                  bg-[#fafaf9]/90

                  px-8
                  py-6

                  backdrop-blur
                "
                >
                  <div className="flex justify-between gap-6">
                    <div>
                      <Drawer.Title
                        className="
                        text-2xl
                        font-semibold
                        tracking-tight
                        text-zinc-950
                      "
                      >
                        {dataset.title}
                      </Drawer.Title>

                      <div
                        className="
                        mt-3
                        flex
                        flex-wrap
                        gap-2
                      "
                      >
                        <Badge>{dataset.data_source}</Badge>

                        {dataset.license && <Badge>{dataset.license}</Badge>}
                      </div>
                    </div>

                    <Drawer.Close
                      className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center

                      rounded-full

                      text-zinc-500

                      transition

                      hover:bg-zinc-200
                      hover:text-zinc-900


                    "
                    >
                      ✕
                    </Drawer.Close>
                  </div>
                </div>

                {/* Body */}

                <div
                  className="
                  space-y-10
                  px-8
                  py-8
                "
                >
                  {/* Access CTA */}

                  <section>
                    <Button
                      className="
                      w-full

                      rounded-2xl

                      bg-gradient-to-r
                      from-cyan-500
                      to-blue-600

                      px-5
                      py-3

                      text-sm
                      font-medium
                      text-white

                      shadow-sm

                      transition

                      hover:brightness-110
                      active:scale-[0.99]
                      cursor-pointer
                    "
                    >
                      Go to dataset source
                    </Button>
                  </section>

                  {/* Description */}

                  {dataset.description && (
                    <section>
                      <SectionTitle>Description</SectionTitle>

                      <Drawer.Description
                        className="
                        mt-3
                        text-sm
                        leading-7
                        text-zinc-600
                      "
                      >
                        {dataset.description}
                      </Drawer.Description>
                    </section>
                  )}

                  {/* Metadata */}

                  <section>
                    <SectionTitle>Metadata</SectionTitle>

                    <div
                      className="
                      mt-4
                      grid
                      gap-4
                    "
                    >
                      <MetadataRow label="Authors" value={dataset.authors?.join(", ")} />

                      <MetadataRow label="Provider" value={dataset.data_source} />
                    </div>
                  </section>
                </div>
              </Drawer.Content>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="
        text-xs
        font-semibold
        uppercase
        tracking-wider
        text-zinc-400
      "
    >
      {children}
    </h2>
  );
}

function MetadataRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div
      className="
        flex
        justify-between
        gap-4

        rounded-2xl
        border
        border-zinc-200

        bg-white

        px-4
        py-3
      "
    >
      <span className="text-sm text-zinc-400">{label}</span>

      <span
        className="
          text-right
          text-sm
          font-medium
          text-zinc-900
        "
      >
        {value}
      </span>
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
