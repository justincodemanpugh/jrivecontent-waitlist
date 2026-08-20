/** @type {import('tailwindcss').Config} */

// Semantic tokens are backed by CSS variables holding space-separated RGB
// channels, so Tailwind's `<alpha-value>` opacity modifiers (bg-surface/80)
// keep working. Values live in app/globals.css under :root and .dark.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fixed brand palette. Still used by the marketing pages, which stay
        // light — the dashboards migrated off these onto the tokens below.
        brand: {
          sky: "#7DD3FC",
          skyDeep: "#38BDF8",
          ink: "#0F172A",
          mist: "#F0F9FF",
        },

        // Dashboard theme tokens.
        surface: token("surface"),
        "surface-raised": token("surface-raised"),
        "surface-sunken": token("surface-sunken"),
        "surface-hover": token("surface-hover"),

        line: token("line"),
        "line-strong": token("line-strong"),

        ink: token("ink"),
        "ink-soft": token("ink-soft"),
        muted: token("muted"),
        faint: token("faint"),

        accent: token("accent"),
        "accent-soft": token("accent-soft"),
        "accent-tint": token("accent-tint"),
        "on-accent": token("on-accent"),

        success: token("success"),
        "success-soft": token("success-soft"),
        "success-line": token("success-line"),
        "success-solid": token("success-solid"),

        warn: token("warn"),
        "warn-soft": token("warn-soft"),
        "warn-line": token("warn-line"),
        "warn-solid": token("warn-solid"),

        danger: token("danger"),
        "danger-soft": token("danger-soft"),
        "danger-line": token("danger-line"),
        "danger-solid": token("danger-solid"),

        // Non-status badge hues (informational blue, marketplace purple).
        info: token("info"),
        "info-soft": token("info-soft"),
        "info-line": token("info-line"),

        plum: token("plum"),
        "plum-soft": token("plum-soft"),
        "plum-solid": token("plum-solid"),

        scrim: token("scrim"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-viral-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        viral: ["var(--font-viral-body)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
