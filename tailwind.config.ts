import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111110",
        body: "#6b6b6b",
        bg: "#ffffff",
        bgalt: "#f9f9f8",
        accent: "#7ab833",
        "accent-soft": "#e8f3d7",
        "accent-deep": "#5d8f25",
        hairline: "rgba(0,0,0,0.08)",
        ok: "#16a34a",
        warn: "#d97706",
        bad: "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        "card-lg": "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
      },
      borderColor: {
        DEFAULT: "rgba(0,0,0,0.08)",
      },
      maxWidth: {
        content: "1080px",
      },
      fontSize: {
        eyebrow: ["12px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
    },
  },
  plugins: [],
};

export default config;
