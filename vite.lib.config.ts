import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src/lib",
      include: ["src/lib"]
    })
  ],
  build: {
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: {
      entry: "src/lib/index.ts",
      name: "QunoCalendar",
      fileName: (format) => (format === "es" ? "quno-calendar.js" : "quno-calendar.umd.cjs"),
      formats: ["es", "umd"],
      cssFileName: "styles"
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "React"
        }
      }
    }
  }
});
