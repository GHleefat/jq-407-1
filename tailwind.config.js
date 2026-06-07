/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        led: {
          bg: "#050505",
          dim: "#1a0e00",
          orange: "#ff7b00",
          "orange-bright": "#ff9a2e",
          "orange-dark": "#cc5f00",
          red: "#ff4500",
          "red-bright": "#ff6b3a",
          amber: "#ffbe0b",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', '"VT323"', '"ZCOOL KuaiLe"', "monospace"],
        dot: ['"VT323"', '"Press Start 2P"', '"ZCOOL KuaiLe"', "monospace"],
      },
      animation: {
        "scan-line": "scanLine 6s linear infinite",
        flicker: "flicker 0.15s infinite alternate",
        "text-scroll": "textScroll var(--scroll-duration, 18s) linear infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0.92" },
        },
        textScroll: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
