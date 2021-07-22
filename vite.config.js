const path = require("path");
const { defineConfig } = require("vite");

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "es2019",
    lib: {
      formats: ["es"],
      entry: path.resolve(__dirname, "src/lib/main.ts"),
      name: "fzf",
    },
    /* intentionally commented for future reference
    rollupOptions: {
      external: ["react", "react-router", "react-router-dom", "rmwc"],
      output: {
        globals: {
          react: "React",
        },
      },
    },
    */
  },
});
