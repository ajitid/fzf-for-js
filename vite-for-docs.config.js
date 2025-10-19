import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import macrosPlugin from "vite-plugin-babel-macros";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    mdx({
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkGfm],
    }),
    macrosPlugin(),
    tailwindcss(),
  ],
  define: {
    // this is required for macrosPlugin to work
    "process.env": {},
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
