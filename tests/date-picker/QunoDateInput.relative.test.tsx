import { fireEvent, render, screen } from "@testing-library/react";
import { QunoDateInput, type DateRange } from "../../src/lib/date-input";

const expectedRange: DateRange = { start: "2024-01-01", end: "2028-12-31" };

describe("QunoDateInput calendar phrases", () => {
  it("commits previous calendar periods and named weekdays", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput aria-label="Dates" expectedRange={expectedRange} onChange={onChange} referenceDate="2026-08-19" />
    );
    const input = screen.getByRole("textbox", { name: "Dates" });

    fireEvent.input(input, { target: { value: "previous month" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-07-01", end: "2026-07-31" });

    fireEvent.input(input, { target: { value: "this week" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-17", end: "2026-08-23" });

    fireEvent.input(input, { target: { value: "next monday" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-24", end: "2026-08-24" });
  });

  it("shares the datepicker weekStartsOn format", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        aria-label="Sunday-first dates"
        expectedRange={expectedRange}
        onChange={onChange}
        referenceDate="2026-08-19"
        weekStartsOn={0}
      />
    );
    const input = screen.getByRole("textbox", { name: "Sunday-first dates" });

    fireEvent.input(input, { target: { value: "this week" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-16", end: "2026-08-22" });
  });
});
