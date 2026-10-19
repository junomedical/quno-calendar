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
  it("fills the working day with varied hour-long appointments while retaining the creation gap", () => {
    const events = fixtureEvents({ ...request, endDate: request.startDate }, 22, true);
    expect(events).toHaveLength(22);
    expect(new Set(events.map((event) => event.title)).size).toBeGreaterThanOrEqual(20);
    for (const calendar of calendars) {
      const appointments = events.filter((event) => event.calendarId === calendar.id);
      expect(appointments.length).toBeGreaterThanOrEqual(5);
      expect(appointments.some((event) => event.start.slice(11, 16) < "10:00")).toBe(true);
      expect(appointments.some((event) => event.start.slice(11, 16) >= "13:00")).toBe(true);
      expect(appointments.some((event) => event.start.slice(11, 16) >= "17:30")).toBe(true);
      expect(
        appointments.every((event) => event.start.slice(11, 16) >= "08:00" && event.end.slice(11, 16) <= "19:00")
      ).toBe(true);
    }
    for (const event of events.filter((event) => event.id.includes("-event-")))
      expect(new Date(event.end).getTime() - new Date(event.start).getTime()).toBe(60 * 60000);
    expect(
      events.filter(
        (event) =>
          event.calendarId === "person-0" && event.start < "2026-10-19T12:30:00" && event.end > "2026-10-19T11:30:00"
      )
    ).toHaveLength(0);
    const packed = fixtureEvents({ ...request, endDate: request.startDate }, 400, true);
    expect(new Set(packed.map((event) => event.title)).size).toBeGreaterThanOrEqual(32);
  });
});
