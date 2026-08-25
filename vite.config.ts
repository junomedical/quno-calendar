import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { demoEventsApiPlugin } from "./vite/demoEventsApiPlugin";

export default defineConfig({
  plugins: [react(), demoEventsApiPlugin()],
  resolve: {
    alias: [
      { find: /^@quno\/calendar\/infinite-calendar$/, replacement: resolve(__dirname, "src/lib/timeline/index.ts") },
      { find: /^@quno\/calendar\/datepicker$/, replacement: resolve(__dirname, "src/lib/date-picker/index.ts") },
      { find: /^@quno\/calendar\/date-input$/, replacement: resolve(__dirname, "src/lib/date-input/index.ts") },
      { find: /^@quno\/calendar\/date-parser$/, replacement: resolve(__dirname, "src/lib/date-parser/index.ts") },
      { find: /^@quno\/calendar$/, replacement: resolve(__dirname, "src/lib/index.ts") },
      { find: /^#quno-internal\//, replacement: `${resolve(__dirname, "src/lib")}/` },
      { find: /^#quno-demo\//, replacement: `${resolve(__dirname, "demo")}/` },
      { find: /^#quno-api\//, replacement: `${resolve(__dirname, "api")}/` },
      { find: /^#quno-e2e\//, replacement: `${resolve(__dirname, "e2e")}/` },
      { find: /^#quno-tests\//, replacement: `${resolve(__dirname, "tests")}/` },
      { find: /^#quno-project\//, replacement: `${resolve(__dirname)}/` }
    ]
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    exclude: ["node_modules/**", "dist/**", "dist-demo/**", "e2e/**", "work/**", "outputs/**"],
    css: true
  }
});
