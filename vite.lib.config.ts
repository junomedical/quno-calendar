import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: [{ find: /^#calendar-internal\//, replacement: `${resolve(__dirname, "src/lib")}/` }]
  },
  plugins: [
    react(),
    dts({
      entryRoot: "src/lib",
      include: ["src/lib"]
    })
  ],
  build: {
    emptyOutDir: true,
    // A single explicit stylesheet keeps both module formats safe to import in
    // Node/SSR. Enabling CSS splitting for the UMD build makes Vite inject a
    // <style> element at module evaluation time and therefore touches document.
    cssCodeSplit: false,
    lib: {
      entry: "src/lib/index.ts",
      name: "QunoCalendar",
      fileName: (format) => (format === "es" ? "quno-calendar.js" : "quno-calendar.umd.cjs"),
      formats: ["es", "umd"],
      cssFileName: "styles"
    },
    rollupOptions: {
      // Runtime dependencies stay as package imports instead of being copied
      // into the calendar bundle. Consumers already receive react-virtual via
      // package.json, so embedding it here would ship the same engine twice.
      external: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-virtual"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "React",
          "@tanstack/react-virtual": "ReactVirtual"
        }
      }
    }
  }
});
