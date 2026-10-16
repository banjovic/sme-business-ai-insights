import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#001219",
        body: "#3D5568",
        canvas: "#F6FAF9",
        surface: "#FFFFFF",
        // Primary — Oxford Navy, carries the "trusted fintech" identity forward
        navy: { DEFAULT: "#1D3557", dark: "#122540", light: "#e8edf3" },
        // Secondary / links / focus — Cerulean
        teal: { DEFAULT: "#457B9D", dark: "#33607d", light: "#eaf1f5" },
        // Accent / primary CTA — Golden Orange
        gold: { DEFAULT: "#EE9B00", dark: "#c17f00", light: "#fdf1d9" },
        alert: {
          red: "#AE2012", // Oxidized Iron
          amber: "#CA6702", // Burnt Caramel
        },
        success: "#005F73", // Dark Teal
        successLight: "#e3f0f1",
        line: "#DEE7E5",
        // full requested swatch, available as e.g. bg-swatch-punch-red
        swatch: {
          "punch-red": "#E63946",
          honeydew: "#F1FAEE",
          "frosted-blue": "#A8DADC",
          cerulean: "#457B9D",
          "oxford-navy": "#1D3557",
          "ink-black": "#001219",
          "dark-teal": "#005F73",
          "dark-cyan": "#0A9396",
          "pearl-aqua": "#94D2BD",
          "vanilla-custard": "#E9D8A6",
          "golden-orange": "#EE9B00",
          "burnt-caramel": "#CA6702",
          "rusty-spice": "#BB3E03",
          "oxidized-iron": "#AE2012",
          "brown-red": "#9B2226",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "16px", xl: "22px" },
      boxShadow: {
        card: "0 1px 2px rgba(0, 18, 25, 0.06), 0 1px 1px rgba(0, 18, 25, 0.04)",
        popover: "0 8px 24px rgba(0, 18, 25, 0.12), 0 2px 6px rgba(0, 18, 25, 0.06)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
