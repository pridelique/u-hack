/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10233F',
        along: { 50: '#EFF7FF', 100: '#DCEEFF', 500: '#1677FF', 600: '#0866E5', 700: '#0754BC' },
        mint: { 50: '#EDFCF6', 100: '#D4F8E9', 500: '#10A976', 600: '#07875D' },
        ember: { 50: '#FFF7ED', 500: '#F58A3D', 600: '#DE6E20' }
      },
      boxShadow: {
        soft: '0 18px 50px rgba(18, 45, 82, 0.10)',
        card: '0 8px 30px rgba(18, 45, 82, 0.08)'
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
