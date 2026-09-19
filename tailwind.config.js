/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a', // neutral-950
        surface: '#171717', // neutral-900
        surfaceHover: '#262626', // neutral-800
        border: '#404040', // neutral-700
        text: '#f5f5f5', // neutral-100
        textMuted: '#a3a3a3', // neutral-400
        accent: '#06b6d4', // cyan-500
        accentHover: '#0891b2', // cyan-600
        error: '#dc2626', // red-600 (kept strictly for failure scenarios like drops/timeouts)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
      }
    },
  },
  plugins: [],
}
