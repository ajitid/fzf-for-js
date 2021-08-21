import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
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

const oldDocs = docsVersions.map((version) => {
  return {
    version,
    Component: React.lazy(
      () => import(`./old-docs/${version}/src/docs/app-routes.tsx`)
    ),
  };
});

export function App() {
  return (
    <div className="min-h-screen antialiased break-words py-6">
      <MDXProvider components={mdxComponents}>
        <Router>
          <Routes>
            <Route path="/">
              <Navigate to="docs/latest" replace />
            </Route>
            <Route path="docs/latest/*" element={<AppRoutes />} />
            <Route path="migrate" element={<Migrate />} />
            <Route path="*" element={<div>not found</div>} />
            <Route
              path="docs"
              element={<DocsVersions versions={docsVersions} />}
            />
            {oldDocs.map((v) => {
              return (
                <Route
                  key={v.version}
                  path={`docs/${v.version.replace(/\./g, "-")}/*`}
                  element={
                    <React.Suspense
                      fallback={
                        <div className="mt-3 text-center">Loading...</div>
                      }
                    >
                      <v.Component />
                    </React.Suspense>
                  }
                />
              );
            })}
          </Routes>
        </Router>
      </MDXProvider>
    </div>
  );
}
