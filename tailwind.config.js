/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  // THIS IS THE FIX: We are telling Tailwind to scan EVERY folder for class names
  content: [
    './index.html', 
    './*.{js,ts,jsx,tsx}', 
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f8f8f8', 100: '#f0f0f0', 200: '#e0e0e0', 300: '#c0c0c0', 
          400: '#909090', 500: '#606060', 600: '#404040', 700: '#2a2a2a', 
          800: '#1a1a1a', 900: '#0a0a0a', 950: '#050505',
        }
      }
    }
  },
  plugins: []
}
