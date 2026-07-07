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
          white: '#09090B', // Obsidian base
          pure: '#121214',  // Card background
        },
        ink: {
          navy: '#F4F4F5',  // Zinc 100
          slate: '#A1A1AA', // Zinc 400
          muted: '#71717A', // Zinc 500
        },
        cobalt: {
          DEFAULT: '#3B82F6', // Vivid blue accent
          hover: '#60A5FA',
          light: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.3)',
        },
        ice: {
          gray: '#1C1C1F',   // Zinc 800-like background
          border: 'rgba(255, 255, 255, 0.06)', // Low-opacity white line
        },
        zinc: {
          500: '#94A3B8', // Higher contrast zinc-500 fallback for dark backgrounds
          400: '#CBD5E1', // Higher contrast zinc-400 fallback
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
        tactile: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        card: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'sm': '8px',
        'lg': '8px',
      }
    },
  },
  plugins: [],
}
