import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = resolve(".");
const workDir = mkdtempSync(join(tmpdir(), "quno-react19-compat-"));
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
      scripts: { build: "tsc --noEmit && vite build" },
      dependencies: {
        "@quno/calendar": join(packDir, packed),
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        typescript: "^5.8.3",
        vite: "^7.3.6"
      }
    },
    null,
    2
  )
);
writeFileSync(
  join(appDir, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      lib: ["ES2022", "DOM"],
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      strict: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  })
);
writeFileSync(join(appDir, "index.html"), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
writeFileSync(
  join(appDir, "src", "main.tsx"),
  `import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput } from "@quno/calendar/date-parser";

const initial: DateRange = { start: "2026-08-24", end: "2026-08-24" };
parseDateInput("today", { expectedRange: initial, referenceDate: initial.start });

function Fixture() {
  const [value, setValue] = useState<DateRange | null>(initial);
  useEffect(() => document.body.setAttribute("data-react19-ready", "true"), []);
  return <main>
    <QunoDatePicker value={value} onChange={setValue} disabledDays={(date) => date === "2026-08-25"} />
    <QunoDateInput expectedRange={initial} value={value} onChange={setValue} />
    <div style={{ height: 420 }}>
      <QunoInfiniteCalendar calendars={[{ id: "team", name: "Team" }]} selectedCalendarIds={["team"]}
        loadEvents={async () => []} eventRenderer={() => null} initialDateKey="2026-08-24" />
    </div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
`
);

execFileSync("npm", ["install", "--prefer-offline", "--no-audit", "--no-fund"], {
  cwd: appDir,
  env: npmEnvironment,
  stdio: "inherit"
});
execFileSync("npm", ["run", "build"], { cwd: appDir, env: npmEnvironment, stdio: "inherit" });

const vite = await createServer({ root: appDir, configFile: false, server: { host: "127.0.0.1", port: 0 } });
const diagnostics = [];
let browser;
try {
  await vite.listen();
  const address = vite.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("React 19 fixture server did not start");
  browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") diagnostics.push(message.text());
  });
  page.on("pageerror", (error) => diagnostics.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}`);
  await page.locator('body[data-react19-ready="true"]').waitFor();
  const viewport = page.locator(".quno-calendar-viewport");
  await viewport.waitFor();
  const pickerDay = page.locator('[data-slot="day"][data-date="2026-08-26"]');
  await pickerDay.click();
  await page.locator('[data-slot="day"][data-date="2026-08-26"][data-selected="true"]').waitFor();
  const input = page.locator('[data-slot="input"]');
  await input.fill("27 August 2026");
  await input.press("Enter");
  await viewport.evaluate((element) => element.scrollBy({ top: 180 }));
  await page.waitForTimeout(150);
  if (diagnostics.length > 0) throw new Error(`React 19 runtime diagnostics:\n${diagnostics.join("\n")}`);
} finally {
  await browser?.close();
  await vite.close();
}

console.log(
  "Packed React 19 fixture passed typechecking, production build, and warning-free development runtime checks."
);
