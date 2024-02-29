/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html, ejs}", "./public/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
}

