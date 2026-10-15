/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#253D32',
        along: { 50: '#EDF2EA', 100: '#DCE7D7', 500: '#46745C', 600: '#315940', 700: '#244431' },
        mint: { 50: '#F0F4EA', 100: '#E0E8D3', 500: '#719263', 600: '#4F7042' },
        ember: { 50: '#FAF0E8', 500: '#BD7752', 600: '#A65E38' },
        slate: { 50: '#F5F5F0', 100: '#ECEEE7', 200: '#DFE2D8', 300: '#C6CCBF', 400: '#939D90', 500: '#6D786B', 600: '#53614F', 700: '#404E3D', 800: '#303C2E', 900: '#222C21' }
      },
      boxShadow: {
        soft: '0 12px 32px rgba(37, 61, 50, 0.06)',
        card: '0 3px 12px rgba(37, 61, 50, 0.04)'
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif']
      },
      borderRadius: { xl: '10px', '2xl': '16px', '3xl': '22px' }
    }
  },
  plugins: []
}
