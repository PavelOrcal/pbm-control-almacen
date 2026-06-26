import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pbm: {
          bg: '#07111F',
          panel: '#0E1A2B',
          card: '#111827',
          border: '#1E3A5F',
          blue: '#00AEEF',
          glow: '#38BDF8',
          orange: '#F59E0B',
          green: '#22C55E',
          red: '#EF4444',
          yellow: '#FACC15',
          text: '#EAF2FF',
          muted: '#94A3B8'
        }
      },
      boxShadow: {
        glow: '0 0 28px rgba(56, 189, 248, 0.25)',
        orange: '0 0 24px rgba(245, 158, 11, 0.25)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
