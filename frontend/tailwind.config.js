/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#f8fafc',       // Slate 50 background
        panelBg: '#ffffff',      // Pure white panels
        panelBorder: '#e2e8f0',  // Slate 200 border
        accentBlue: '#2563eb',   // Royal blue accent
      },
    },
  },
  plugins: [],
}
