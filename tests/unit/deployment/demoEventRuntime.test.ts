import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("deployed demo event service", () => {
  it("resolves the built server service through native Node imports without Vite aliases", () => {
    execFileSync(process.execPath, ["scripts/build-demo-api.mjs"], { encoding: "utf8" });
    const program = `
      import { parseDemoEventQuery, queryDemoEvents } from '#quno-api/demo-event-service';
      const query = parseDemoEventQuery({ startDate: '2026-10-08', endDate: '2026-10-08', calendarIds: ['dr-kirillov'], eventsPerYear: 1000 });
      if (!query) throw new Error('Valid query rejected');
      process.stdout.write(JSON.stringify(queryDemoEvents(query)));
    `;
    const execute = (timezone: string) =>
      JSON.parse(
        execFileSync(process.execPath, ["--input-type=module", "-e", program], {
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
  });
});
