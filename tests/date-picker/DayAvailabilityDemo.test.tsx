import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayHandlerExample } from "#quno-demo/guide/date-picker/CustomizationExamples";

const date = (value: string): HTMLButtonElement => {
  const element = document.querySelector<HTMLButtonElement>(`[data-date="${value}"]`);
  if (!element) throw new Error(`Missing date ${value}`);
  return element;
};

afterEach(() => vi.useRealTimers());

describe("delayed datepicker day availability", () => {
  it("fails closed while loading and enables only successful day checks", async () => {
    vi.useFakeTimers();
    render(<DayHandlerExample />);

    expect(date("2026-08-10")).toBeDisabled();
    expect(date("2026-08-10")).toHaveClass("story__day--loading");
    expect(screen.getByText(/Checking 42 dates/)).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(900));

    expect(screen.getByText("Availability loaded")).toBeInTheDocument();
    expect(date("2026-08-10")).toBeEnabled();
    expect(date("2026-08-12")).toBeDisabled();
    expect(date("2026-08-24")).toBeDisabled();
    expect(date("2026-08-24")).toHaveClass("story__day--error");

    fireEvent.pointerDown(date("2026-08-10"));
    fireEvent.pointerUp(date("2026-08-10"));
    expect(date("2026-08-10")).toHaveAttribute("data-selected", "true");

    fireEvent.pointerDown(date("2026-08-12"));
    fireEvent.pointerUp(date("2026-08-12"));
    expect(date("2026-08-12")).not.toHaveAttribute("data-range-end");
  });
});
