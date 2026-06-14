export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Lekko podniesiona, neutralna skala szarości — zamiast czystej czerni.
        // Głębia budowana warstwami: 950 = tło, 900 = panele/nagłówek, 800 = ramki.
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#c7c7cd',
          400: '#9b9ba4',
          500: '#6e6e77',
          600: '#494950',
          700: '#34343a',
          800: '#25252b',
          900: '#1a1a1f',
          950: '#101013',
        },
        // Akcent marki n8n (#EA4B71) — ramp różowo-koralowy.
        // Mapowany na `orange-*`, więc jeden token zmienia wszystkie akcenty w UI.
        orange: {
          50: '#fdf2f5',
          100: '#fce7ec',
          200: '#f9cfd9',
          300: '#f4a6b9',
          400: '#f17593',
          500: '#ea4b71',
          600: '#d62e57',
          700: '#b51f45',
          800: '#971b3c',
          900: '#7f1936',
          950: '#470a1a',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      boxShadow: {
        'header-scroll': '0 6px 16px -8px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
