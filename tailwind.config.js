module.exports = {
  content: ["./index.html", "./src/docs/**/*.{vue,js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: [
            {
              pre: {
                backgroundColor: "transparent",
                fontSize: "0.95em",
              },
            },
          ],
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
