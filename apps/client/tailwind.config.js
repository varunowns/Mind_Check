export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["'Instrument Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"]
      },
      boxShadow: {
        soft: "var(--shadow)"
      }
    }
  },
  plugins: []
};
