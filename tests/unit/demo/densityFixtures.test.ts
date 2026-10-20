import { expect, it } from "vitest";
import { densityEvents } from "#quno-demo/concept/densityFixtures";

it("spreads repeatable 4/20/60 schedules over the working day without forced overlaps", () => {
  const date = "2026-10-19";
  const events = densityEvents({ date });
  expect(densityEvents({ date })).toEqual(events);
  expect(densityEvents({ date: "2026-10-20" }).map((event) => event.start.slice(11))).not.toEqual(
    events.map((event) => event.start.slice(11))
  );
  for (const count of [4, 20, 60]) {
    const selected = events.slice(0, count);
    expect(new Set(selected.map((event) => event.id)).size).toBe(count);
    const bands = new Set<number>();
    for (const event of selected) {
      const start = Number(event.start.slice(11, 13)) * 60 + Number(event.start.slice(14, 16));
      bands.add(Math.floor((start - 480) / 150));
      expect(start).toBeGreaterThanOrEqual(480);
      expect(start + 60).toBeLessThanOrEqual(1140);
      expect(new Date(event.end).getTime() - new Date(event.start).getTime()).toBe(3600000);
    }
    expect(bands.size).toBe(4);
    for (let resource = 0; resource < 4; resource++)
      expect(selected.filter((event) => event.calendarId === `person-${resource}`)).toHaveLength(count / 4);
  }
  expect(new Set(events.map((event) => event.start)).size).toBeGreaterThan(40);
});
