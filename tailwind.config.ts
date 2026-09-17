import type { Config } from "tailwindcss";

const config: Config = {
  // `dark:` utilities fire for both the paper-dark theme and the OLED one;
  // what separates them is the value behind each --*-dark token (globals.css).
  darkMode: ["variant", ["&:where(.dark, .dark *)", "&:where(.oled, .oled *)"]],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#23231F",
          dark: "rgb(var(--ink-dark) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "#EFE9DA",
          dark: "rgb(var(--paper-dark) / <alpha-value>)",
        },
        card: {
          DEFAULT: "#FBF8F1",
          dark: "rgb(var(--card-dark) / <alpha-value>)",
        },
        stamp: {
          DEFAULT: "#8C3B2E",
          dark: "rgb(var(--stamp-dark) / <alpha-value>)",
        },
        ledger: {
          DEFAULT: "#3E5C4E",
          dark: "rgb(var(--ledger-dark) / <alpha-value>)",
        },
        caution: {
          DEFAULT: "#A67C27",
          dark: "rgb(var(--caution-dark) / <alpha-value>)",
        },
        hairline: {
          DEFAULT: "#D8CFB8",
          dark: "rgb(var(--hairline-dark) / <alpha-value>)",
        },
        // Part-of-speech accents: one hue per grammatical class, kept clear of
        // ledger (synonyms) and stamp (antonyms) so nothing reads as a chip.
        azure: {
          DEFAULT: "#3A5A8C",
          dark: "rgb(var(--azure-dark) / <alpha-value>)",
        },
        plum: {
          DEFAULT: "#7A3E77",
          dark: "rgb(var(--plum-dark) / <alpha-value>)",
        },
        teal: {
          DEFAULT: "#2E6F6A",
          dark: "rgb(var(--teal-dark) / <alpha-value>)",
        },
        honey: {
          DEFAULT: "#8A6A2F",
          dark: "rgb(var(--honey-dark) / <alpha-value>)",
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
