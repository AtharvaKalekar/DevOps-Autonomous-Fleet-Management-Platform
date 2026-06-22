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
        accentLight: 'var(--accent-light)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        surfaceHover: 'var(--surface-hover)',
        surfaceMuted: 'var(--surface-muted)',
        bgSubtle: 'var(--bg-subtle)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: 'var(--card-shadow)',
        'card-lg': 'var(--card-shadow-lg)',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}
