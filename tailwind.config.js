/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}', // Include all files in the app directory
      './src/**/*.{js,ts,jsx,tsx}', // Include all files in the src directory
      
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'], // Set Inter as the default sans-serif font
        },
      },
    },
    plugins: [],
  };