export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral surface scale — light mode
        ink: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Brand green (replaces previous orange/pink ramp)
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
        // Warm yellow — reserved for data-viz (charts), never as primary accent
        chart: {
          bar: '#e8d87a',
          area: 'rgba(232, 216, 122, 0.25)',
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
        soft: '0 1px 3px rgba(0, 0, 0, 0.06)',
        card: '0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04)',
        float: '0 8px 32px rgba(0, 0, 0, 0.10)',
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
