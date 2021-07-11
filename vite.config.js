const path = require("path");
const { defineConfig } = require("vite");
const reactRefresh = require("@vitejs/plugin-react-refresh");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/main.ts"),
      name: "fzf",
    },
    rollupOptions: {
      // external: ["react", "react-router", "react-router-dom", "rmwc"],
      // output: {
      //   globals: {
      //     react: "React",
      //   },
      // },
    },
  },
});
