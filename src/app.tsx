import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";

import "./app.css";

import { CodeBlock } from "./components/code-block";
import Docs from "./views/docs.mdx";
import { Basic } from "./views/basic";
import { Custom } from "./views/custom";
import { WithWorker } from "./views/with-worker";

const mdxComponents = {
  wrapper: (props: any) => (
    <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
      <main {...props} />
    </div>
  ),
  code: CodeBlock as React.ComponentType<{ children: React.ReactNode }>,
};

export function App() {
  return (
    <div className="min-h-screen antialiased break-words py-6">
      <MDXProvider components={mdxComponents}>
        <Router>
          <Routes>
            <Route path="/" element={<Docs />} />
            <Route path="basic" element={<Basic />} />
            <Route path="custom" element={<Custom />} />
            <Route path="with-worker" element={<WithWorker />} />
            <Route path="*" element={<div>not found</div>} />
          </Routes>
        </Router>
      </MDXProvider>
    </div>
  );
}
