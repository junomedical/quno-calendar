import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QunoDatePicker, type DateRange, type IsoDate } from "@quno/calendar/datepicker";
import { clickDay, day, slot } from "./datePickerTestUtils";

const disabled =
  (...dates: IsoDate[]) =>
  ({ date }: { date: IsoDate }): boolean =>
    dates.includes(date);

describe("QunoDatePicker disabled days", () => {
  it("applies inclusive hard limits before consulting the day resolver", () => {
    const onChange = vi.fn();
    const isDayDisabled = vi.fn(() => false);
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        selectionMode="single"
        limitDateFrom="2026-08-10"
        limitDateTo="2026-08-20"
        isDayDisabled={isDayDisabled}
        onChange={({ value }) => onChange(value)}
      />
    );

    expect(day("2026-08-09")).toBeDisabled();
    expect(day("2026-08-10")).toBeEnabled();
    expect(day("2026-08-20")).toBeEnabled();
    expect(day("2026-08-21")).toBeDisabled();
    expect(isDayDisabled).not.toHaveBeenCalledWith({ date: "2026-08-09" });
    expect(isDayDisabled).not.toHaveBeenCalledWith({ date: "2026-08-21" });
    expect(isDayDisabled).toHaveBeenCalledWith({ date: "2026-08-10" });
    expect(isDayDisabled).toHaveBeenCalledWith({ date: "2026-08-20" });

    clickDay("2026-08-09");
    clickDay("2026-08-21");
    expect(onChange).not.toHaveBeenCalled();
    clickDay("2026-08-10");
    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-10", end: "2026-08-10" });
  });

  it("retains the latest in-bounds range endpoint when a gesture crosses a limit", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        limitDateFrom="2026-08-10"
        limitDateTo="2026-08-20"
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day("2026-08-10"));
    fireEvent.pointerEnter(day("2026-08-20"));
    fireEvent.pointerEnter(day("2026-08-21"));
    fireEvent.pointerUp(day("2026-08-21"));

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-10", end: "2026-08-20" });
  });

  it("exposes native and stable disabled state without committing a click", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-08-12")}
        getDayCellProps={({ isDisabled }) => ({ className: isDisabled ? "consumer-disabled" : undefined })}
        onChange={({ value }) => onChange(value)}
      />
    );

    expect(day("2026-08-12")).toBeDisabled();
    expect(day("2026-08-12")).toHaveAttribute("data-disabled", "true");
    expect(day("2026-08-12")).toHaveClass("quno-date-picker-day--disabled", "consumer-disabled");
    clickDay("2026-08-12");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("prevents disabled single-day selections", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        selectionMode="single"
        isDayDisabled={disabled("2026-08-18")}
        onChange={({ value }) => onChange(value)}
      />
    );

    clickDay("2026-08-18");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("allows disabled interior dates when both range endpoints are enabled", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-08-11")}
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day("2026-08-10"));
    fireEvent.pointerEnter(day("2026-08-12"));
    fireEvent.pointerUp(day("2026-08-12"));

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-10", end: "2026-08-12" });
    expect(day("2026-08-11")).toHaveAttribute("data-selected", "true");
  });

  it("retains the last valid endpoint when a drag releases on a disabled day", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-08-19")}
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day("2026-08-20"));
    fireEvent.pointerEnter(day("2026-08-18"));
    fireEvent.pointerEnter(day("2026-08-19"));
    fireEvent.pointerUp(day("2026-08-19"));

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-10", end: "2026-08-18" });
  });

  it("retains the last whole-range position whose endpoints are enabled", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-12" }}
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-08-16")}
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day("2026-08-11"));
    fireEvent.pointerEnter(day("2026-08-14"));
    fireEvent.pointerEnter(day("2026-08-15"));
    fireEvent.pointerUp(day("2026-08-15"));

    expect(onChange).toHaveBeenLastCalledWith({ start: "2026-08-13", end: "2026-08-15" });
  });

  it("does not navigate after an outside-month disabled click", () => {
    const onVisibleMonthChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-09-02")}
        onVisibleMonthChange={({ month }) => onVisibleMonthChange(month)}
      />
    );

    clickDay("2026-09-02");
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
    expect(slot("month-heading")).toHaveTextContent("August 2026");
  });

  it("preserves a supplied range while preventing new disabled endpoints", () => {
    const value: DateRange = { start: "2026-08-10", end: "2026-08-12" };
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        value={value}
        initialMonth="2026-08-01"
        isDayDisabled={disabled("2026-08-10")}
        onChange={({ value }) => onChange(value)}
      />
    );

    expect(day("2026-08-10")).toHaveAttribute("data-range-start", "true");
    expect(day("2026-08-10")).toBeDisabled();
    clickDay("2026-08-10");
    expect(onChange).not.toHaveBeenCalled();
  });
});
