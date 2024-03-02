/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html, ejs}", "./public/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      colors: {
        'blue': {
          '50': '#f2f8fd',
          '100': '#e3eefb',
          '200': '#c1ddf6',
          '300': '#8ac1ef',
          '400': '#4ca2e4',
          '500': '#2586d2',
          '600': '#1769b2',
          '700': '#145693',
          '800': '#144878',
          '900': '#163d64',
          '950': '#0f2842',
        },
      },
    },
  },
  plugins: [],
}

