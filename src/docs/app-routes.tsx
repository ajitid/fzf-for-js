import React from "react";
import { Routes, Route } from "react-router-dom";

import Docs from "./views/docs.mdx";
import { Custom } from "./views/custom";

const Basic = React.lazy(() => import("./views/basic").then((mod) => ({ default: mod.Basic })));

const Loading = () => <div className="mt-3 text-center">Loading...</div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="" element={<Docs />} />
      <Route
        path="basic"
        element={
          <React.Suspense fallback={<Loading />}>
            <Basic />
          </React.Suspense>
        }
      />
      <Route path="custom" element={<Custom />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  );
};

export default AppRoutes;
