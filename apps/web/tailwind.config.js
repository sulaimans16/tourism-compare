/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        sunken: token('sunken'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        highlight: token('highlight'),
        'highlight-soft': token('highlight-soft'),
        good: token('good'),
        'good-soft': token('good-soft'),
        danger: token('danger'),
        'danger-soft': token('danger-soft'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Catamaran', 'system-ui', 'sans-serif'],
        sans: ['Catamaran', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { DEFAULT: '6px', md: '8px', lg: '10px', xl: '14px' },
    },
  },
  plugins: [],
};
