/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Deep Ocean Palette
        canvas: "#02040a", // Midnight Blue - Global Background
        surface: "#0f172a", // Steel Azure - Card/Nav Background
        primary: {
          DEFAULT: "#0047AB", // Cobalt Blue
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#6495ED", // Cornflower Blue
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#00BFFF", // Electric Cyan
          deep: "#4169E1", // Royal Blue
        },
        text: {
          main: "#e2e8f0", // Pale Blue
          muted: "#94a3b8", // Slate Blue
        },
        border: {
          DEFAULT: "#1e3a8a", // Indigo Ink
          light: "#bfdbfe", // Cloud Blue
        }
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'deep-ocean': 'linear-gradient(to bottom, #02040a, #0f172a)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
