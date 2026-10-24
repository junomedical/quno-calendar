import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { demoEventsApiPlugin } from "#quno-project/vite/demoEventsApiPlugin";
import { projectAliases } from "#quno-project/vite/projectAliases";

export default defineConfig({
  plugins: [react(), demoEventsApiPlugin()],
  resolve: { alias: projectAliases(__dirname) }
});
