import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

const entries = {
  shared: { entry: "src/lib/index.ts", file: "index" },
  "infinite-calendar": { entry: "src/lib/timeline/index.ts", file: "infinite-calendar" },
  datepicker: { entry: "src/lib/date-picker/index.ts", file: "datepicker" },
  "booking-picker": { entry: "src/lib/booking-picker/index.ts", file: "booking-picker" },
  "date-input": { entry: "src/lib/date-input/index.ts", file: "date-input" },
  "date-parser": { entry: "src/lib/date-parser/index.ts", file: "date-parser" }
} as const;

export default defineConfig(({ mode }) => {
  const selected = entries[mode as keyof typeof entries] ?? entries.shared;
  return {
    resolve: {
      alias: [{ find: /^#quno-internal\//, replacement: `${resolve(__dirname, "src/lib")}/` }]
    },
    plugins: [
      react(),
      dts({
        entryRoot: "src/lib",
        include: ["src/lib"]
      })
    ],
    build: {
      emptyOutDir: mode === "shared",
      cssCodeSplit: false,
      cssMinify: false,
      minify: "esbuild",
      lib: {
        entry: selected.entry,
        fileName: (format) => `${selected.file}.${format === "es" ? "js" : "cjs"}`,
        formats: ["es", "cjs"],
        cssFileName: selected.file
      },
      rollupOptions: {
        external: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-virtual"]
      }
    }
  };
});
