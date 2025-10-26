/** @type {import('tailwindcss').Config} */

// Generate dynamic color safelist for theme system
function generateColorSafelist() {
  const colors = [
    'slate', 'gray', 'zinc', 'neutral', 'stone',
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose'
  ];
  
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  const properties = [
    'bg',           // background
    'text',         // text color
    'border',       // border color
    'ring',         // ring color
    'from',         // gradient from
    'via',          // gradient via
    'to',           // gradient to
  ];
  
  const states = ['', 'hover:', 'focus:', 'active:', 'disabled:'];
  
  const safelist = [];
  
  // Generate all combinations
  colors.forEach(color => {
    shades.forEach(shade => {
      properties.forEach(prop => {
        states.forEach(state => {
          safelist.push(`${state}${prop}-${color}-${shade}`);
        });
      });
    });
  });
  
  return safelist;
}

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Include all files in the app directory
    './src/**/*.{js,ts,jsx,tsx}', // Include all files in the src directory
  ],
  safelist: [
    // Safelist all text size classes used in Hero section editing
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 
    'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl',
    // Safelist responsive variants
    'sm:text-xs', 'sm:text-sm', 'sm:text-base', 'sm:text-lg', 'sm:text-xl',
    'sm:text-2xl', 'sm:text-3xl', 'sm:text-4xl', 'sm:text-5xl', 'sm:text-6xl', 'sm:text-7xl', 'sm:text-8xl',
    'md:text-xs', 'md:text-sm', 'md:text-base', 'md:text-lg', 'md:text-xl',
    'md:text-2xl', 'md:text-3xl', 'md:text-4xl', 'md:text-5xl', 'md:text-6xl', 'md:text-7xl', 'md:text-8xl',
    // Dynamic color classes for theme system
    ...generateColorSafelist(),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'], // Standard fallback - actual font set via inline style in layout
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in', // Define the fadeIn animation
        shimmer: 'shimmer 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};