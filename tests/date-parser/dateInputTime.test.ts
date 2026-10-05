import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
import { createDateInputAnalyzer } from "#quno-internal/date-parser/dateInputParser";
import { afterEach, vi } from "vitest";

const options = {
  recognizeTime: true,
  referenceDate: "2026-10-05",
  expectedRange: { start: "2026-01-01", end: "2027-12-31" }
} as const;
const parse = (text: string) => parseDateInput({ text, ...options });
const success = (start: string, startTime: string | null, end = start, endTime = startTime) => ({
  status: "success",
  value: { start, end },
  times: { start: startTime, end: endTime }
});

afterEach(() => vi.useRealTimers());

describe("optional clock recognition", () => {
  it.each([
    ["10:00", "10:00"],
    ["10AM", "10:00"],
    ["10:30PM", "22:30"],
    ["13", "13:00"],
    ["23", "23:00"],
    ["12:59", "12:59"],
    ["0", "00:00"],
    ["00", "00:00"],
    ["1:05", "01:05"],
    ["12AM", "00:00"],
    ["12PM", "12:00"],
    ["1 pm", "13:00"],
    ["01:05 aM", "01:05"],
    ["23:59", "23:59"]
  ])("normalizes %s to %s on the reference date", (text, time) => {
    expect(parse(text)).toEqual(success("2026-10-05", time));
  });

  it.each([
    "24",
    "24:00",
    "25:01",
    "00AM",
    "13PM",
    "1:60",
    "1:5",
    "10:",
    "10:000",
    "10:00:00",
    "100AM",
    "10amazing",
    "10:00Z",
    "10:00+02:00",
    "10:00-0500",
    "10p.m.",
    "tomorrow 10:00:00",
    "tomorrow 24:00",
    "tomorrow 10:00+02:00",
    "tomorrow 10:00-11",
    "next week at 10:00",
    "next week 13",
    "next week at 13",
    "13 next week",
    "noon",
    "midnight",
    "tomorrow 10:00 11:00",
    "tomorrow at",
    "10:00 nope",
    "13 - 23 - 1",
    "10:00–11:00–12:00",
    "10:00tomorrow",
    "tomorrow10AM",
    "tomorrow/10AM",
    "10AM/ tomorrow"
  ])("rejects unsupported or incomplete input %s", (text) => {
    expect(parse(text)).toEqual({ status: "invalid" });
  });

  it.each([
    "tomorrow 10:30PM",
    "10:30PM tomorrow",
    "tomorrow at 10:30PM",
    "10:30PM at tomorrow",
    "6 October 2026 10:30PM",
    "10:30PM 6 October 2026",
    "2026-10-06 at 10:30PM"
  ])("pairs %s with its date", (text) => {
    expect(parse(text)).toEqual(success("2026-10-06", "22:30"));
  });

  it("handles bare hours and German connectors without altering date ambiguity", () => {
    expect(parse("tomorrow 13")).toEqual(success("2026-10-06", "13:00"));
    expect(parse("13 tomorrow")).toEqual(success("2026-10-06", "13:00"));
    expect(parse("12 June at 13")).toEqual(success("2026-06-12", "13:00"));
    expect(parseDateInput({ text: "morgen um 13", ...options, parserLanguages: ["de"] })).toEqual(
      success("2026-10-06", "13:00")
    );
    for (const text of ["12 June 13", "10-11", "13 days", "next 2 weeks", "20 12 12", "3/4/2026", "this week"]) {
      expect(parse(text)).toEqual(parseDateInput({ text, ...options, recognizeTime: false }));
      expect(parse(text)).not.toHaveProperty("times");
    }
  });

  it("does not enable clock syntax by default", () => {
    for (const text of ["13", "10:00", "10AM", "tomorrow 10:30PM", "10:00–11:00"]) {
      expect(parseDateInput({ text, ...options, recognizeTime: false })).toEqual({ status: "invalid" });
    }
    expect(parse("  ")).toEqual({ status: "empty" });
  });

  it("keeps explicit clocks authoritative and reference dates outside the ranking window", () => {
    expect(parseDateInput({ text: "10:00", ...options, lexicon: { today: ["10:00"] } })).toEqual(
      success("2026-10-05", "10:00")
    );
    expect(
      parseDateInput({ text: "13", ...options, expectedRange: { start: "2027-01-01", end: "2027-12-31" } })
    ).toEqual(success("2026-10-05", "13:00"));
    expect(parse("25 October 2026 23:00–01:00")).toEqual(success("2026-10-25", "23:00", "2026-10-26", "01:00"));
  });

  it("exposes normalized time tokens with original spelling and offsets only when enabled", () => {
    const text = "tomorrow 10:30 pM–12AM";
    expect(tokenizeDateInput({ text, recognizeTime: true })).toEqual([
      { type: "word", value: "tomorrow", raw: "tomorrow", start: 0, end: 8 },
      { type: "date-separator", value: " ", raw: " ", start: 8, end: 9 },
      { type: "time", value: "22:30", raw: "10:30 pM", start: 9, end: 17 },
      { type: "range-separator", value: "–", raw: "–", start: 17, end: 18 },
      { type: "time", value: "00:00", raw: "12AM", start: 18, end: 22 }
    ]);
    expect(tokenizeDateInput({ text })).toEqual(tokenizeDateInput({ text, recognizeTime: false }));
    expect(tokenizeDateInput({ text })).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "time" })])
    );
    expect(tokenizeDateInput({ text: "13", recognizeTime: true })[0].type).toBe("number");
  });

  it("reuses the compiled analyzer and retains a live default reference date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 12));
    const analyzer = createDateInputAnalyzer({ recognizeTime: true, expectedRange: options.expectedRange });
    expect(analyzer.analyze({ text: "10AM" }).result).toEqual(success("2026-10-05", "10:00"));
    vi.setSystemTime(new Date(2026, 9, 6, 12));
    expect(analyzer.analyze({ text: "10AM" }).result).toEqual(success("2026-10-06", "10:00"));
    expect(createDateInputAnalyzer(options).analyze({ text: "１０：３０ＰＭ" }).result).toEqual(
      success("2026-10-05", "22:30")
    );
  });
});

describe("timed range composition", () => {
  it.each(["10:00–11:00", "10AM-11AM", "10:00 — 11:00", "10:00 to 11:00", "10:00 bis 11:00"])("accepts %s", (text) => {
    expect(parse(text)).toEqual(success("2026-10-05", "10:00", "2026-10-05", "11:00"));
  });

  it("inherits a supplied date from either side", () => {
    expect(parse("tomorrow 10:00–11:00")).toEqual(success("2026-10-06", "10:00", "2026-10-06", "11:00"));
    expect(parse("10:00 - tomorrow 11:00")).toEqual(success("2026-10-06", "10:00", "2026-10-06", "11:00"));
    expect(parse("13 - 23")).toEqual(success("2026-10-05", "13:00", "2026-10-05", "23:00"));
  });

  it("rolls an earlier undated end time forward, including year and leap-day boundaries", () => {
    expect(parse("23:00–01:00")).toEqual(success("2026-10-05", "23:00", "2026-10-06", "01:00"));
    expect(parse("31 December 2026 23:00–01:00")).toEqual(success("2026-12-31", "23:00", "2027-01-01", "01:00"));
    expect(parse("28 February 2028 23:00–01:00")).toEqual(success("2028-02-28", "23:00", "2028-02-29", "01:00"));
    expect(parse("10:00–10:00")).toEqual(success("2026-10-05", "10:00"));
  });

  it("normalizes explicitly dated endpoints with their own times", () => {
    expect(parse("tomorrow 13 - today 23")).toEqual(success("2026-10-05", "23:00", "2026-10-06", "13:00"));
    expect(parse("today 23 - today 13")).toEqual(success("2026-10-05", "13:00", "2026-10-05", "23:00"));
    expect(parse("18/12/2026 10AM - 14/12/2026 11AM")).toEqual(success("2026-12-14", "11:00", "2026-12-18", "10:00"));
  });

  it("keeps missing endpoint times null and never inherits meridiem", () => {
    expect(parse("today - tomorrow 13")).toEqual(success("2026-10-05", null, "2026-10-06", "13:00"));
    expect(parse("tomorrow 13 - today")).toEqual(success("2026-10-05", null, "2026-10-06", "13:00"));
    expect(parse("today 13 - tomorrow")).toEqual(success("2026-10-05", "13:00", "2026-10-06", null));
    expect(parse("10 - 11PM")).toEqual(success("2026-10-05", "10:00", "2026-10-05", "23:00"));
  });

  it("retains partial-range and single-calendar-day selection semantics", () => {
    expect(parse("tomorrow 10AM -")).toEqual({
      status: "partial-range",
      value: { start: "2026-10-06", end: "2026-10-06" },
      times: { start: "10:00", end: null }
    });
    expect(parse("13 -")).toEqual({
      status: "partial-range",
      value: { start: "2026-10-05", end: "2026-10-05" },
      times: { start: "13:00", end: null }
    });
    expect(parse("tomorrow 10AM - 11:")).toEqual({ status: "invalid" });
    expect(parseDateInput({ text: "10:00–11:00", ...options, selectionMode: "single" })).toEqual(
      success("2026-10-05", "10:00", "2026-10-05", "11:00")
    );
    expect(parseDateInput({ text: "23:00–01:00", ...options, selectionMode: "single" })).toEqual({ status: "invalid" });
  });
});
