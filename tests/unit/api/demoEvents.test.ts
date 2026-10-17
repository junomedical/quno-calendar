import { describe, expect, it } from "vitest";
import demoEventsApi, { MAX_DEMO_QUERY_BYTES } from "#quno-api/demo-events";
import type { CalendarEvent } from "@quno/calendar/infinite-calendar";

const query = {
  startDate: "2026-10-08",
  endDate: "2026-10-09",
  calendarIds: ["dr-kirillov"],
  eventsPerYear: 1000
};
const post = (body: unknown) =>
  demoEventsApi.fetch(
    new Request("https://calendar.example/api/demo-events?delay=0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );

describe("demo range-query API", () => {
  it("generates only the requested inclusive dates and participants on the server", async () => {
    const response = await post(query);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const { events } = (await response.json()) as { events: CalendarEvent[] };
    expect(events.length).toBeGreaterThan(2);
    for (const event of events) {
      expect(event.start.slice(0, 10) >= query.startDate && event.start.slice(0, 10) <= query.endDate).toBe(true);
      expect(event.calendarIds).toContain("dr-kirillov");
    }
    expect(events.filter((event) => event.kind === "availability").map((event) => event.start)).toEqual([
      "2026-10-08T08:00:00",
      "2026-10-09T08:00:00"
    ]);
  });

  it("keeps overlapping reads deterministic and generates every requested year including leap day", async () => {
    const range = { ...query, startDate: "2027-12-31", endDate: "2028-03-01" };
    const { events } = (await (await post(range)).json()) as { events: CalendarEvent[] };
    const { events: singleDay } = (await (
      await post({ ...range, startDate: "2028-02-29", endDate: "2028-02-29" })
    ).json()) as { events: CalendarEvent[] };
    expect(singleDay.length).toBeGreaterThan(0);
    expect(events.filter((event) => event.start.startsWith("2028-02-29"))).toEqual(singleDay);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    expect(events.some((event) => event.start.startsWith("2027-12-31"))).toBe(true);
  });

  it("returns no records for an empty calendar selection or a weekend", async () => {
    for (const body of [
      { ...query, calendarIds: [] },
      { ...query, startDate: "2026-10-17", endDate: "2026-10-18" }
    ]) {
      await expect((await post(body)).json()).resolves.toEqual({ events: [] });
    }
  });

  it.each([
    [],
    [{ id: "uploaded-event" }],
    {},
    { ...query, startDate: "2026-02-30" },
    { ...query, endDate: "2026-01-01" },
    { ...query, endDate: "2028-01-01" },
    { ...query, calendarIds: ["unknown-calendar"] },
    { ...query, eventsPerYear: 1_000_000 },
    { ...query, eventsPerYear: "1000" },
    { ...query, events: [] }
  ])("rejects invalid or legacy upload queries: %j", async (body) => {
    expect((await post(body)).status).toBe(400);
  });

  it("rejects unsupported methods, malformed JSON and oversized payloads", async () => {
    const getResponse = await demoEventsApi.fetch(new Request("https://calendar.example/api/demo-events"));
    expect(getResponse.status).toBe(405);
    expect(getResponse.headers.get("Allow")).toBe("POST");
    for (const [body, status] of [
      ["{", 400],
      ["x".repeat(MAX_DEMO_QUERY_BYTES + 1), 413]
    ] as const) {
      expect(
        (await demoEventsApi.fetch(new Request("https://calendar.example/api/demo-events", { method: "POST", body })))
          .status
      ).toBe(status);
    }
  });
});
