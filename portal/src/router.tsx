import { createRouteMask, createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getContext } from "./integrations/tanstack-query/root-provider";
import Error from "./components/Error";

const datasetModalMask = createRouteMask({
  routeTree,
  from: "/view/$",
  to: "/dataset/$",
  params: true,
});

export function getRouter() {
  const context = getContext();

  let previousPathname: string | undefined;

  const isDatasetPath = (pathname: string | undefined) => pathname?.includes("/dataset/") ?? false;

  const router = createTanStackRouter({
    routeTree,
    context,
    routeMasks: [datasetModalMask],
    scrollRestoration: ({ location }) => {
      const toDataset = isDatasetPath(location.maskedLocation?.pathname ?? location.pathname);
      const fromDataset = isDatasetPath(previousPathname);

      // Disable restoration if either end of the navigation is a dataset route
      const shouldRestore = !toDataset && !fromDataset;
      return shouldRestore;
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <Error message="404. Page not found" />,
    defaultErrorComponent: ({ error }) => <Error message={error.message} />,
  });

  router.subscribe("onBeforeNavigate", (event) => {
    previousPathname = event.fromLocation?.maskedLocation?.pathname ?? event.fromLocation?.pathname;
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
