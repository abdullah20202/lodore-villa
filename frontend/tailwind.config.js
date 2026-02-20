/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Tajawal", "sans-serif"],
      },
      colors: {
        gold: {
          300: "#E8C97A",
          400: "#C4955A",   // matches logo bronze-gold
          500: "#A8803F",
          600: "#8C6B2E",
        },
        cream: {
          50:  "#FDFAF5",
          100: "#F8F2E6",
          200: "#F0E6D0",
          300: "#E8D9BC",
        },
        dark: {
          900: "#0d0d0d",
          800: "#1a1a1a",
          700: "#2a2a2a",
          600: "#3a3a3a",
        },
        warm: {
          50:  "#FAF7F2",
          100: "#F5EFE3",
        },
      },
      boxShadow: {
        "luxury": "0 4px 32px rgba(196,149,90,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        "luxury-lg": "0 8px 48px rgba(196,149,90,0.15), 0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
