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
        animation: {
          'fade-in-out': 'fadeInOut 2s ease-in-out',
        },
        keyframes: {
          fadeInOut: {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '10%': { opacity: '1', transform: 'translateY(0)' },
            '90%': { opacity: '1', transform: 'translateY(0)' },
            '100%': { opacity: '0', transform: 'translateY(-10px)' },
          },
        },
        
      },
    },
    plugins: [],
  };