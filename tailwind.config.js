/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                hero: 'url("/assets/hero.png")',
            },
            colors: {
              opacity1: 'rgba(255, 255, 255, 0.1)',
              opacity3: 'rgba(255, 255, 255, 0.3)',
              opacity5: 'rgba(255, 255, 255, 0.5)',
            },
        },
    },
    plugins: [],
  }