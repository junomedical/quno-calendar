import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QunoDatePicker } from "../../src/lib/date-picker";
import { pill, slot } from "./datePickerTestUtils";

afterEach(() => vi.restoreAllMocks());

describe("QunoDatePicker motion", () => {
  it("marks month names with the calendar navigation direction", () => {
    render(<QunoDatePicker initialMonth="2026-08-01" />);

    fireEvent.click(slot("next-button"));
    expect(slot("month-heading")).toHaveTextContent("September 2026");
    expect(slot("month-heading")).toHaveAttribute("data-month-motion", "next");

    fireEvent.click(slot("previous-button"));
    expect(slot("month-heading")).toHaveTextContent("August 2026");
    expect(slot("month-heading")).toHaveAttribute("data-month-motion", "previous");
  });

  it("keeps the calendar stationary when navigation reveals endpoint pills", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      animationName: "quno-date-picker-pill-from-calendar-top"
    } as CSSStyleDeclaration);
    render(<QunoDatePicker defaultValue={{ start: "2026-08-10", end: "2026-08-20" }} initialMonth="2026-08-01" />);

    fireEvent.click(slot("previous-button"));

    expect(slot("month-heading")).toHaveTextContent("July 2026");
    expect(pill("start", "after").closest('[data-slot="pills"]')).toHaveAttribute("data-calendar-reveal", "stationary");
    expect(pill("end", "after")).toHaveAttribute("data-item-presence", "entering");
  });

  it.each([
    ["start", "before", "July 2026"],
    ["end", "after", "September 2026"]
  ] as const)("keeps an exiting %s pill mounted until its slide ends", (endpoint, position, month) => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      animationName: "quno-date-picker-pill-exit"
    } as CSSStyleDeclaration);
    render(<QunoDatePicker defaultValue={{ start: "2026-07-20", end: "2026-09-08" }} initialMonth="2026-08-01" />);

    const exitingPill = pill(endpoint, position);
    fireEvent.click(exitingPill);
    const container = exitingPill.closest('[data-slot="pills"]');
    expect(slot("month-heading")).toHaveTextContent(month);
    expect(container).toHaveAttribute("data-presence", "exiting");
    expect(exitingPill).toBeDisabled();

    fireEvent.animationEnd(exitingPill);
    expect(container).not.toBeInTheDocument();
  });

  it.each([
    ["start", "before", "end", "after", "May 2006"],
    ["end", "after", "start", "before", "January 2025"]
  ] as const)(
    "does not re-enter the opposite pill after clicking %s on a distant jump",
    (endpoint, position, stableEndpoint, stablePosition, month) => {
      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        animationName: "quno-date-picker-pill-motion"
      } as CSSStyleDeclaration);
      render(<QunoDatePicker defaultValue={{ start: "2006-05-28", end: "2025-01-02" }} initialMonth="2015-06-01" />);
      fireEvent.animationEnd(pill("start", "before"));
      fireEvent.animationEnd(pill("end", "after"));
      const stablePill = pill(stableEndpoint, stablePosition);
      const stableContainer = stablePill.closest('[data-slot="pills"]');

      fireEvent.click(pill(endpoint, position));
      expect(slot("month-heading")).toHaveTextContent(month);
      expect(stableContainer).toHaveAttribute("data-presence", "visible");

      const exiting = pill(endpoint, position);
      fireEvent.animationEnd(exiting);
      expect(stableContainer).toHaveAttribute("data-presence", "visible");
    }
  );

  it.each([
    ["start", "end", "before", { start: "2026-07-10", end: "2026-08-15" }, { start: "2026-07-10", end: "2026-07-20" }],
    ["end", "start", "after", { start: "2026-08-15", end: "2026-09-20" }, { start: "2026-09-10", end: "2026-09-20" }]
  ] as const)(
    "keeps %s fixed while the new %s pill enters beside it",
    (stableEndpoint, addedEndpoint, position, initialValue, nextValue) => {
      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        animationName: "quno-date-picker-pill-motion"
      } as CSSStyleDeclaration);
      const view = render(<QunoDatePicker value={initialValue} initialMonth="2026-08-01" />);
      const stablePill = pill(stableEndpoint, position);
      fireEvent.animationEnd(stablePill);

      view.rerender(<QunoDatePicker value={nextValue} initialMonth="2026-08-01" />);
      const container = stablePill.closest('[data-slot="pills"]');
      const addedPill = pill(addedEndpoint, position);
      expect(stablePill).toHaveAttribute("data-item-presence", "visible");
      expect(addedPill).toHaveAttribute("data-item-presence", "entering");
      expect(container).toHaveAttribute("data-presence", "visible");
      expect(container?.querySelector('[data-slot="pill"]')).toBe(stablePill);

      fireEvent.animationEnd(addedPill);
      expect(addedPill).toHaveAttribute("data-item-presence", "visible");
    }
  );
});
