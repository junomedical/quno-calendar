import process from "node:process";
import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { build, loadConfigFromFile, mergeConfig } from "vite";

// Both revisions must contain the same calendar-engine fixture and zoomProbe instrumentation.
const root = await realpath(process.env.QUNO_FIXTURE_ROOT ?? process.cwd());
const outDir = resolve(process.env.QUNO_FIXTURE_OUTPUT ?? "/tmp/quno-zoom-pacing/fixture-dist");
const loaded = await loadConfigFromFile({ command: "build", mode: "production" }, resolve(root, "vite.config.ts"));
if (!loaded) throw new Error(`No Vite config at ${root}`);
await build(
  mergeConfig(loaded.config, {
    configFile: false,
    root,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: { calendarEngine: resolve(root, "e2e/fixtures/calendar-engine.html") } }
    }
  })
);
