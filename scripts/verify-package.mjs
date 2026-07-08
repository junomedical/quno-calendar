import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");
const workDir = join(root, "work", "package-verify");
const packDir = join(workDir, "pack");
const appDir = join(workDir, "app");

rmSync(workDir, { recursive: true, force: true });
mkdirSync(packDir, { recursive: true });
mkdirSync(join(appDir, "src"), { recursive: true });

const packOutput = execFileSync("npm", ["pack", "--pack-destination", packDir], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"]
});
const tarball = join(packDir, packOutput.trim().split(/\r?\n/).at(-1));

writeFileSync(
  join(appDir, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      scripts: {
        build: "tsc --noEmit && vite build"
      },
      dependencies: {
        "@vitejs/plugin-react": "^4.7.0",
        typescript: "^5.8.3",
        vite: "^7.3.6",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "quno-calendar": tarball
      },
      devDependencies: {
        "@types/react": "^18.3.23",
        "@types/react-dom": "^18.3.7"
      }
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
        lib: ["ES2020", "DOM", "DOM.Iterable"],
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
import { CalendarRoot, type CalendarEvent, type EventRendererProps, type LoadEvents } from "quno-calendar";
import "quno-calendar/styles.css";

const calendars = [{ id: "calendar-a", name: "Calendar A" }];

const loadEvents: LoadEvents = async ({ startDate }) => [
  {
    id: "event-a",
    calendarId: "calendar-a",
    title: "Packaged event",
    start: \`\${startDate}T09:00:00\`,
    end: \`\${startDate}T10:00:00\`
  } satisfies CalendarEvent
];

function EventCard({ event, status, style }: EventRendererProps) {
  return <div style={style} data-status={status}>{event.title}</div>;
}

createRoot(document.getElementById("root")!).render(
  <CalendarRoot
    ariaLabel="Package verification calendar"
    calendars={calendars}
    selectedCalendarIds={["calendar-a"]}
    loadEvents={loadEvents}
    eventRenderer={EventCard}
    initialDateKey="2026-07-04"
  />
);
`
);

execFileSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: appDir, stdio: "inherit" });
execFileSync("npm", ["run", "build"], { cwd: appDir, stdio: "inherit" });
