/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names
  // It only includes CSS for classes you actually use
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {}, // You can add custom colors/fonts here later
  },
  plugins: [],
};
