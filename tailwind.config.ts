import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        champagne: "#d8b878",
        rose: "#f6d7df",
        ivory: "#fffaf2",
        ink: "#2f2a2a"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(76, 55, 44, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
