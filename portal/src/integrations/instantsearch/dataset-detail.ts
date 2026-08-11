import { createServerFn } from "@tanstack/react-start";
import { createTypesenseClient } from "./client.server";

export type Dataset = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  authors: string[];
  license: string;
  publicationDate: string;
  url: string;
  data_source: string;
};

export const getDataset = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const client = createTypesenseClient();
    try {
      const dataset = await client.collections<Dataset>("datasets").documents(data).retrieve();
      return { dataset };
    } catch {
      return { dataset: null };
    }
  });
