import { useMatch, useNavigate } from "@tanstack/react-router";
import { Drawer } from "@base-ui/react/drawer";
import { useEffect, useState } from "react";

export function DatasetDrawer() {
  const navigate = useNavigate();
  const match = useMatch({ from: "/_search/view/$", shouldThrow: false });
  const isOpen = Boolean(match);

  const [dataset, setDataset] = useState(match?.loaderData?.dataset ?? null);
  useEffect(() => {
    if (match?.loaderData?.dataset) setDataset(match.loaderData.dataset);
  }, [match?.loaderData?.dataset]);

  return (
    <Drawer.Root
      open={isOpen}
      swipeDirection="right"
      onOpenChange={(open) => !open && navigate({ to: "/" })}
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className="fixed inset-0 bg-black/30 transition-opacity duration-200
                     data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        />
        <Drawer.Viewport className="fixed inset-y-0 right-0 z-50 flex">
          <Drawer.Popup
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl
                       transition-[translate,opacity] duration-200 ease-out
                       data-[starting-style]:translate-x-full data-[starting-style]:opacity-[0.9999]
                       data-[ending-style]:translate-x-full data-[ending-style]:opacity-[0.9999]"
          >
            {dataset && (
              <Drawer.Content>
                <Drawer.Close className="text-sm text-gray-500">Close</Drawer.Close>
                <Drawer.Title className="mt-4 text-2xl font-semibold">{dataset.title}</Drawer.Title>
                <p className="mt-2 text-sm text-gray-500">
                  {dataset.authors?.join(", ")} · {dataset.data_source}
                </p>
                <Drawer.Description className="mt-4 text-gray-700">
                  {dataset.description}
                </Drawer.Description>
              </Drawer.Content>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
