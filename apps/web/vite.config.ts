import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests always exercise isolated synthetic state, including when a
    // developer's ignored .env.local activates the connected application.
    env: { VITE_DEMO_MODE: "true" },
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts*"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          motion: ["framer-motion", "gsap"],
        },
      },
    },
  },
});
