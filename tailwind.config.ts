import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        parchment: "rgb(var(--color-parchment) / <alpha-value>)",
        margin: "rgb(var(--color-margin) / <alpha-value>)",
        amber: {
          DEFAULT: "rgb(var(--color-amber) / <alpha-value>)",
          light: "rgb(var(--color-amber-light) / <alpha-value>)",
          dark: "rgb(var(--color-amber-dark) / <alpha-value>)",
        },
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        rust: "rgb(var(--color-rust) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "ruled-lines":
          "repeating-linear-gradient(transparent, transparent 27px, var(--ruled-line) 28px)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s ease-out both",
        "fade-in": "fade-in 0.35s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
