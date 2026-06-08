/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand: blue #002D72 (primary), gold #F2B01E (secondary), red #D71920 (tertiary).

        // Primary — blue
        primary: "#002D72",
        "on-primary": "#ffffff",
        "primary-container": "#d8e2ff",
        "on-primary-container": "#001a44",
        "primary-fixed": "#d8e2ff",
        "primary-fixed-dim": "#aac7ff",
        "on-primary-fixed": "#001a44",
        "on-primary-fixed-variant": "#00419e",
        "inverse-primary": "#aac7ff",
        "surface-tint": "#002D72",

        // Secondary — gold (CTA buttons)
        secondary: "#7a5b00",
        "on-secondary": "#ffffff",
        "secondary-container": "#F2B01E",
        "on-secondary-container": "#3d2e00",
        "secondary-fixed": "#ffdf9e",
        "secondary-fixed-dim": "#d99a00",
        "on-secondary-fixed": "#261a00",
        "on-secondary-fixed-variant": "#5c4300",

        // Tertiary — red (badges/accents)
        tertiary: "#b3151b",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#D71920",
        "on-tertiary-container": "#ffffff",
        "tertiary-fixed": "#ffdad7",
        "tertiary-fixed-dim": "#ffb3ae",
        "on-tertiary-fixed": "#410002",
        "on-tertiary-fixed-variant": "#930009",

        // Error — red (semantic)
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",

        // Neutrals
        background: "#f9f9fb",
        "on-background": "#1a1c1d",
        surface: "#f9f9fb",
        "on-surface": "#1a1c1d",
        "surface-variant": "#e2e2e4",
        "on-surface-variant": "#44474e",
        "surface-bright": "#f9f9fb",
        "surface-dim": "#d9dadc",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f5",
        "surface-container": "#eeeef0",
        "surface-container-high": "#e8e8ea",
        "surface-container-highest": "#e2e2e4",
        outline: "#74777f",
        "outline-variant": "#c4c6cf",
        "inverse-surface": "#2f3132",
        "inverse-on-surface": "#f0f0f2",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        "margin-desktop": "48px",
        "gutter-mobile": "16px",
        "max-content-width": "1120px",
        "gutter-desktop": "24px",
        "margin-mobile": "16px",
      },
      fontFamily: {
        "headline-lg": ["Plus Jakarta Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "label-md": ["Plus Jakarta Sans"],
        "headline-lg-mobile": ["Plus Jakarta Sans"],
        "body-lg": ["Plus Jakarta Sans"],
        "label-sm": ["Plus Jakarta Sans"],
        "body-md": ["Plus Jakarta Sans"],
      },
      fontSize: {
        "headline-lg": [
          "32px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "headline-md": ["20px", { lineHeight: "1.4", fontWeight: "700" }],
        "label-md": [
          "14px",
          { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "headline-lg-mobile": ["24px", { lineHeight: "1.2", fontWeight: "800" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
