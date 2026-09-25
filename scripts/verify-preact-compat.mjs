import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(".");
const workDir = mkdtempSync(join(tmpdir(), "quno-preact-compat-"));
const packDir = join(workDir, "pack");
const appDir = join(workDir, "app");
const npmEnvironment = { ...process.env, npm_config_cache: join(workDir, "npm-cache") };
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
import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput } from "@quno/calendar/date-parser";
const value = { start: "2026-08-24", end: "2026-08-24" };
parseDateInput({ text: "today", ...({ expectedRange: value, referenceDate: value.start }) });
render(<><QunoDatePicker value={value} /><QunoDateInput expectedRange={value} value={value} />
  <QunoInfiniteCalendar calendars={[{ id: "team", name: "Team" }]} selectedCalendarIds={["team"]}
    loadEvents={async () => []} renderEvent={() => null} initialDateKey="2026-08-24" /></>, document.getElementById("root"));
`
);
execFileSync("npm", ["install", "--prefer-offline", "--no-audit", "--no-fund"], {
  cwd: appDir,
  env: npmEnvironment,
  stdio: "inherit"
});
execFileSync("npm", ["run", "build"], { cwd: appDir, env: npmEnvironment, stdio: "inherit" });
console.log("Packed Preact compatibility fixture passed for three UI subpaths and the headless parser.");
