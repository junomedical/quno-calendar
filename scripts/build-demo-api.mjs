import { resolve } from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { build } from "vite";

// Vercel's Node compiler preserves import specifiers. Ship one server-only ESM
// bundle behind a native package import, independent of Vite/TypeScript aliases.
const result = await build({
  configFile: false,
  publicDir: false,
  resolve: {
    alias: [
      { find: /^@quno\/calendar$/, replacement: resolve("src/lib/index.ts") },
      { find: /^#quno-internal\//, replacement: `${resolve("src/lib")}/` },
      { find: /^#quno-demo\//, replacement: `${resolve("demo")}/` }
    ]
  },
  build: {
    outDir: "build/demo-api",
    write: false,
    minify: false,
    target: "node22",
    lib: { entry: resolve("demo/server/queryDemoEvents.ts"), formats: ["es"], fileName: () => "events.js" }
  }
});

// Vercel can build the site and its function concurrently. Publish atomically
// so either builder always traces a complete service file.
const bundles = Array.isArray(result) ? result : [result];
const entry = bundles
  .flatMap((bundle) => bundle.output)
  .find((chunk) => chunk.type === "chunk" && chunk.fileName === "events.js");
if (!entry) throw new Error("Demo API build produced no entry module");
const directory = resolve("build/demo-api");
await mkdir(directory, { recursive: true });
const temporary = resolve(directory, `events-${process.pid}.tmp`);
await writeFile(temporary, entry.code);
await rename(temporary, resolve(directory, "events.js"));
