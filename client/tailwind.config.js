/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
          border: '#E2E8F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F1F5F9',
          hover: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#475569',
          hover: '#334155',
          light: '#F1F5F9',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          light: '#DCFCE7',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        border: '#E2E8F0',
        accent: {
          blue: '#2563EB',
          navy: '#0F172A',
          green: '#16A34A',
          amber: '#D97706',
          rose: '#E11D48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
