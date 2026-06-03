/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: "#5B5BD6",
          50: "#EEEEFB",
          100: "#D9D9F5",
          400: "#7C7CE0",
          500: "#5B5BD6",
          600: "#4A4ABF",
          700: "#3B3B99",
        },
        // Semantic surfaces (light + dark resolved via the `dark:` variant)
        surface: {
          light: "#FFFFFF",
          dark: "#15151B",
        },
        canvas: {
          light: "#F5F5F8",
          dark: "#0B0B0F",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
    },
  },
  plugins: [],
};
