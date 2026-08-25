import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { day, overflowDay, slot, weekday } from "./datePickerTestUtils";

afterEach(() => vi.restoreAllMocks());

const hitDate = (date: string): void => {
  hitElement(day(date));
};

const hitElement = (element: Element): void => {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: vi.fn(() => element)
  });
};

describe("QunoDatePicker touch painting", () => {
  it("resolves the destination under an implicitly captured touch pointer", () => {
    const onChange = vi.fn();
    render(<QunoDatePicker initialMonth="2026-08-01" onChange={onChange} />);
    const origin = day("2026-08-04");

    fireEvent.pointerDown(origin, {
      pointerId: 7,
      pointerType: "touch"
    });
    hitDate("2026-08-09");
    fireEvent.pointerMove(origin, { pointerId: 7, pointerType: "touch" });
    fireEvent.pointerUp(origin, { pointerId: 7, pointerType: "touch" });

    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-04",
      end: "2026-08-09"
    });
  });

  it("keeps the last valid date while the finger crosses a grid gap", () => {
    const onChange = vi.fn();
    render(<QunoDatePicker initialMonth="2026-08-01" onChange={onChange} />);
    const origin = day("2026-08-04");

    fireEvent.pointerDown(origin, { pointerId: 8, pointerType: "touch" });
    expect(slot("grid")).toHaveAttribute("data-interaction-active", "true");
    hitDate("2026-08-09");
    fireEvent.pointerMove(origin, { pointerId: 8, pointerType: "touch" });
    expect(day("2026-08-06")).toHaveAttribute("data-selected", "true");

    hitElement(slot("grid"));
    fireEvent.pointerMove(origin, { pointerId: 8, pointerType: "touch" });
    expect(day("2026-08-06")).toHaveAttribute("data-selected", "true");
    fireEvent.pointerUp(origin, { pointerId: 8, pointerType: "touch" });

    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-04",
      end: "2026-08-09"
    });
    expect(slot("grid")).not.toHaveAttribute("data-interaction-active");
  });

  it("does not repaint for repeated touch moves within one date", () => {
    const styleDay = vi.fn(() => undefined);
    render(<QunoDatePicker initialMonth="2026-08-01" getDayCellProps={styleDay} />);
    const origin = day("2026-08-04");

    fireEvent.pointerDown(origin, { pointerId: 10, pointerType: "touch" });
    hitDate("2026-08-09");
    fireEvent.pointerMove(origin, { pointerId: 10, pointerType: "touch" });
    const callsAfterDateChange = styleDay.mock.calls.length;
    fireEvent.pointerMove(origin, { pointerId: 10, pointerType: "touch" });

    expect(styleDay).toHaveBeenCalledTimes(callsAfterDateChange);
  });

  it("discards the transient range when the touch pointer is cancelled", () => {
    const onChange = vi.fn();
    render(<QunoDatePicker initialMonth="2026-08-01" onChange={onChange} />);
    const origin = day("2026-08-04");

    fireEvent.pointerDown(origin, {
      pointerId: 9,
      pointerType: "touch"
    });
    hitDate("2026-08-09");
    fireEvent.pointerMove(origin, { pointerId: 9, pointerType: "touch" });
    expect(day("2026-08-06")).toHaveAttribute("data-selected", "true");

    fireEvent.pointerCancel(origin, { pointerId: 9, pointerType: "touch" });
    expect(day("2026-08-06")).not.toHaveAttribute("data-selected");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reveals, clears, and commits hidden weekday-strip dates", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
        initialMonth="2026-08-01"
        onChange={onChange}
      />
    );
    const origin = day("2026-08-10");
    const hiddenMonday = weekday(1);

    fireEvent.pointerDown(origin, { pointerId: 11, pointerType: "touch" });
    hitElement(hiddenMonday);
    fireEvent.pointerMove(origin, { pointerId: 11, pointerType: "touch" });
    expect(overflowDay("2026-07-20")).toHaveAttribute("data-selected", "true");

    hitDate("2026-08-05");
    fireEvent.pointerMove(origin, { pointerId: 11, pointerType: "touch" });
    expect(document.querySelector('[data-slot="overflow-day"]')).toBeNull();

    hitElement(hiddenMonday);
    fireEvent.pointerMove(origin, { pointerId: 11, pointerType: "touch" });
    hitElement(overflowDay("2026-07-20"));
    fireEvent.pointerUp(origin, { pointerId: 11, pointerType: "touch" });
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-07-20",
      end: "2026-08-18"
    });
  });
});
