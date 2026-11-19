import type { Config } from "tailwindcss";

/**
 * BloodLink design tokens — a trustworthy, government-grade health portal
 * look (government-grade health portal): flat, 6px radii, subtle shadows, generous
 * spacing. Every token from the theme spec lives here. See README for the
 * full design rationale.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary crimson — buttons, active nav, blood & urgency highlights.
        primary: {
          DEFAULT: "#C62828",
          dark: "#8E0000",
          50: "#FDECEA",
          100: "#FAD4D1",
        },
        // Dark maroon — utility bar, header accents, footer.
        maroon: {
          DEFAULT: "#8E0000",
          900: "#5C0000",
        },
        // Slate navy — headings and links (official, credible).
        navy: "#1F2A44",
        // Surfaces & lines.
        surface: "#FFFFFF",
        subtle: "#F7F7F9",
        line: "#E0E0E0",
        // Status.
        success: "#2E7D32",
        warning: "#F9A825",
        danger: "#C62828",
        info: "#1565C0",
        // Text.
        ink: "#212121",
        muted: "#616161",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
        pop: "0 8px 24px rgba(16, 24, 40, 0.16)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
