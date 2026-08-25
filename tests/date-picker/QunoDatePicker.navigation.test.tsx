import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { clickDay, day, edge, pill, slot } from "./datePickerTestUtils";

describe("QunoDatePicker navigation", () => {
  it("keeps passive outside-month hover noncommitting", () => {
    const onChange = vi.fn();
    const onVisibleMonthChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={onChange}
        onVisibleMonthChange={onVisibleMonthChange}
      />
    );

    fireEvent.pointerEnter(day("2026-09-02"));
    expect(day("2026-09-02")).not.toHaveAttribute("data-preview");
    expect(onChange).not.toHaveBeenCalled();
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
    expect(slot("month-heading")).toHaveTextContent("August 2026");
  });

  it("auto-navigates after the drag edge delay and keeps the drag active", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-20", end: "2026-08-28" }}
        initialMonth="2026-08-01"
        autoNavigateDelay={400}
        onChange={onChange}
      />
    );

    fireEvent.pointerDown(day("2026-08-28"));
    fireEvent.pointerEnter(edge("next"));
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(slot("month-heading")).toHaveTextContent("August 2026");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(slot("month-heading")).toHaveTextContent("September 2026");
    expect(slot("grid")).toHaveAttribute("data-month-motion", "next");

    fireEvent.pointerEnter(day("2026-09-05"));
    fireEvent.pointerUp(day("2026-09-05"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-20",
      end: "2026-09-05"
    });
    vi.useRealTimers();
  });

  it("does not edge-navigate from passive movement after a date click", () => {
    vi.useFakeTimers();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        autoNavigateDelay={400}
      />
    );

    clickDay("2026-08-15");
    fireEvent.pointerEnter(edge("next"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slot("month-heading")).toHaveTextContent("August 2026");
    vi.useRealTimers();
  });

  it("shows off-screen endpoint pills and jumps to their months", () => {
    render(<QunoDatePicker defaultValue={{ start: "2026-07-20", end: "2026-09-08" }} initialMonth="2026-08-01" />);

    expect(slot("root")).toHaveAttribute("data-pill-before", "true");
    expect(slot("root")).toHaveAttribute("data-pill-after", "true");
    expect(pill("start", "before")).toBeVisible();
    expect(pill("end", "after")).toBeVisible();
    fireEvent.click(pill("end", "after"));
    expect(slot("month-heading")).toHaveTextContent("September 2026");
    expect(slot("grid")).toHaveAttribute("data-month-motion", "next");
    expect(
      document.querySelector('[data-slot="pill"][data-endpoint="end"][data-position="after"]')
    ).not.toBeInTheDocument();
    expect(slot("root")).not.toHaveAttribute("data-pill-after");
    expect(slot("root")).toHaveAttribute("data-pill-before", "true");
    expect(pill("start", "before")).toBeVisible();
    fireEvent.click(pill("start", "before"));
    expect(slot("month-heading")).toHaveTextContent("July 2026");
    expect(slot("grid")).toHaveAttribute("data-month-motion", "previous");
  });

  it("switches month when a click releases on an outside-month day", () => {
    const onChange = vi.fn();
    const onVisibleMonthChange = vi.fn();
    render(
      <QunoDatePicker initialMonth="2026-08-01" onChange={onChange} onVisibleMonthChange={onVisibleMonthChange} />
    );

    clickDay("2026-07-31");
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-07-31",
      end: "2026-07-31"
    });
    expect(slot("month-heading")).toHaveTextContent("July 2026");
    expect(onVisibleMonthChange).toHaveBeenLastCalledWith("2026-07-01");
  });

  it("cycles an outside-month date without rendering a menu", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={onChange}
      />
    );

    clickDay("2026-09-02");
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-10",
      end: "2026-09-02"
    });
    expect(slot("month-heading")).toHaveTextContent("September 2026");
    expect(screen.queryByRole("menu")).toBeNull();

    clickDay("2026-09-02");
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-20",
      end: "2026-09-02"
    });
  });

  it("switches month when a drag releases on an outside-month day", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-20", end: "2026-08-28" }}
        initialMonth="2026-08-01"
        onChange={onChange}
      />
    );

    fireEvent.pointerDown(day("2026-08-28"));
    fireEvent.pointerEnter(day("2026-09-03"));
    fireEvent.pointerUp(day("2026-09-03"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-08-20",
      end: "2026-09-03"
    });
    expect(slot("month-heading")).toHaveTextContent("September 2026");
    expect(slot("grid")).toHaveAttribute("data-month-motion", "next");
  });

  it("marks a previous-month drag release with upward-origin motion", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-08-10", end: "2026-08-20" }}
        initialMonth="2026-08-01"
        onChange={onChange}
      />
    );

    fireEvent.pointerDown(day("2026-08-10"));
    fireEvent.pointerEnter(day("2026-07-31"));
    fireEvent.pointerUp(day("2026-07-31"));
    expect(onChange).toHaveBeenLastCalledWith({
      start: "2026-07-31",
      end: "2026-08-20"
    });
    expect(slot("month-heading")).toHaveTextContent("July 2026");
    expect(slot("grid")).toHaveAttribute("data-month-motion", "previous");
  });
});
