/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Branding / headers — "Bagong Pilipinas" uses Montserrat
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        // Body / chat
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Philippine Flag Blue — primary action color
        flag: {
          blue: '#0038A8',
        },
        // App-level surface tokens
        canvas: '#F7F7F7',   // page background
        card:   '#FCFCFC',   // sidebars, top bar, chat bubbles, input
      },
      boxShadow: {
        'action': '0 4px 14px 0 rgb(0 56 168 / 0.15)',
      },
    },
  },
  plugins: [],
};
