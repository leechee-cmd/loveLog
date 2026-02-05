/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Manual toggle or system pref via class
  theme: {
    extend: {
      colors: {
        // Material You Inspired Semantic Tokens
        // Seed: Rose
        primary: {
          DEFAULT: '#f43f5e', // rose-500
          foreground: '#ffffff',
          dark: '#fb7185', // rose-400
        },
        surface: {
          light: '#fafafa', // neutral-50
          dark: '#171717', // neutral-900
          variant: '#f5f5f5', // neutral-100 (cards)
          'variant-dark': '#262626', // neutral-800
        },
        outline: {
          light: '#d4d4d4', // neutral-300
          dark: '#525252', // neutral-600
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
