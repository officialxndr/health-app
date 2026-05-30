/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'ping-once': {
          '0%':   { transform: 'scale(1)',   opacity: '1' },
          '60%':  { transform: 'scale(1.3)', opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
      animation: {
        'ping-once': 'ping-once 0.7s ease-out forwards',
      },
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        surfaceHigh: '#1e1e1e',
        border: '#2a2a2a',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
