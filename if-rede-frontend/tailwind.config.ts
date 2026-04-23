import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'if-bg': '#2D1B2D',
        'if-card': '#442844',
        'if-olive': '#8F9972',
        'if-text': '#F2F2F2',
      },
      borderRadius: {
        main: '20px',
      },
      boxShadow: {
        card: '0 20px 50px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
