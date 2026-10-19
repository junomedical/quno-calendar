import { expect, it } from "vitest";
import { createCalendarDataset, inDensity } from "#quno-demo/concept/calendarDataset";
import { calendars } from "#quno-demo/concept/calendarFixtures";
it("keeps appointment objects stable across range loads and density projections", async () => {
  const load = createCalendarDataset();
  const request = {
    startDate: "2026-10-19" as const,
    endDate: "2026-10-19" as const,
    calendarIds: calendars.map((item) => item.id)
  };
  const first = await load(request);
  const later = await load({ ...request, endDate: "2026-10-20" });
  expect(first).toHaveLength(400);
  for (const event of first) expect(later.find((item) => item.id === event.id)).toBe(event);
  for (const density of [4, 6, 22, 40, 400]) {
    const selection = first.filter((event) => inDensity(event, density));
    expect(selection).toHaveLength(density);
    expect(selection.filter((event) => event.id.includes("-overlap-"))).toHaveLength(2);
    expect(selection[0]).toBe(first[0]);
  }
});
