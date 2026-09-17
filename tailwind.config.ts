import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#23231F",
          dark: "#EDE7D8",
        },
        paper: {
          DEFAULT: "#EFE9DA",
          dark: "#18160F",
        },
        card: {
          DEFAULT: "#FBF8F1",
          dark: "#211E17",
        },
        stamp: {
          DEFAULT: "#8C3B2E",
          dark: "#D97A63",
        },
        ledger: {
          DEFAULT: "#3E5C4E",
          dark: "#7FAE99",
        },
        caution: {
          DEFAULT: "#A67C27",
          dark: "#D9A94A",
        },
        hairline: {
          DEFAULT: "#D8CFB8",
          dark: "#3A362B",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        stampIn: {
          "0%": { transform: "scale(1.6) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.94) rotate(-8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
      },
      animation: {
        stampIn: "stampIn 240ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
