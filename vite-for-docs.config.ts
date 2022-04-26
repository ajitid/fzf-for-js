import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import macrosPlugin from "vite-plugin-babel-macros";

export default defineConfig(async () => {
  // changes would be needed if you upgrade to React v18, see
  // https://github.com/brillout/vite-plugin-mdx/issues/44#issuecomment-974540152
  const mdx = await import("@mdx-js/rollup");

  return {
    plugins: [
      reactRefresh(),
      mdx.default({
        providerImportSource: "@mdx-js/react",
      }),
      macrosPlugin(),
    ],
    define: {
      // this is required for macrosPlugin to work
      "process.env": {},
    },
  };
});
