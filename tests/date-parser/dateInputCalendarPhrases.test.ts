import { parseDateInput } from "@quno/calendar/date-parser";

const options = {
  expectedRange: { start: "2024-01-01", end: "2028-12-31" } as const,
  referenceDate: "2026-08-19" as const
};

const success = (start: string, end = start) => ({ status: "success", value: { start, end } });

describe("calendar-relative natural date phrases", () => {
  it.each([
    ["previous day", "2026-08-18", "2026-08-18"],
    ["previous week", "2026-08-10", "2026-08-16"],
    ["this week", "2026-08-17", "2026-08-23"],
    ["previous month", "2026-07-01", "2026-07-31"],
    ["previous year", "2025-01-01", "2025-12-31"]
  ])("resolves %s as the preceding calendar unit", (phrase, start, end) => {
    expect(parseDateInput({ text: phrase, ...options })).toEqual(success(start, end));
  });

  it.each([
    ["monday", "2026-08-10", "2026-08-17", "2026-08-24"],
    ["tuesday", "2026-08-11", "2026-08-18", "2026-08-25"],
    ["wednesday", "2026-08-12", "2026-08-19", "2026-08-26"],
    ["thursday", "2026-08-13", "2026-08-20", "2026-08-27"],
    ["friday", "2026-08-14", "2026-08-21", "2026-08-28"],
    ["saturday", "2026-08-15", "2026-08-22", "2026-08-29"],
    ["sunday", "2026-08-16", "2026-08-23", "2026-08-30"]
  ])("resolves last, this, and next %s by calendar week", (weekday, last, current, next) => {
    expect(parseDateInput({ text: `last ${weekday}`, ...options })).toEqual(success(last));
    expect(parseDateInput({ text: `this ${weekday}`, ...options })).toEqual(success(current));
    expect(parseDateInput({ text: `next ${weekday}`, ...options })).toEqual(success(next));
  });

  it("supports weekday aliases and consumer vocabulary extensions", () => {
    expect(parseDateInput({ text: "last Mon", ...options })).toEqual(success("2026-08-10"));
    expect(parseDateInput({ text: "next sun", ...options })).toEqual(success("2026-08-30"));
    expect(parseDateInput({ text: "prior week", ...{ ...options, lexicon: { previous: ["prior"] } } })).toEqual(
      success("2026-08-10", "2026-08-16")
    );
    expect(
      parseDateInput({ text: "this moonday", ...{ ...options, lexicon: { weekdayNames: { 1: ["moonday"] } } } })
    ).toEqual(success("2026-08-17"));
  });

  it("keeps calendar ranges invalid in single-day mode", () => {
    expect(parseDateInput({ text: "previous week", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "invalid"
    });
    expect(parseDateInput({ text: "this week", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "invalid"
    });
    expect(parseDateInput({ text: "next monday", ...{ ...options, selectionMode: "single" } })).toEqual(
      success("2026-08-24")
    );
  });

  it("keeps week and year boundaries timezone-free", () => {
    const boundaryOptions = { ...options, referenceDate: "2027-01-03" as const };
    expect(parseDateInput({ text: "previous week", ...boundaryOptions })).toEqual(success("2026-12-21", "2026-12-27"));
    expect(parseDateInput({ text: "this monday", ...boundaryOptions })).toEqual(success("2026-12-28"));
    expect(parseDateInput({ text: "this week", ...boundaryOptions })).toEqual(success("2026-12-28", "2027-01-03"));
    expect(parseDateInput({ text: "next monday", ...boundaryOptions })).toEqual(success("2027-01-04"));
    expect(parseDateInput({ text: "previous year", ...boundaryOptions })).toEqual(success("2026-01-01", "2026-12-31"));
  });

  it.each([
    [0, "2026-08-16", "2026-08-22"],
    [1, "2026-08-17", "2026-08-23"],
    [6, "2026-08-15", "2026-08-21"]
  ] as const)("resolves this week with weekStartsOn=%i", (weekStartsOn, start, end) => {
    expect(parseDateInput({ text: "this week", ...{ ...options, weekStartsOn } })).toEqual(success(start, end));
  });

  it("uses weekStartsOn for previous, next, and named-weekday calendar phrases", () => {
    const sundayFirst = { ...options, weekStartsOn: 0 as const };
    expect(parseDateInput({ text: "previous week", ...sundayFirst })).toEqual(success("2026-08-09", "2026-08-15"));
    expect(parseDateInput({ text: "next week", ...sundayFirst })).toEqual(success("2026-08-23", "2026-08-29"));
    expect(parseDateInput({ text: "this Sunday", ...sundayFirst })).toEqual(success("2026-08-16"));
    expect(parseDateInput({ text: "next Sunday", ...sundayFirst })).toEqual(success("2026-08-23"));
  });
});
