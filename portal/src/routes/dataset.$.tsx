import { createFileRoute, notFound } from "@tanstack/react-router";
import { getDataset } from "#/integrations/instantsearch/dataset-detail";
import { DatasetDetails } from "#/components/DatasetDrawer";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/dataset/$")({
  loader: async ({ params }) => {
    const { dataset } = await getDataset({ data: params._splat! });
    if (!dataset) throw notFound();
    return { dataset };
  },
  component: DatasetDetail,
  head: ({ loaderData }) => ({
    meta: [{ title: m.metaTitle({ page: loaderData?.dataset?.title ?? "" }) }],
  }),
});

function DatasetDetail() {
  const { dataset } = Route.useLoaderData();
  return (
    <div className="bg-zinc-100">
      <article className="mx-auto max-w-3xl py-8">
        <DatasetDetails dataset={dataset} />
      </article>
    </div>
  );
}
