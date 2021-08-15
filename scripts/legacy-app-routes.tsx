import React from "react";
import { Routes, Route } from "react-router-dom";

import Docs from "./docs.mdx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Docs />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  );
};

export default AppRoutes;
