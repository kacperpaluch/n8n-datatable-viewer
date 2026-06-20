export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f4faed',
          100: '#eef7e6',
          200: '#d8eec6',
          300: '#b8de94',
          400: '#8fc861',
          500: '#5ea832',
          600: '#4d8e28',
          700: '#3d7220',
          800: '#325a1d',
          900: '#2a4a1a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'header-scroll': '0 1px 20px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
