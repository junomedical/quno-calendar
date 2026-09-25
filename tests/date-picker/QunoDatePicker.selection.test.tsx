import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { clickDay, day, drag, slot } from "./datePickerTestUtils";

describe("QunoDatePicker selection", () => {
  it("supports empty, single-day, edited range, and clear", () => {
    const changes: Array<DateRange | null> = [];
    render(<QunoDatePicker initialMonth="2026-08-01" onChange={({ value }) => changes.push(value)} />);

    clickDay("2026-08-10");
    expect(changes.at(-1)).toEqual({
      start: "2026-08-10",
      end: "2026-08-10"
    });
    fireEvent.pointerEnter(day("2026-08-15"));
    expect(changes).toHaveLength(1);
    expect(day("2026-08-15")).not.toHaveAttribute("data-preview");
    expect(day("2026-08-15")).not.toHaveAttribute("data-range-end");
    expect(day("2026-08-10")).toHaveAttribute("data-range-start", "true");
    expect(day("2026-08-10")).toHaveAttribute("data-range-end", "true");
    expect(slot("selection-summary")).toHaveTextContent("10 Aug 2026");
    clickDay("2026-08-15");
    expect(changes.at(-1)).toEqual({
      start: "2026-08-10",
      end: "2026-08-15"
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(changes.at(-1)).toBeNull();
    expect(slot("month-heading")).toHaveTextContent("August 2026");
  });

  it("keeps pointer gestures and supplied values to one day in single mode", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        selectionMode="single"
        onChange={({ value }) => onChange(value)}
      />
    );

    expect(day("2026-08-10")).toHaveAttribute("data-selected", "true");
    expect(day("2026-08-20")).not.toHaveAttribute("data-selected");
    expect(slot("selection-header")).toHaveTextContent("Selected day");
    fireEvent.pointerDown(day("2026-08-12"));
    fireEvent.pointerEnter(day("2026-08-18"));
    expect(day("2026-08-18")).toHaveAttribute("data-selected", "true");
    expect(day("2026-08-12")).not.toHaveAttribute("data-selected");
    fireEvent.pointerUp(day("2026-08-18"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-18",
      end: "2026-08-18"
    });
  });

  it("renders one off-screen shortcut for a single selected day", () => {
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-09-01"
        selectionMode="single"
      />
    );

    expect(document.querySelectorAll('[data-slot="pill"]')).toHaveLength(1);
  });

  it("does not paint or commit a prospective period on hover", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerEnter(day("2026-08-15"));
    expect(onChange).not.toHaveBeenCalled();
    expect(day("2026-08-20")).toHaveAttribute("data-range-end", "true");
    expect(day("2026-08-20")).not.toHaveAttribute("data-preview-action");
    expect(day("2026-08-15")).not.toHaveAttribute("data-preview-endpoint");
    expect(day("2026-08-15")).not.toHaveAttribute("data-range-end");
    expect(slot("selection-summary")).toHaveTextContent("10 Aug 2026 – 20 Aug 2026");
  });

  it("drags an endpoint across the other endpoint and swaps it", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day("2026-08-20"));
    fireEvent.pointerEnter(day("2026-08-07"));
    fireEvent.pointerEnter(day("2026-08-05"));
    fireEvent.pointerUp(day("2026-08-05"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-05",
      end: "2026-08-10"
    });
  });

  it("drags the whole range and preserves its inclusive duration", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-15" }}
        initialMonth="2026-08-01"
        onChange={({ value }) => onChange(value)}
      />
    );

    drag("2026-08-12", "2026-08-18");
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-16",
      end: "2026-08-21"
    });
  });

  it.each([
    ["whole range", { start: "2026-08-10", end: "2026-08-15" }, "2026-08-12"],
    ["single date", { start: "2026-08-10", end: "2026-08-10" }, "2026-08-10"],
    ["start endpoint", { start: "2026-08-10", end: "2026-08-15" }, "2026-08-10"],
    ["end endpoint", { start: "2026-08-10", end: "2026-08-15" }, "2026-08-15"]
  ] as const)("marks a %s drag as moving without hover emphasis", (_, value, origin) => {
    render(<QunoDatePicker defaultValue={value} initialMonth="2026-08-01" />);

    fireEvent.pointerDown(day(origin));
    expect(slot("calendar")).toHaveAttribute("data-dragging", "move");
    expect(slot("grid")).toHaveAttribute("data-dragging", "move");

    fireEvent.pointerUp(day(origin));
    expect(slot("calendar")).not.toHaveAttribute("data-dragging");
    expect(slot("grid")).not.toHaveAttribute("data-dragging");
  });

  it.each([
    ["after", "2026-08-25", "2026-08-28", "2026-08-25", "2026-08-28"],
    ["before", "2026-08-08", "2026-08-05", "2026-08-05", "2026-08-08"]
  ])("paints a fresh range when dragging %s the current segment", (_, origin, target, start, end) => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={({ value }) => onChange(value)}
      />
    );

    fireEvent.pointerDown(day(origin));
    fireEvent.pointerEnter(day(target));
    expect(day(start)).toHaveAttribute("data-range-start", "true");
    expect(day(end)).toHaveAttribute("data-range-end", "true");
    expect(day("2026-08-20")).not.toHaveAttribute("data-selected");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(day(target));
    expect(onChange).toHaveBeenLastCalledWith({ start, end });
  });
});
