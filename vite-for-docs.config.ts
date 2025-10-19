import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import macrosPlugin from "vite-plugin-babel-macros";

export default defineConfig(async () => {
  // changes would be needed if you upgrade to React v18, see
  // https://github.com/brillout/vite-plugin-mdx/issues/44#issuecomment-974540152
  const mdx = await import("@mdx-js/rollup").then((mod) => mod.default);
  const remarkGfm = await import("remark-gfm").then((mod) => mod.default);

  return {
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
  };
});
