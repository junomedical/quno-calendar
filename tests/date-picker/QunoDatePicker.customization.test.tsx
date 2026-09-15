import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { day, slot } from "./datePickerTestUtils";

describe("QunoDatePicker customization", () => {
  afterEach(() => vi.useRealTimers());

  it("exposes labels, formatters, week starts, and style hooks", () => {
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        weekStartsOn={0}
        className="consumer-root"
        classNames={{ day: "consumer-day", monthHeading: "consumer-month" }}
        labels={{
          calendar: "Booking dates",
          chooseDate: "Pick dates",
          clear: "Reset dates",
          previousMonth: "Back one month"
        }}
        formatters={{
          month: ({ month }) => `Month:${month.slice(0, 7)}`,
          weekday: ({ weekday: dayIndex }) => `Day:${dayIndex}`
        }}
      />
    );

    expect(slot("root")).toHaveClass("consumer-root");
    expect(slot("month-heading")).toHaveClass("consumer-month");
    expect(slot("month-heading")).toHaveTextContent("Month:2026-08");
    expect(day("2026-08-10")).toHaveClass("consumer-day");
    expect(screen.getByRole("button", { name: "Back one month" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Back one month" }).querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByRole("button", { name: "Reset dates" })).toBeDisabled();
    expect(slot("selection-summary")).toHaveTextContent("Pick dates");
    expect(document.querySelector('[data-slot="weekday"]')).toHaveTextContent("Day:0");
  });

  it("pads visible day numbers only when opted in, without changing accessible labels", () => {
    const { rerender } = render(<QunoDatePicker initialMonth="2026-08-01" />);
    const label = day("2026-08-01").getAttribute("aria-label");
    expect(day("2026-08-01").textContent).toBe("1");
    rerender(<QunoDatePicker initialMonth="2026-08-01" padDayNumbers />);
    expect(day("2026-08-01").textContent).toBe("01");
    expect(day("2026-08-09").textContent).toBe("09");
    expect(day("2026-08-10").textContent).toBe("10");
    expect(day("2026-09-01").textContent).toBe("01");
    expect(day("2026-08-01")).toHaveAttribute("aria-label", label);
    rerender(<QunoDatePicker initialMonth="2026-08-01" padDayNumbers={false} />);
    expect(day("2026-08-01").textContent).toBe("1");
  });

  it("customizes day cells from external date and selection context", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T12:00:00Z"));
    render(
      <QunoDatePicker
        initialMonth="2026-08-01"
        defaultValue={{ start: "2026-08-10", end: "2026-08-12" }}
        getDayCellProps={(context) => ({
          className: context.isWeekend ? "consumer-weekend" : undefined,
          style: context.isToday ? { color: "rgb(255, 0, 0)" } : undefined,
          title: `${context.weekday}:${context.isCommitted}`
        })}
      />
    );

    expect(day("2026-08-08")).toHaveClass("consumer-weekend");
    expect(day("2026-08-08")).toHaveAttribute("title", "6:false");
    expect(day("2026-08-10")).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(day("2026-08-10")).toHaveAttribute("title", "1:true");
  });

  it("renders a supplied footer inside the calendar shell", () => {
    render(<QunoDatePicker calendarFooter={<p>Keyboard date entry</p>} />);
    const footer = screen.getByText("Keyboard date entry");
    expect(document.querySelector('[data-slot="calendar"]')).toContainElement(footer);
    expect(document.querySelector('[data-slot="calendar-footer"]')).toContainElement(footer);
  });
});
