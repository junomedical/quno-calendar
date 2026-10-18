import { describe, expect, it } from "vitest";
import { fixtureEvents, calendars } from "#quno-demo/concept/calendarFixtures";
const request = {
  startDate: "2026-10-19" as const,
  endDate: "2026-10-20" as const,
  calendarIds: calendars.map((item) => item.id)
};
describe("concept density fixtures", () => {
  it.each([4, 40, 400])("generates exactly %i events per day and retains the reference appointment", (count) => {
    const events = fixtureEvents(request, count, false);
    expect(events).toHaveLength(count * 2);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    expect(events.find((event) => event.id === "2026-10-19-event-0")).toMatchObject({
      title: "Design review",
      start: "2026-10-19T10:00:00",
      calendarId: "person-0"
    });
    const selected = fixtureEvents({ ...request, calendarIds: ["person-1"] }, count, false);
    expect(selected).toHaveLength(count / 2);
    expect(selected.every((event) => event.calendarId === "person-1")).toBe(true);
  });
  it("uses a small exact overlap fixture", () => {
    const events = fixtureEvents({ ...request, endDate: request.startDate }, 6, true);
    expect(events).toHaveLength(6);
    expect(events.filter((event) => event.calendarId === "person-0")).toHaveLength(3);
    expect(fixtureEvents({ ...request, endDate: request.startDate, calendarIds: ["person-1"] }, 6, true)).toHaveLength(
      1
    );
  });
});
