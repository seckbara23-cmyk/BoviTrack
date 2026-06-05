import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Senegalese-inspired identity, modernized
        green: {
          DEFAULT: "#0F7B45",
          dark: "#0B5E35",
          light: "#159A57",
          50: "#E8F4EE",
        },
        gold: {
          DEFAULT: "#D4A017",
          dark: "#B5870F",
          light: "#E8BC3E",
        },
        alert: {
          DEFAULT: "#C0392B",
          dark: "#9E2E22",
          light: "#E05545",
        },
        sand: {
          DEFAULT: "#F7F3E8",
          dark: "#EDE6D2",
        },
        earth: {
          DEFAULT: "#6B4F3A",
          light: "#8A6A4F",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        tile: "0 4px 16px rgba(15, 123, 69, 0.08)",
        "tile-hover": "0 8px 28px rgba(15, 123, 69, 0.16)",
        card: "0 2px 10px rgba(107, 79, 58, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
