import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { mdx, MDXProvider } from "@mdx-js/react";

import "./app.css";

import Home from "./views/home.mdx";
import { Basic } from "./views/basic";
import { Custom } from "./views/custom";
import { WithWorker } from "./views/with-worker";

const mdxComponents = {
  wrapper: (props: any) => (
    <div className="container mx-auto prose lg:max-w-3xl">
      <main {...props} />
    </div>
  ),
};

export function App() {
  return (
    <div className="min-h-screen antialiased break-words">
      <MDXProvider components={mdxComponents}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
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
