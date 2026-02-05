import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0C0F',
        surface: '#13151A',
        text: '#ECEFF4',
        muted: '#9AA4B2',
        accent: '#FF6B00'
      }
    }
  },
  plugins: []
};

export default config;
