const path = require("path");
const { defineConfig } = require("vite");

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      formats: ["umd"],
      entry: path.resolve(__dirname, "src/lib/main.ts"),
      name: "fzf",
    },
  },
});
