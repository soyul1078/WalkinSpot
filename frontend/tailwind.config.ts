import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d7f9e2",
          400: "#34c77b",
          500: "#1fae63",
          600: "#158a4e",
          700: "#106b3d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
