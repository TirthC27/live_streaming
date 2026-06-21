/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        card: '#222222',
        accent: '#e50914',
        'accent-hover': '#ff1a27',
        'footy-background': '#323055',
        'footy-accent': '#433f81',
        text: '#f4f4f5',
        muted: '#aaaaaa',
        border: '#333333',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
