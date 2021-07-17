import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import mdx from "vite-plugin-mdx";
import macrosPlugin from "vite-plugin-babel-macros";

export default defineConfig({
  plugins: [reactRefresh(), mdx(), macrosPlugin()],
  define: {
    // this is required for macrosPlugin to work
    "process.env": {},
  },
});
