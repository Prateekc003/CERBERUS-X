/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0d',
          sidebar: '#101015',
          card: '#14141b',
          cardHover: '#181822',
          cardBorder: '#22222e',
          borderSubtle: '#1b1b24',
          activeNav: '#20202b',
          input: '#15151e',
        },
        accent: {
          greenDot: '#22c55e',
          greenBadgeBg: '#13281c',
          greenBadgeText: '#4ade80',
          greenBadgeBorder: '#1e402c',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
