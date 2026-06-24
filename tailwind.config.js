/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        canvas: {
          white: '#FAFAFA',
          pure: '#FFFFFF',
        },
        ink: {
          navy: '#0F172A',
          slate: '#475569',
          muted: '#64748B',
        },
        cobalt: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          light: '#EFF6FF',
          border: '#BFDBFE',
        },
        ice: {
          gray: '#F8FAFC',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 30px rgba(15, 23, 42, 0.03)',
        tactile: '0 2px 8px rgba(29, 78, 216, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        card: '0 10px 40px -10px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
