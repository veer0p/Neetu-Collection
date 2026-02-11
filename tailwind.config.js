/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#020617", // slate-950
        accent: {
          indigo: "#6366f1",
          purple: "#a855f7",
          emerald: "#10b981",
          teal: "#14b8a6",
          orange: "#f97316",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular", "sans-serif"],
        "sans-bold": ["PlusJakartaSans_700Bold", "sans-serif"],
        "sans-medium": ["PlusJakartaSans_500Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};
