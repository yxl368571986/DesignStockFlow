/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        secondary: '#FF7D00',
        'primary-light': '#4080FF',
        'primary-dark': '#0E42D2',
        'secondary-light': '#FFA940',
        'secondary-dark': '#D66A00'
      }
    },
  },
  plugins: [],
}
