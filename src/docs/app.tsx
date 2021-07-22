import React, { forwardRef, isValidElement } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
// @ts-ignore missing types
import preval from "preval.macro";

import "./app.css";

import { CodeBlock } from "./components/code-block";
import Docs from "./views/docs.mdx";
import { Basic } from "./views/basic";
import { Custom } from "./views/custom";
import linkIconSrc from "./assets/link.svg";
import { DocsVersions } from "./views/docs-versions";
import "./utils/expose";

function getAnchor(text: string) {
  return text
    .toLowerCase()
    .replace(/[ \(\.]/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const getHeading = (level: number) => {
  const Heading = (props: HeadingProps, ref: React.Ref<HTMLHeadingElement>) => {
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

const mdxComponents = {
  wrapper: (props: any) => (
    <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
      <main {...props} />
    </div>
  ),
  code: CodeBlock as React.ComponentType<{ children: React.ReactNode }>,
  // headings
  ...[2, 3, 4].reduce<Record<string, ReturnType<typeof getHeading>>>(
    (prev, curr) => {
      prev[`h${curr}`] = getHeading(curr);
      return prev;
    },
    {}
  ),
};

const {
  fileVersions: docsVersions,
}: {
  fileVersions: string[];
} = preval`module.exports = require('./old-docs-list')`;

const oldDocs = docsVersions.map((version) => {
  return {
    version,
    Component: React.lazy(() => import(`./views/old-docs/${version}.mdx`)),
  };
});

export function App() {
  return (
    <div className="min-h-screen antialiased break-words py-6">
      <MDXProvider components={mdxComponents}>
        <Router>
          <Routes>
            <Route path="/" element={<Docs />} />
            <Route path="basic" element={<Basic />} />
            <Route path="custom" element={<Custom />} />
            <Route
              path="docs/versions"
              element={<DocsVersions versions={docsVersions} />}
            />
            {oldDocs.map((v) => {
              return (
                <Route
                  key={v.version}
                  path={`docs/versions/${v.version.replaceAll(".", "-")}`}
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
            <Route path="*" element={<div>not found</div>} />
          </Routes>
        </Router>
      </MDXProvider>
    </div>
  );
}
