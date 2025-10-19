import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
// @ts-ignore missing types
import preval from "preval.macro";

import "./app.css";

import { DocsVersions } from "./views/docs-versions";
import AppRoutes from "./app-routes";
import Migrate from "./views/migrate.mdx";
import "./utils/expose";
import { mdxComponents } from "./utils/mdx-setup";

const {
  fileVersions: docsVersions,
}: {
  fileVersions: string[];
} = preval`module.exports = require('./old-docs-list')`;

// Create a wrapper component for lazy-loaded routes
const createLazyRoute = (version: string) => {
  const LazyComponent = React.lazy(() => import(`./old-docs/${version}/src/docs/app-routes.tsx`));

  return function LazyRouteWrapper() {
    return (
      <React.Suspense fallback={<div className="mt-3 text-center">Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    );
  };
};

const oldDocs = docsVersions.map((version) => {
  return {
    version,
    Component: createLazyRoute(version),
  };
});

// Create the router configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<Navigate to="docs/latest" replace />} />
      <Route path="docs/latest/*" element={<AppRoutes />} />
      <Route path="migrate" element={<Migrate />} />
      <Route path="docs" element={<DocsVersions versions={docsVersions} />} />
      {oldDocs.map((v) => (
        <Route
          key={v.version}
          path={`docs/${v.version.replace(/\./g, "-")}/*`}
          element={<v.Component />}
        />
      ))}
      <Route path="*" element={<div>not found</div>} />
    </Route>,
  ),
);

export function App() {
  return (
    <div className="min-h-screen antialiased break-words py-6">
      <MDXProvider components={mdxComponents}>
        <RouterProvider router={router} />
      </MDXProvider>
    </div>
  );
}
