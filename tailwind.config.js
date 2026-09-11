/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        surfaceHover: '#334155', // slate-700
        border: '#334155', // slate-700
        text: '#f8fafc', // slate-50
        textMuted: '#94a3b8', // slate-400
        primary: '#0ea5e9', // sky-500
        primaryHover: '#0284c7', // sky-600
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        error: '#ef4444', // red-500
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
