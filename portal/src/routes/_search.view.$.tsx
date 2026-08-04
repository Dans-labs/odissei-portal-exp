import { createFileRoute } from "@tanstack/react-router";
import { getDataset } from "#/integrations/instantsearch/dataset-detail";

export const Route = createFileRoute("/_search/view/$")({
  loader: async ({ params }) => {
    const { dataset } = await getDataset({ data: params._splat! });
    return { dataset };
  },
  component: () => null,
});
