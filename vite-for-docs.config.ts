import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import macrosPlugin from "vite-plugin-babel-macros";

export default defineConfig(async () => {
  // changes would be needed if you upgrade to React v18, see
  // https://github.com/brillout/vite-plugin-mdx/issues/44#issuecomment-974540152
  const mdx = await import("@mdx-js/rollup").then((mod) => mod.default);
  const remarkGfm = await import("remark-gfm").then((mod) => mod.default);

  return {
    plugins: [
      reactRefresh(),
      mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm],
      }),
      macrosPlugin(),
    ],
    define: {
      // this is required for macrosPlugin to work
      "process.env": {},
    },
  };
});
