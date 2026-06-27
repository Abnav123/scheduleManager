/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vagabond: {
          dark: '#050505',          // Stark manga pitch black
          charcoal: '#0e0e0e',      // Pure dark charcoal block
          slate: '#1e1e1e',         // Dark ink divider borders
          parchment: '#ffffff',      // Pure paper white for text contrast
          'parchment-dark': '#e0e0e0', // High contrast light grey
          gold: '#ffffff',          // White calligraphy accents
          brown: '#a3a3a3',         // Muted ink-brush grey
          olive: '#525252',         // Medium dark manga wash
          red: '#f43f5e',           // Stark alert rose/red
          green: '#e5e5e5',         // Neutral grey for completed tasks
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'rice-paper': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23ffffff\"/><path d=\"M0 0h1v1H0zm50 50h1v1h-1zM20 80h1v1h-1zm60-60h1v1h-1z\" fill=\"%23e5e5e5\" opacity=\"0.1\"/></svg>')",
        'ink-bleed': 'radial-gradient(circle, rgba(5,5,5,0.9) 0%, rgba(15,15,15,1) 100%)',
      },
      boxShadow: {
        'zen': '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
        'gold-glow': '0 0 15px rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'ink-grow': 'inkGrow 1.5s ease-out forwards',
        'scroll-unfurl': 'scrollUnfurl 0.8s ease-in-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'musashi-breath': 'musashiBreath 16s ease-in-out infinite',
      },
      keyframes: {
        inkGrow: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scrollUnfurl: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        musashiBreath: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.04' },
          '50%': { transform: 'scale(1.03)', opacity: '0.09' },
        },
      }
    },
  },
  plugins: [],
}
