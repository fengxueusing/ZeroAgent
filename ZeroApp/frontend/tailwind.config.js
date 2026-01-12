/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Zero Theme Colors
        zero: {
          dark: "#09090b", // zinc-950
          card: "#18181b", // zinc-900
          border: "#27272a", // zinc-800
          primary: "#00f0ff", // Cyberpunk Cyan
          secondary: "#7000ff", // Cyberpunk Purple
          accent: "#ff003c", // Cyberpunk Red
        }
      },
    },
  },
  plugins: [],
}
