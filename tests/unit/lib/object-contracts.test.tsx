import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { addDays, fromIsoDate, isIsoDate, type DateRange } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { parseDateInput } from "@quno/calendar/date-parser";
import { clickDay } from "#quno-tests/date-picker/datePickerTestUtils";

const expectedRange: DateRange = { start: "2026-01-01", end: "2026-12-31" };

describe("named public callback contracts", () => {
  it("emits the same named selection payload from input and picker", () => {
    const changed = vi.fn();
    const { unmount } = render(<QunoDateInput expectedRange={expectedRange} onChange={changed} aria-label="Dates" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "12 August 2026" } });
    fireEvent.input(screen.getByRole("textbox"), { target: { value: "12 August 2026" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(changed).toHaveBeenLastCalledWith({ value: { start: "2026-08-12", end: "2026-08-12" } });
    unmount();
    changed.mockClear();
    render(<QunoDatePicker initialMonth="2026-08-01" selectionMode="single" onChange={changed} />);
    clickDay("2026-08-12");
    expect(changed).toHaveBeenLastCalledWith({ value: { start: "2026-08-12", end: "2026-08-12" } });
  });

  it("passes named formatting and availability contexts and retains defaults", () => {
    const range = vi.fn(({ value }: { value: DateRange; locale: string }) => value.start);
    const isDayDisabled = vi.fn(({ date }: { date: string }) => date === "2026-08-12");
    render(
      <>
        <QunoDateInput expectedRange={expectedRange} value={expectedRange} locale="de-DE" formatters={{ range }} />
        <QunoDatePicker
          initialMonth="2026-08-01"
          isDayDisabled={isDayDisabled}
          formatters={{ month: ({ month, locale }) => `${month} ${locale}` }}
        />
      </>
    );
    expect(range).toHaveBeenCalledWith({ value: expectedRange, locale: "de-DE" });
    expect(isDayDisabled).toHaveBeenCalledWith({ date: "2026-08-12" });
    expect(screen.getByText("2026-08-01 en-GB")).toBeVisible();
  });

  it("keeps ISO validation, calendar arithmetic and language inference", () => {
    const candidate = { value: "2024-02-29" };
    expect(isIsoDate(candidate)).toBe(true);
    expect(isIsoDate({ value: "2023-02-29" })).toBe(false);
    expect(addDays({ date: "2024-02-29", amount: 1 })).toBe("2024-03-01");
    expect(fromIsoDate({ value: "2024-02-29" }).getUTCDate()).toBe(29);
    for (const parserLanguages of [undefined, []]) {
      expect(
        parseDateInput({ text: "heute", expectedRange, locale: "de-DE", referenceDate: "2026-08-12", parserLanguages })
      ).toEqual({ status: "success", value: { start: "2026-08-12", end: "2026-08-12" } });
    }
  });
});
