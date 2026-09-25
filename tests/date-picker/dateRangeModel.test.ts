import {
  applyDateAction,
  calendarGrid,
  dateActionContext,
  editEndpoint,
  moveRange,
  nearestEndpoint,
  selectDate
} from "@quno/calendar/datepicker";
import { differenceInDays } from "@quno/calendar";

describe("date range model", () => {
  it("creates a one-day range from empty selection", () => {
    expect(selectDate({ range: null, date: "2026-08-10" })).toEqual({
      start: "2026-08-10",
      end: "2026-08-10"
    });
  });

  it("edits the nearest endpoint", () => {
    const range = { start: "2026-08-10", end: "2026-08-20" } as const;

    expect(nearestEndpoint({ range, date: "2026-08-07" })).toBe("start");
    expect(selectDate({ range, date: "2026-08-07" })).toEqual({
      start: "2026-08-07",
      end: "2026-08-20"
    });
    expect(selectDate({ range, date: "2026-08-24" })).toEqual({
      start: "2026-08-10",
      end: "2026-08-24"
    });
  });

  it("swaps endpoint identity when a dragged endpoint crosses", () => {
    const result = editEndpoint({
      range: { start: "2026-08-10", end: "2026-08-20" },
      endpoint: "end",
      date: "2026-08-07"
    });

    expect(result).toEqual({
      range: { start: "2026-08-07", end: "2026-08-10" },
      endpoint: "start"
    });
  });

  it("applies explicit start, end, and single-day actions", () => {
    const range = { start: "2026-08-10", end: "2026-08-20" } as const;

    expect(applyDateAction({ range, date: "2026-08-08", action: "start" })).toEqual({
      start: "2026-08-08",
      end: "2026-08-20"
    });
    expect(applyDateAction({ range, date: "2026-08-25", action: "end" })).toEqual({
      start: "2026-08-10",
      end: "2026-08-25"
    });
    expect(applyDateAction({ range, date: "2026-08-15", action: "single" })).toEqual({
      start: "2026-08-15",
      end: "2026-08-15"
    });
  });

  it("derives contextual defaults and meaningful alternatives", () => {
    const range = { start: "2026-08-10", end: "2026-08-20" } as const;

    expect(dateActionContext({ range, date: "2026-08-08" })).toEqual({
      defaultAction: "start",
      alternatives: ["end", "single"]
    });
    expect(dateActionContext({ range, date: "2026-08-25" })).toEqual({
      defaultAction: "end",
      alternatives: ["start", "single"]
    });
    expect(dateActionContext({ range, date: "2026-08-12" })).toEqual({
      defaultAction: "start",
      alternatives: ["end", "single"]
    });
    expect(dateActionContext({ range, date: "2026-08-18" })).toEqual({
      defaultAction: "end",
      alternatives: ["start", "single"]
    });
  });

  it("moves a range by snapped calendar days while preserving duration", () => {
    const moved = moveRange({
      range: { start: "2026-03-27", end: "2026-04-02" },
      origin: "2026-03-29",
      date: "2026-04-03"
    });

    expect(moved).toEqual({
      start: "2026-04-01",
      end: "2026-04-07"
    });
    expect(differenceInDays({ left: moved.end, right: moved.start })).toBe(6);
  });

  it("keeps six weeks and adds trailing context after a month-end row", () => {
    const grid = calendarGrid({ month: "2027-01-01" });

    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-12-28");
    expect(grid.at(-1)).toBe("2027-02-07");
  });

  it("keeps six weeks with consumer-defined week starts", () => {
    const sundayFirst = calendarGrid({ month: "2027-01-01", weekStartsOn: 0 });

    expect(sundayFirst).toHaveLength(42);
    expect(sundayFirst[0]).toBe("2026-12-27");
    expect(sundayFirst.at(-1)).toBe("2027-02-06");
  });
});
