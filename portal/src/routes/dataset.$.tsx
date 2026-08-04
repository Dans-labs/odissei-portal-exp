// routes/dataset.$.tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getDataset } from "#/integrations/instantsearch/dataset-detail";

export const Route = createFileRoute("/dataset/$")({
  loader: async ({ params }) => {
    const { dataset } = await getDataset({ data: params._splat! });
    if (!dataset) throw notFound();
    return { dataset };
  },
  component: DatasetDetail,
});

function DatasetDetail() {
  const { dataset } = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-semibold">{dataset.title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {dataset.authors?.join(", ")} · {dataset.data_source}
      </p>
      <p className="mt-4 text-gray-700">{dataset.description}</p>
    </article>
  );
}
