/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#0F172A", // slate-900
        },
        surface: {
          DEFAULT: "#F8F9FB",
          dark: "#1E293B", // slate-800
        },
        primary: {
          DEFAULT: "#1A1A2E",
          dark: "#F8FAFC", // slate-50
        },
        secondary: {
          DEFAULT: "#6B7280",
          dark: "#94A3B8", // slate-400
        },
        accent: {
          DEFAULT: "#4F46E5",
          dark: "#818CF8", // indigo-400
        },
        divider: {
          DEFAULT: "#F0F0F5",
          dark: "#334155", // slate-700
        },
        success: {
          DEFAULT: "#10B981",
          dark: "#34D399", // emerald-400
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#FBBF24", // amber-400
        },
        danger: {
          DEFAULT: "#EF4444",
          dark: "#F87171", // red-400
        },
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular", "sans-serif"],
        "sans-bold": ["PlusJakartaSans_700Bold", "sans-serif"],
        "sans-medium": ["PlusJakartaSans_500Medium", "sans-serif"],
        "sans-semibold": ["PlusJakartaSans_600SemiBold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
