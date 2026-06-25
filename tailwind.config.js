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
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: 'none',
        tactile: 'none',
        card: 'none',
      }
    },
  },
  plugins: [],
}
