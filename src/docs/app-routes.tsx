import React from "react";
import { useRoutes } from "react-router-dom";

import Docs from "./views/docs.mdx";
import { Custom } from "./views/custom";

const Basic = React.lazy(() => import("./views/basic").then((mod) => ({ default: mod.Basic })));

const Loading = () => <div className="mt-3 text-center">Loading...</div>;

const BasicWithSuspense = () => (
  <React.Suspense fallback={<Loading />}>
    <Basic />
  </React.Suspense>
);

const AppRoutes = () => {
  const routes = useRoutes([
    { path: "", element: <Docs /> },
    { path: "basic", element: <BasicWithSuspense /> },
    { path: "custom", element: <Custom /> },
    { path: "*", element: <div>not found</div> },
  ]);

  return routes;
};

export default AppRoutes;
