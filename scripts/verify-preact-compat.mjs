import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");
const workDir = join(root, "work", "preact-compat");
const packDir = join(workDir, "pack");
const appDir = join(workDir, "app");
const npmEnvironment = { ...process.env, npm_config_cache: join(workDir, "npm-cache") };
rmSync(workDir, { recursive: true, force: true });
mkdirSync(packDir, { recursive: true });
mkdirSync(join(appDir, "src"), { recursive: true });
const packed = execFileSync("npm", ["pack", "--pack-destination", packDir], {
  cwd: root,
  env: npmEnvironment,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"]
})
  .trim()
  .split(/\r?\n/)
  .at(-1);

writeFileSync(
  join(appDir, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      scripts: { build: "vite build" },
      dependencies: {
        "@quno/calendar": join(packDir, packed),
        preact: "^10.27.2",
        vite: "^7.3.6"
      }
    },
    null,
    2
  )
);
writeFileSync(join(appDir, "index.html"), '<div id="root"></div><script type="module" src="/src/main.jsx"></script>\n');
writeFileSync(
  join(appDir, "vite.config.js"),
  `import { defineConfig } from "vite";
export default defineConfig({ resolve: { alias: {
  "react-dom/test-utils": "preact/test-utils", "react-dom": "preact/compat",
  "react/jsx-runtime": "preact/jsx-runtime", react: "preact/compat"
} } });
`
);
writeFileSync(
  join(appDir, "src", "main.jsx"),
  `import { render } from "preact";
import { QunoCalendar } from "@quno/calendar/timeline";
import { QunoDatePicker } from "@quno/calendar/date-picker";
import { QunoDateInput } from "@quno/calendar/date-input";
const value = { start: "2026-08-24", end: "2026-08-24" };
render(<><QunoDatePicker value={value} /><QunoDateInput expectedRange={value} value={value} />
  <QunoCalendar calendars={[{ id: "team", name: "Team" }]} selectedCalendarIds={["team"]}
    loadEvents={async () => []} eventRenderer={() => null} initialDateKey="2026-08-24" /></>, document.getElementById("root"));
`
);
execFileSync("npm", ["install", "--prefer-offline", "--no-audit", "--no-fund"], {
  cwd: appDir,
  env: npmEnvironment,
  stdio: "inherit"
});
execFileSync("npm", ["run", "build"], { cwd: appDir, env: npmEnvironment, stdio: "inherit" });
console.log("Packed Preact compatibility fixture passed for all three UI subpaths.");
