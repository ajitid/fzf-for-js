import React, {
  createContext,
  forwardRef,
  isValidElement,
  MutableRefObject,
  useContext,
  useRef,
} from "react";
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

import { CodeBlock } from "./components/code-block";
import linkIconSrc from "./assets/link.svg";
import { DocsVersions } from "./views/docs-versions";
import AppRoutes from "./app-routes";
import Migrate from "./views/migrate.mdx";
import "./utils/expose";

function getAnchor(text: string) {
  return text
    .toLowerCase()
    .replace(/[ \(\.]/g, "-")
    .replace(/→/g, "to")
    .replace(/[^a-z0-9-]/g, "");
}

const {
  fileVersions: docsVersions,
}: {
  fileVersions: string[];
} = preval`module.exports = require('./old-docs-list')`;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const getHeading = (level: number) => {
  const Heading = (props: HeadingProps, ref: React.Ref<HTMLHeadingElement>) => {
    const { lastHeadingsLink } = useContext(HeadingContext);

    let anchor = getAnchor(
      typeof props.children === "string" ? getAnchor(props.children) : ""
    );
    if (!anchor) {
      if (isValidElement(props.children)) {
        const elProps = props.children.props;
        const children = elProps["children"];
        if (typeof children === "string") {
          anchor = getAnchor(children);
        }
      }
    }

    lastHeadingsLink[level] = anchor;
    if (level >= 3 && lastHeadingsLink[level - 1]) {
      anchor = lastHeadingsLink[level - 1] + "-" + anchor;
    }
    const link = `#${anchor}`;

    return React.createElement(
      `h${level}`,
      {
        id: anchor,
        ref,
      },
      [
        <a
          key="1"
          href={link}
          className="heading-link"
          style={{ textDecoration: "none" }}
        >
          {props.children}
          <img
            src={linkIconSrc}
            className="w-5 inline-block ml-2"
            style={{ marginTop: 0, marginBottom: 0 }}
          />
        </a>,
      ]
    );
  };

  return forwardRef(Heading);
};

const HeadingContext = createContext<{
  lastHeadingsLink: Record<string, string>;
}>({ lastHeadingsLink: {} });

const mdxComponents = {
  wrapper: (props: any) => {
    const lastHeadingsLinkRef = useRef<Record<string, string>>({});

    return (
      <HeadingContext.Provider
        value={{ lastHeadingsLink: lastHeadingsLinkRef.current }}
      >
        <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
          <main {...props} />
        </div>
      </HeadingContext.Provider>
    );
  },
  code: CodeBlock as React.ComponentType<{ children: React.ReactNode }>,
  // headings
  ...Object.fromEntries(
    [2, 3, 4].map((level) => ["h" + level, getHeading(level)])
  ),
};

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
