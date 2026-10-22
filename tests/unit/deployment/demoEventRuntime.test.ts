import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function cleanCheckout() {
  const directory = mkdtempSync(join(tmpdir(), "quno-demo-runtime-"));
  mkdirSync(join(directory, "scripts"));
  for (const path of [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "demo",
    "src",
    "api",
    "vite",
    "scripts/build-demo-api.mjs"
  ])
    cpSync(resolve(path), join(directory, path), { recursive: true });
  symlinkSync(resolve("node_modules"), join(directory, "node_modules"), "junction");
  return directory;
}

describe("deployed demo event service", () => {
  it("builds without dist and resolves through native Node imports without Vite aliases", () => {
    const directory = cleanCheckout();
    try {
      expect(existsSync(join(directory, "dist"))).toBe(false);
      for (const script of ["vercel-build", "build:demo"])
        execFileSync("npm", ["run", script], {
          cwd: directory,
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "production" }
        });
      expect(existsSync(join(directory, "dist-demo/index.html"))).toBe(true);
      const program = `
        import { parseDemoEventQuery, queryDemoEvents } from '#quno-api/demo-event-service';
        const query = parseDemoEventQuery({ startDate: '2026-10-08', endDate: '2026-10-08', calendarIds: ['dr-kirillov'], eventsPerYear: 1000 });
        if (!query) throw new Error('Valid query rejected');
        process.stdout.write(JSON.stringify(queryDemoEvents(query)));
      `;
      const execute = (timezone: string) =>
        JSON.parse(
          execFileSync(process.execPath, ["--input-type=module", "-e", program], {
            cwd: directory,
            encoding: "utf8",
            env: { ...process.env, TZ: timezone }
          })
        );
      const events = execute("UTC") as Array<{ calendarIds: string[]; start: string; end: string }>;
      expect(events.length).toBeGreaterThan(1);
      expect(
        events.every((event) => event.start.startsWith("2026-10-08") && event.calendarIds.includes("dr-kirillov"))
      ).toBe(true);
      expect(events[0]).toMatchObject({ start: "2026-10-08T08:00:00", end: "2026-10-08T14:00:00" });
      expect(execute("America/New_York")).toEqual(events);
      expect(existsSync(join(directory, "dist"))).toBe(false);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 15_000);
});
