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
          white: '#f8f9ff', // Ice blue/white background
          pure: '#ffffff',  // Pure white card background
        },
        ink: {
          navy: '#002045',  // Deep Navy for primary text and headings
          slate: '#43474e', // Slate for readable body/secondary text
          muted: '#74777f', // Muted/neutral slate text
        },
        cobalt: {
          DEFAULT: '#002045', // Deep Navy primary interactive
          hover: '#001b3c',
          light: 'rgba(0, 32, 69, 0.06)',
          border: 'rgba(0, 32, 69, 0.15)',
        },
        ice: {
          gray: '#eff4ff',   // Soft blue-gray background for list items/telemetry
          border: '#c4c6cf', // Outline variant border color
        },
        secondary: {
          DEFAULT: '#006e2f', // Vibrant Green secondary color for success/CTAs
          hover: '#005321',
          container: '#6bff8f',
          onContainer: '#007432',
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
