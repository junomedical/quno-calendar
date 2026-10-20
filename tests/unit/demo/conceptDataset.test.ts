import { expect, it } from "vitest";
import { createCalendarDataset } from "#quno-demo/concept/calendarDataset";
import { calendars } from "#quno-demo/concept/calendarFixtures";
it("keeps appointment objects stable across range loads and density projections", async () => {
  const { loadEvents: load, readEvents } = createCalendarDataset();
  const request = {
    startDate: "2026-10-19" as const,
    endDate: "2026-10-19" as const,
    calendarIds: calendars.map((item) => item.id)
  };
  const first = await load(request);
  const later = await load({ ...request, endDate: "2026-10-20" });
  expect(first).toHaveLength(22);
  for (const event of first) expect(later.find((item) => item.id === event.id)).toBe(event);
  const source = readEvents(request, 60);
  expect(source).toHaveLength(60);
  expect(readEvents({ ...request, startDate: "2026-10-21", endDate: "2026-10-21" })).toEqual([]);
  for (const density of [4, 20, 60]) {
    const selection = readEvents(request, density);
    expect(selection).toHaveLength(density);
    expect(selection.filter((event) => event.id.includes("-overlap-"))).toHaveLength(0);
    expect(selection[0]).toBe(source[0]);
    expect(readEvents({ ...request, calendarIds: ["person-1"] }, density)).toHaveLength(density / 4);
  }
  expect(readEvents(request)).toEqual(first);
});
