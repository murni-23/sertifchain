import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-space-grotesk)", "sans-serif"],
      },
      colors: {
        black: "#1F2937",
        white: "#FFFFFF",
        yellow: {
          DEFAULT: "#FFC928",
          light: "#FFF7DB",
        },
        sky: "#F1E9F8",
        pink: {
          DEFAULT: "#F7E8EE",
          light: "#FCF4F7",
        },
        mint: "#E5F2EB",
        orange: {
          DEFAULT: "#F8EEE2",
          light: "#FCF6EF",
        },
        purple: {
          DEFAULT: "#EEEAF7",
          light: "#F7F5FB",
        },
        cream: "#FBFAFD",
        slate: {
          50: "#FBFAFD",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1F2937",
          900: "#111827",
        },
      },
      boxShadow: {
        brutal: "0 2px 8px rgba(31, 41, 55, 0.06)",
        "brutal-sm": "0 1px 4px rgba(31, 41, 55, 0.06)",
        "brutal-lg": "0 6px 18px rgba(31, 41, 55, 0.08)",
        "brutal-xl": "0 10px 28px rgba(31, 41, 55, 0.12)",
        "brutal-yellow": "0 2px 8px rgba(40, 120, 184, 0.12)",
        "brutal-pink": "0 2px 8px rgba(129, 70, 93, 0.08)",
        "brutal-mint": "0 2px 8px rgba(40, 99, 77, 0.08)",
      },
      borderWidth: {
        "3": "1px",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        wiggle: "wiggle 0.3s ease-in-out",
        "spin-slow": "spin 3s linear infinite",
        confetti: "confetti 0.8s ease-out forwards",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        confetti: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
