import { execFileSync } from "node:child_process";
import { accessSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(".");
const workDir = mkdtempSync(join(tmpdir(), "quno-package-verify-"));
const packDir = join(workDir, "pack");
const appDir = join(workDir, "react-app");
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
const tarball = join(packDir, packed);

writeFileSync(
  join(appDir, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      scripts: { build: "tsc --noEmit && vite build" },
      dependencies: {
        "@quno/calendar": tarball,
        "@vitejs/plugin-react": "^4.7.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        typescript: "^5.8.3",
        vite: "^7.3.6"
      },
      devDependencies: { "@types/react": "^18.3.23", "@types/react-dom": "^18.3.7" }
    },
    null,
    2
  )
);
writeFileSync(join(appDir, "index.html"), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
writeFileSync(
  join(appDir, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM"],
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
        isolatedModules: true,
        noEmit: true
      },
      include: ["src"]
    },
    null,
    2
  )
);
writeFileSync(
  join(appDir, "src", "main.tsx"),
  `import { createRoot } from "react-dom/client";
import { addDays, type DateRange } from "@quno/calendar";
import { QunoInfiniteCalendar, type EventRendererProps, type LoadEvents } from "@quno/calendar/infinite-calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
import "@quno/calendar/infinite-calendar/styles.css";
import "@quno/calendar/datepicker/styles.css";
import "@quno/calendar/date-input/styles.css";

const loadEvents: LoadEvents = async ({ startDate }) => [{
  id: "event", calendarId: "team", title: "Visit",
  start: startDate + "T09:00:00+02:00", end: startDate + "T10:00:00+02:00"
}];
function EventCard({ event, style }: EventRendererProps) { return <div style={style}>{event.title}</div>; }
const value: DateRange = { start: "2026-08-24", end: addDays("2026-08-24", 1) };
parseDateInput("tomorrow", { referenceDate: "2026-08-24", expectedRange: value });
tokenizeDateInput("tomorrow");
createRoot(document.getElementById("root")!).render(<>
  <QunoDatePicker value={value} /><QunoDateInput expectedRange={value} value={value} />
  <QunoInfiniteCalendar calendars={[{ id: "team", name: "Team" }]} selectedCalendarIds={["team"]}
    loadEvents={loadEvents} eventRenderer={EventCard} initialDateKey="2026-08-24" />
</>);
`
);

execFileSync("npm", ["install", "--prefer-offline", "--no-audit", "--no-fund"], {
  cwd: appDir,
  env: npmEnvironment,
  stdio: "inherit"
});
const installed = join(appDir, "node_modules", "@quno", "calendar");
const manifest = JSON.parse(readFileSync(join(installed, "package.json"), "utf8"));
for (const file of ["infinite-calendar.css", "datepicker.css", "date-input.css"]) {
  const stylesheet = join(installed, "dist", file);
  accessSync(stylesheet);
  const source = readFileSync(stylesheet, "utf8");
  if (!/\{\r?\n\s{2}/u.test(source)) {
    throw new Error(`Expected readable, unminified CSS in dist/${file}`);
  }
}
if (existsSync(join(installed, "dist", "date-parser.css"))) throw new Error("Date Parser unexpectedly emits CSS");
for (const subpath of [
  ".",
  "./infinite-calendar",
  "./infinite-calendar/styles.css",
  "./datepicker",
  "./datepicker/styles.css",
  "./date-input",
  "./date-input/styles.css",
  "./date-parser"
]) {
  if (!manifest.exports?.[subpath]) throw new Error(`Missing package export ${subpath}`);
}
for (const subpath of ["./timeline", "./date-picker"]) {
  if (manifest.exports?.[subpath]) throw new Error(`Legacy package export remains: ${subpath}`);
}
for (const subpath of [
  "@quno/calendar",
  "@quno/calendar/infinite-calendar",
  "@quno/calendar/datepicker",
  "@quno/calendar/date-input",
  "@quno/calendar/date-parser"
]) {
  execFileSync(process.execPath, ["--input-type=module", "--eval", `await import("${subpath}")`], { cwd: appDir });
  execFileSync(process.execPath, ["--input-type=commonjs", "--eval", `require("${subpath}")`], { cwd: appDir });
}
execFileSync(
  process.execPath,
  [
    "--input-type=module",
    "--eval",
    `const calendar = await import("@quno/calendar/infinite-calendar");
     const input = await import("@quno/calendar/date-input");
     if ("QunoCalendar" in calendar) throw new Error("Legacy calendar facade remains");
     if ("parseDateInput" in input || "tokenizeDateInput" in input) throw new Error("Date Input re-exports parser utilities");`
  ],
  { cwd: appDir }
);
for (const oldSubpath of ["@quno/calendar/timeline", "@quno/calendar/date-picker"]) {
  try {
    execFileSync(process.execPath, ["--input-type=module", "--eval", `await import("${oldSubpath}")`], {
      cwd: appDir,
      stdio: "ignore"
    });
    throw new Error(`Legacy package path still resolves: ${oldSubpath}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Legacy package path")) throw error;
  }
}
execFileSync("npm", ["run", "build"], { cwd: appDir, env: npmEnvironment, stdio: "inherit" });
console.log("Packed React, type, stylesheet, ESM, CommonJS, and SSR verification passed.");
