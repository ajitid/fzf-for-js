import React from "react";
import { Routes, Route } from "react-router-dom";

import Docs from "./views/docs.mdx";
import { Basic } from "./views/basic";
import { Custom } from "./views/custom";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Docs />} />
      <Route path="basic" element={<Basic />} />
      <Route path="custom" element={<Custom />} />
      <Route path="*" element={<div>not found</div>} />
    </Routes>
  );
};

export default AppRoutes;
