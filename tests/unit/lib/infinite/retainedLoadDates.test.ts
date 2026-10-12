import { describe, expect, it } from "vitest";
import { EventRangeCoordinator } from "#quno-internal/timeline/infinite/events/loading/eventRangeCoordinator";

function pending(date: string) {
  const coordinator = new EventRangeCoordinator();
  coordinator.updateSelectedCalendarIds(["doctor"]);
  coordinator.updateLoadDates({ dateKeys: [date] });
  const request = coordinator.begin([date]);
  return { coordinator, request };
}

describe("included-date request retention", () => {
  it.each([
    ["2026-10-16", "2026-10-19", [0, 6]],
    ["2026-10-19", "2026-10-16", [0, 6]],
    ["2026-10-30", "2026-11-02", [0, 6]],
    ["2027-01-04", "2026-12-31", [0, 5, 6]],
    ["2026-10-16", "2026-10-19", [0, 2, 4, 6]],
    ["2026-10-15", "2026-10-16", []]
  ])("retains %s when the window moves to %s", (oldDate, date, excludedWeekdays) => {
    const { coordinator, request } = pending(oldDate);
    coordinator.updateLoadDates({ dateKeys: [date], excludedWeekdays });
    expect(request.controller.signal.aborted).toBe(false);
    expect(coordinator.missingLoadRanges().map(({ dateKeys }) => dateKeys)).toEqual([[date]]);
    coordinator.updateLoadDates({ dateKeys: [oldDate], excludedWeekdays });
    expect(coordinator.missingLoadRanges()).toEqual([]);
  });

  it("still aborts distant reads and rejects their late responses", () => {
    const { coordinator, request } = pending("2026-10-16");
    coordinator.updateLoadDates({ dateKeys: ["2026-10-26"], excludedWeekdays: [0, 6] });
    expect(request.controller.signal.aborted).toBe(true);
    expect(coordinator.accept({ request, events: [] })).toBe(false);
  });

  it.each(["generation", "coverage"])("still cancels incompatible %s", (reason) => {
    const { coordinator, request } = pending("2026-10-16");
    coordinator.updateLoadDates({ dateKeys: ["2026-10-19"], excludedWeekdays: [0, 6] });
    if (reason === "generation") coordinator.invalidate();
    else coordinator.updateSelectedCalendarIds(["room"]);
    expect(request.controller.signal.aborted).toBe(true);
    expect(coordinator.accept({ request, events: [] })).toBe(false);
  });

  it("bounds searches when every weekday is excluded", () => {
    const { coordinator, request } = pending("2026-10-16");
    coordinator.updateLoadDates({ dateKeys: ["2026-10-19"], excludedWeekdays: [0, 1, 2, 3, 4, 5, 6] });
    expect(request.controller.signal.aborted).toBe(true);
  });
});
