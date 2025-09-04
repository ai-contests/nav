/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha - Complete Color Palette
        // Accent Colors
        rosewater: {
          DEFAULT: '#f5e0dc',
          50: '#fef7f5',
          100: '#fef0eb',
          200: '#fde1d7',
          300: '#f5e0dc',
          400: '#f2cdcd',
          500: '#f5c2e7',
          600: '#cba6f7',
          700: '#f38ba8',
          800: '#eba0ac',
          900: '#fab387'
        },
        flamingo: '#f2cdcd',
        pink: '#f5c2e7',
        mauve: '#cba6f7',
        red: '#f38ba8',
        maroon: '#eba0ac',
        peach: '#fab387',
        yellow: '#f9e2af',
        green: '#a6e3a1',
        teal: '#94e2d5',
        sky: '#89dceb',
        sapphire: '#74c7ec',
        blue: '#89b4fa',
        lavender: '#b4befe',

        // Text Colors
        text: '#cdd6f4',
        'subtext-1': '#bac2de',
        'subtext-0': '#a6adc8',

        // Overlay Colors
        'overlay-2': '#9399b2',
        'overlay-1': '#7f849c',
        'overlay-0': '#6c7086',

        // Surface Colors
        'surface-2': '#585b70',
        'surface-1': '#45475a',
        'surface-0': '#313244',

        // Base Colors
        base: '#1e1e2e',
        mantle: '#181825',
        crust: '#11111b'
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
