/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./organizer/**/*.html",
    "./login/**/*.html",
    "./dashboard/**/*.html",
    "./events/**/*.html",
    "./terms/**/*.html",
    "./privacy/**/*.html",
    "./support/**/*.html",
    "./src/scripts/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Space Grotesk', 'Inter', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
