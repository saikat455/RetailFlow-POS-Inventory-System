/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        pospro: {
          'primary':          '#3b82f6',
          'primary-content':  '#ffffff',
          'secondary':        '#6366f1',
          'secondary-content':'#ffffff',
          'accent':           '#f59e0b',
          'accent-content':   '#ffffff',
          'neutral':          '#0f1117',
          'neutral-content':  '#ffffff',
          'base-100':         '#ffffff',
          'base-200':         '#f2f4f8',
          'base-300':         '#e5e7eb',
          'base-content':     '#1f2937',
          'info':             '#3b82f6',
          'success':          '#22c55e',
          'warning':          '#f59e0b',
          'error':            '#ef4444',
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
  },
}