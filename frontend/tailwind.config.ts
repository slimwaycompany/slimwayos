import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#02BDB6' },
        blue: { brand: '#263CD9' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        caption:    ['8px',  { lineHeight: '1.4' }],
        body:       ['13px', { lineHeight: '1.6' }],
        subheading: ['21px', { lineHeight: '1.4', fontWeight: '600' }],
        heading:    ['34px', { lineHeight: '1.2', fontWeight: '700' }],
        display:    ['55px', { lineHeight: '1.1', fontWeight: '800' }],
      },
      backdropBlur: { glass: '20px' },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
