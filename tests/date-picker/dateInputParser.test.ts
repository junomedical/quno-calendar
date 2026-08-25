import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const options = {
  expectedRange: { start: "2025-08-19", end: "2026-08-19" } as const,
  referenceDate: "2026-08-19" as const
};

describe("natural date parser", () => {
  it("tokenizes date parts separately from explicit range separators", () => {
    expect(tokenizeDateInput("12/14 -")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "number", value: "12" }),
        expect.objectContaining({ type: "number", value: "14" }),
        expect.objectContaining({ type: "range-separator", value: "-" })
      ])
    );
    expect(tokenizeDateInput("2026-08-19")).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "range-separator" })])
    );
    expect(tokenizeDateInput("22–07—80")).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "range-separator" })])
    );
  });

  it("uses the expected window to infer a missing year", () => {
    expect(parseDateInput("12/14", options)).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
  });

  it("rejects range results in single-day mode", () => {
    expect(parseDateInput("12/14", { ...options, selectionMode: "single" })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput("12/14 – 15/12", { ...options, selectionMode: "single" })).toEqual({ status: "invalid" });
    expect(parseDateInput("next month", { ...options, selectionMode: "single" })).toEqual({ status: "invalid" });
    expect(parseDateInput("12/14 –", { ...options, selectionMode: "single" })).toEqual({
      status: "partial-range",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
  });

  it("lets business preference resolve numeric date order conflicts", () => {
    expect(parseDateInput("3/4/2026", { ...options, preferredDateOrder: "dmy" })).toEqual({
      status: "success",
      value: { start: "2026-04-03", end: "2026-04-03" }
    });
    expect(parseDateInput("3/4/2026", { ...options, preferredDateOrder: "mdy" })).toEqual({
      status: "success",
      value: { start: "2026-03-04", end: "2026-03-04" }
    });
    expect(parseDateInput("20 12 12", { ...options, preferredDateOrder: "ymd" })).toEqual({
      status: "success",
      value: { start: "2020-12-12", end: "2020-12-12" }
    });
  });

  it("accepts locale-specific date-part markers through the lexicon", () => {
    expect(parseDateInput("2026年8月25日", options)).toEqual({ status: "invalid" });
    expect(
      parseDateInput("2026年8月25日", {
        ...options,
        lexicon: { datePartMarkers: ["年", "月", "日"] }
      })
    ).toEqual({
      status: "success",
      value: { start: "2026-08-25", end: "2026-08-25" }
    });
  });

  it("resolves two-digit years, month words, locale order, and leap days", () => {
    expect(parseDateInput("22 / 07 / 80", options)).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput("22 80 07", options)).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput("22-07-80", options)).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput("22–07–80", options)).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput("22—07—80", options)).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput("12 jul", options)).toEqual({
      status: "success",
      value: { start: "2026-07-12", end: "2026-07-12" }
    });
    expect(parseDateInput("12 juni", { ...options, parserLanguages: ["en", "de"] })).toEqual({
      status: "success",
      value: { start: "2026-06-12", end: "2026-06-12" }
    });
    expect(parseDateInput("3/4/2026", { ...options, locale: "en-US" })).toEqual({
      status: "success",
      value: { start: "2026-03-04", end: "2026-03-04" }
    });
    expect(parseDateInput("December 14, 2025", { ...options, locale: "en-US" })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput("29/02/2024", options).status).toBe("success");
    expect(parseDateInput("29/02/2025", options)).toEqual({ status: "invalid" });
  });

  it("recognizes German forms and completed relative periods", () => {
    expect(parseDateInput("heute", { ...options, parserLanguage: "de" })).toEqual({
      status: "success",
      value: { start: "2026-08-19", end: "2026-08-19" }
    });
    expect(parseDateInput("letzte 2 monate", { ...options, parserLanguage: "de" })).toEqual({
      status: "success",
      value: { start: "2026-06-01", end: "2026-07-31" }
    });
    expect(parseDateInput("last 3 days", options)).toEqual({
      status: "success",
      value: { start: "2026-08-16", end: "2026-08-18" }
    });
    expect(parseDateInput("past 90 days", options)).toEqual({
      status: "success",
      value: { start: "2026-05-22", end: "2026-08-19" }
    });
    expect(parseDateInput("past 3 months", options)).toEqual({
      status: "success",
      value: { start: "2026-05-19", end: "2026-08-19" }
    });
    expect(parseDateInput("90 days", options)).toEqual({
      status: "success",
      value: { start: "2026-05-22", end: "2026-08-19" }
    });
    expect(parseDateInput("3 months", options)).toEqual({
      status: "success",
      value: { start: "2026-05-19", end: "2026-08-19" }
    });
    expect(parseDateInput("7 days ago", options)).toEqual({
      status: "success",
      value: { start: "2026-08-12", end: "2026-08-12" }
    });
    expect(parseDateInput("day ago", options)).toEqual({
      status: "success",
      value: { start: "2026-08-18", end: "2026-08-18" }
    });
    expect(parseDateInput("month ago", options)).toEqual({
      status: "success",
      value: { start: "2026-07-19", end: "2026-07-19" }
    });
    expect(parseDateInput("year ago", options)).toEqual({
      status: "success",
      value: { start: "2025-08-19", end: "2025-08-19" }
    });
  });

  it("recognizes English this and next calendar periods", () => {
    expect(parseDateInput("this day", options)).toEqual({
      status: "success",
      value: { start: "2026-08-19", end: "2026-08-19" }
    });
    expect(parseDateInput("next day", options)).toEqual({
      status: "success",
      value: { start: "2026-08-20", end: "2026-08-20" }
    });
    expect(parseDateInput("next week", options)).toEqual({
      status: "success",
      value: { start: "2026-08-24", end: "2026-08-30" }
    });
    expect(parseDateInput("next 2 weeks", options)).toEqual({
      status: "success",
      value: { start: "2026-08-24", end: "2026-09-06" }
    });
    expect(parseDateInput("this month", options)).toEqual({
      status: "success",
      value: { start: "2026-08-01", end: "2026-08-31" }
    });
    expect(parseDateInput("next month", options)).toEqual({
      status: "success",
      value: { start: "2026-09-01", end: "2026-09-30" }
    });
    expect(parseDateInput("next 2 months", options)).toEqual({
      status: "success",
      value: { start: "2026-09-01", end: "2026-10-31" }
    });
    expect(parseDateInput("this year", options)).toEqual({
      status: "success",
      value: { start: "2026-01-01", end: "2026-12-31" }
    });
    expect(parseDateInput("next year", options)).toEqual({
      status: "success",
      value: { start: "2027-01-01", end: "2027-12-31" }
    });
  });

  it("normalizes absolute ranges and protects incomplete or invalid drafts", () => {
    expect(parseDateInput("18/12 – 14/12", options)).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-18" }
    });
    expect(parseDateInput("18/12 — 14/12", options)).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-18" }
    });
    expect(parseDateInput("22.07 - 7 days ago", options)).toEqual({
      status: "success",
      value: { start: "2026-07-22", end: "2026-08-12" }
    });
    expect(parseDateInput("12 June 2026 – next Monday", { ...options, referenceDate: "2026-08-25" })).toEqual({
      status: "success",
      value: { start: "2026-06-12", end: "2026-08-31" }
    });
    expect(parseDateInput("12/14 -", options)).toEqual({
      status: "partial-range",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput("12 jul nope", options)).toEqual({ status: "invalid" });
    expect(parseDateInput("1 January 198", options)).toEqual({ status: "invalid" });
    expect(parseDateInput("12#14", options)).toEqual({ status: "invalid" });
    expect(parseDateInput("   ", options)).toEqual({ status: "empty" });
  });
});
