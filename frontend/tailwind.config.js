/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card:     '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 4px 16px 0 rgb(0 0 0 / 0.06)',
        'card-md':'0 2px 8px 0 rgb(0 0 0 / 0.06), 0 8px 32px 0 rgb(0 0 0 / 0.08)',
        glow:     '0 0 24px rgb(15 118 110 / 0.25)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn: { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        pulseS: { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.4' } },
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease-out both',
        'fade-in':    'fadeIn 0.3s ease-out both',
        'pulse-slow': 'pulseS 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
