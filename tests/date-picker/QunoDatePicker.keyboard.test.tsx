import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { day, slot } from "./datePickerTestUtils";

describe("date-only keyboard activation", () => {
  it.each(["{Enter}", " "])("selects one day once with %s and retains day focus", async (key) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QunoDatePicker initialMonth="2026-08-01" selectionMode="single" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();

    const target = day("2026-08-12");
    target.focus();
    await user.keyboard(key);

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      value: { start: "2026-08-12", end: "2026-08-12" }
    });
    expect(target).toHaveAttribute("aria-selected", "true");
    expect(target).toHaveFocus();
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
  });

  it("uses the existing range-selection behavior for keyboard activation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QunoDatePicker initialMonth="2026-08-01" onChange={onChange} />);

    day("2026-08-10").focus();
    await user.keyboard("{Enter}");
    day("2026-08-15").focus();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({
      value: { start: "2026-08-10", end: "2026-08-15" }
    });
    expect(day("2026-08-10")).toHaveAttribute("data-range-start", "true");
    expect(day("2026-08-15")).toHaveAttribute("data-range-end", "true");
  });

  it("rejects native activation of disabled and out-of-bounds days", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        selectionMode="single"
        limitDateFrom="2026-08-10"
        limitDateTo="2026-08-20"
        isDayDisabled={({ date }) => date === "2026-08-12"}
        onChange={onChange}
      />
    );

    for (const date of ["2026-08-09", "2026-08-12", "2026-08-21"]) {
      expect(day(date)).toBeDisabled();
      fireEvent.click(day(date), { detail: 0 });
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('[data-selected="true"]')).toBeNull();
  });
});
