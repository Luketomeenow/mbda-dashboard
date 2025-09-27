import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8f0ff',
          200: '#b6e4ff',
          300: '#83d2ff',
          400: '#3eb8ff',
          500: '#0ea5e9',
          600: '#0288c7',
          700: '#036aa1',
          800: '#06557f',
          900: '#0b4668'
        }
      },
      boxShadow: {
        card: '0 10px 25px -10px rgba(2,136,199,0.25)'
      },
      borderRadius: {
        xl: '1rem',
      }
    }
  },
  plugins: []
} satisfies Config


