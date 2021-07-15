import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import mdx from "vite-plugin-mdx";

export default defineConfig({
  plugins: [reactRefresh(), mdx()],
});
