/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: 'var(--bg-color)',
        panelBg: 'var(--panel-bg)',
        panelBorder: 'var(--panel-border)',
        accentBlue: 'var(--accent-color)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
