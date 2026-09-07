import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const options = {
  expectedRange: { start: "2025-08-19", end: "2026-08-19" } as const,
  referenceDate: "2026-08-19" as const
};

describe("natural date parser", () => {
  it("tokenizes date parts separately from explicit range separators", () => {
    expect(tokenizeDateInput({ text: "12/14 -" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "number", value: "12" }),
        expect.objectContaining({ type: "number", value: "14" }),
        expect.objectContaining({ type: "range-separator", value: "-" })
      ])
    );
    expect(tokenizeDateInput({ text: "2026-08-19" })).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "range-separator" })])
    );
    expect(tokenizeDateInput({ text: "22–07—80" })).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "range-separator" })])
    );
  });

  it("uses the expected window to infer a missing year", () => {
    expect(parseDateInput({ text: "12/14", ...options })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
  });

  it("rejects range results in single-day mode", () => {
    expect(parseDateInput({ text: "12/14", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput({ text: "12/14 – 15/12", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "invalid"
    });
    expect(parseDateInput({ text: "next month", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "invalid"
    });
    expect(parseDateInput({ text: "12/14 –", ...{ ...options, selectionMode: "single" } })).toEqual({
      status: "partial-range",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
  });

  it("lets business preference resolve numeric date order conflicts", () => {
    expect(parseDateInput({ text: "3/4/2026", ...{ ...options, preferredDateOrder: "dmy" } })).toEqual({
      status: "success",
      value: { start: "2026-04-03", end: "2026-04-03" }
    });
    expect(parseDateInput({ text: "3/4/2026", ...{ ...options, preferredDateOrder: "mdy" } })).toEqual({
      status: "success",
      value: { start: "2026-03-04", end: "2026-03-04" }
    });
    expect(parseDateInput({ text: "20 12 12", ...{ ...options, preferredDateOrder: "ymd" } })).toEqual({
      status: "success",
      value: { start: "2020-12-12", end: "2020-12-12" }
    });
  });

  it("resolves two-digit years, month words, locale order, and leap days", () => {
    expect(parseDateInput({ text: "22 / 07 / 80", ...options })).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput({ text: "22 80 07", ...options })).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput({ text: "22-07-80", ...options })).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput({ text: "22–07–80", ...options })).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput({ text: "22—07—80", ...options })).toEqual({
      status: "success",
      value: { start: "1980-07-22", end: "1980-07-22" }
    });
    expect(parseDateInput({ text: "12 jul", ...options })).toEqual({
      status: "success",
      value: { start: "2026-07-12", end: "2026-07-12" }
    });
    expect(parseDateInput({ text: "12 juni", ...{ ...options, parserLanguages: ["en", "de"] } })).toEqual({
      status: "success",
      value: { start: "2026-06-12", end: "2026-06-12" }
    });
    expect(parseDateInput({ text: "3/4/2026", ...{ ...options, locale: "en-US" } })).toEqual({
      status: "success",
      value: { start: "2026-03-04", end: "2026-03-04" }
    });
    expect(parseDateInput({ text: "December 14, 2025", ...{ ...options, locale: "en-US" } })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput({ text: "29/02/2024", ...options }).status).toBe("success");
    expect(parseDateInput({ text: "29/02/2025", ...options })).toEqual({ status: "invalid" });
  });

  it("recognizes German forms and completed relative periods", () => {
    expect(parseDateInput({ text: "heute", ...{ ...options, parserLanguages: ["de"] } })).toEqual({
      status: "success",
      value: { start: "2026-08-19", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "letzte 2 monate", ...{ ...options, parserLanguages: ["de"] } })).toEqual({
      status: "success",
      value: { start: "2026-06-01", end: "2026-07-31" }
    });
    expect(parseDateInput({ text: "last 3 days", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-16", end: "2026-08-18" }
    });
    expect(parseDateInput({ text: "past 90 days", ...options })).toEqual({
      status: "success",
      value: { start: "2026-05-22", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "past 3 months", ...options })).toEqual({
      status: "success",
      value: { start: "2026-05-19", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "90 days", ...options })).toEqual({
      status: "success",
      value: { start: "2026-05-22", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "3 months", ...options })).toEqual({
      status: "success",
      value: { start: "2026-05-19", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "7 days ago", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-12", end: "2026-08-12" }
    });
    expect(parseDateInput({ text: "day ago", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-18", end: "2026-08-18" }
    });
    expect(parseDateInput({ text: "month ago", ...options })).toEqual({
      status: "success",
      value: { start: "2026-07-19", end: "2026-07-19" }
    });
    expect(parseDateInput({ text: "year ago", ...options })).toEqual({
      status: "success",
      value: { start: "2025-08-19", end: "2025-08-19" }
    });
  });

  it("recognizes English this and next calendar periods", () => {
    expect(parseDateInput({ text: "this day", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-19", end: "2026-08-19" }
    });
    expect(parseDateInput({ text: "next day", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-20", end: "2026-08-20" }
    });
    expect(parseDateInput({ text: "next week", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-24", end: "2026-08-30" }
    });
    expect(parseDateInput({ text: "next 2 weeks", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-24", end: "2026-09-06" }
    });
    expect(parseDateInput({ text: "this month", ...options })).toEqual({
      status: "success",
      value: { start: "2026-08-01", end: "2026-08-31" }
    });
    expect(parseDateInput({ text: "next month", ...options })).toEqual({
      status: "success",
      value: { start: "2026-09-01", end: "2026-09-30" }
    });
    expect(parseDateInput({ text: "next 2 months", ...options })).toEqual({
      status: "success",
      value: { start: "2026-09-01", end: "2026-10-31" }
    });
    expect(parseDateInput({ text: "this year", ...options })).toEqual({
      status: "success",
      value: { start: "2026-01-01", end: "2026-12-31" }
    });
    expect(parseDateInput({ text: "next year", ...options })).toEqual({
      status: "success",
      value: { start: "2027-01-01", end: "2027-12-31" }
    });
  });

  it("normalizes absolute ranges and protects incomplete or invalid drafts", () => {
    expect(parseDateInput({ text: "18/12 – 14/12", ...options })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-18" }
    });
    expect(parseDateInput({ text: "18/12 — 14/12", ...options })).toEqual({
      status: "success",
      value: { start: "2025-12-14", end: "2025-12-18" }
    });
    expect(parseDateInput({ text: "22.07 - 7 days ago", ...options })).toEqual({
      status: "success",
      value: { start: "2026-07-22", end: "2026-08-12" }
    });
    expect(
      parseDateInput({ text: "12 June 2026 – next Monday", ...{ ...options, referenceDate: "2026-08-25" } })
    ).toEqual({
      status: "success",
      value: { start: "2026-06-12", end: "2026-08-31" }
    });
    expect(parseDateInput({ text: "12/14 -", ...options })).toEqual({
      status: "partial-range",
      value: { start: "2025-12-14", end: "2025-12-14" }
    });
    expect(parseDateInput({ text: "12 jul nope", ...options })).toEqual({ status: "invalid" });
    expect(parseDateInput({ text: "1 January 198", ...options })).toEqual({ status: "invalid" });
    expect(parseDateInput({ text: "12#14", ...options })).toEqual({ status: "invalid" });
    expect(parseDateInput({ text: "   ", ...options })).toEqual({ status: "empty" });
  });
});
