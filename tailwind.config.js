/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand — vivid, modern violet. Readable as text AND as a fill.
        brand: {
          DEFAULT: "#6D5EF6",
          50: "#F1EFFF",
          100: "#E4E0FF",
          200: "#CCC5FB",
          400: "#8E82F8",
          500: "#6D5EF6",
          600: "#5A4BE6",
          700: "#4536C9",
        },
        // Theme-aware surfaces (resolved via the `dark:` variant)
        canvas: {
          light: "#F5F6F8",
          dark: "#0A0B0F",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#15171D",
        },
        elevated: {
          light: "#FFFFFF",
          dark: "#1C1F26",
        },
        light: {
          text: "#0B0D12",
          textMuted: "#737886",
          border: "#ECEEF1",
        },
        dark: {
          text: "#F5F6F8",
          textMuted: "#9AA0AD",
          border: "#23262E",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
