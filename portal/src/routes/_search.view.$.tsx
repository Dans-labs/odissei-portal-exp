import { createFileRoute } from "@tanstack/react-router";
import { getDataset } from "#/integrations/instantsearch/dataset-detail";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_search/view/$")({
  loader: async ({ params }) => {
    const { dataset } = await getDataset({ data: params._splat! });
    return { dataset };
  },
  component: () => null,
  head: ({ loaderData }) => ({
    meta: [{ title: m.metaTitle({ page: loaderData?.dataset?.title ?? "" }) }],
  }),
});
