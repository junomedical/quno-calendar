import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import type { DateTimeSelectionChange, MinuteCadence } from "@quno/calendar";
import { clickDay, day, slot } from "./datePickerTestUtils";

const value = { start: "2026-10-06", end: "2026-10-06" } as const;
const cadences: MinuteCadence[] = [1, 2, 3, 4, 5, 6, 10, 15, 20, 30];

describe("single-day time selection", () => {
  it("advances from a selected day, reopens its time, and ignores disabled or cancelled choices", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        initialMonth="2026-10-01"
        selectionMode="single"
        timeMode
        isDayDisabled={({ date }) => date === "2026-10-07"}
        onChange={onChange}
      />
    );
    clickDay("2026-10-07");
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    fireEvent.pointerDown(day(value.start));
    fireEvent.pointerCancel(day(value.start));
    expect(onChange).not.toHaveBeenCalled();
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    clickDay(value.start);
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    expect(slot("month-heading-button")).toHaveFocus();
    expect(document.querySelector('[data-slot="time-button"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "11:30" }));
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    expect(slot("selection-summary")).toHaveTextContent("6 Oct 2026 11:30");
    clickDay(value.start);
    expect(screen.getByRole("button", { name: "11:30" })).toHaveAttribute("aria-pressed", "true");
  });

  it("advances a keyboard-selected day with a fully controlled day and clock", () => {
    function Example() {
      const [selection, setSelection] = useState<DateTimeSelectionChange>({ value: null, time: null });
      return (
        <QunoDatePicker
          {...selection}
          initialMonth="2026-10-01"
          selectionMode="single"
          timeMode
          onChange={setSelection}
        />
      );
    }
    render(<Example />);
    fireEvent.click(day("2026-10-12"), { detail: 0 });
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    expect(slot("month-heading-button")).toHaveTextContent("12 October 2026");
    fireEvent.click(screen.getByRole("button", { name: "14:45" }));
    expect(slot("selection-summary")).toHaveTextContent("12 Oct 2026 14:45");
    expect(day("2026-10-12")).toHaveAttribute("data-selected", "true");
    expect(slot("month-heading-button")).toHaveFocus();
  });
  it("skips disabled days in both directions while retaining time navigation and the clock", () => {
    const onChange = vi.fn();
    const onVisibleMonthChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={{ start: "2026-10-30", end: "2026-10-30" }}
        defaultTime="10:17"
        selectionMode="single"
        timeMode
        limitDateFrom="2026-10-29"
        limitDateTo="2026-11-03"
        isDayDisabled={({ date }) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())}
        onChange={onChange}
        onVisibleMonthChange={onVisibleMonthChange}
      />
    );
    clickDay("2026-10-30");
    fireEvent.click(screen.getByRole("button", { name: "Next enabled day" }));
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-11-02", end: "2026-11-02" }, time: "10:17" });
    expect(slot("month-heading-button")).toHaveTextContent("2 November 2026");
    expect(onVisibleMonthChange).toHaveBeenLastCalledWith({ month: "2026-11-01" });
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    fireEvent.click(slot("previous-button"));
    expect(slot("month-heading-button")).toHaveTextContent("30 October 2026");
    fireEvent.click(slot("previous-button"));
    expect(slot("previous-button")).toBeDisabled();
    fireEvent.click(slot("next-button"));
    fireEvent.click(slot("next-button"));
    fireEvent.click(slot("next-button"));
    expect(slot("next-button")).toBeDisabled();
    expect(slot("month-heading-button")).toHaveTextContent("3 November 2026");
    fireEvent.click(slot("month-heading-button"));
    expect(slot("month-heading-button")).toHaveTextContent("November 2026");
    expect(slot("next-button")).toHaveAccessibleName("Next month");
    expect(slot("next-button")).toBeEnabled();
  });

  it("disables exhausted directions without publishing a disabled date", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={value}
        selectionMode="single"
        timeMode
        limitDateFrom="2026-10-01"
        limitDateTo="2026-10-10"
        isDayDisabled={({ date }) => date !== value.start}
        onChange={onChange}
      />
    );
    clickDay(value.start);
    onChange.mockClear();
    fireEvent.click(slot("previous-button"));
    fireEvent.click(slot("next-button"));
    expect(slot("previous-button")).toBeDisabled();
    expect(slot("next-button")).toBeDisabled();
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("finds enabled days beyond a long disabled stretch without blocking the view", async () => {
    const onChange = vi.fn();
    const isDayDisabled = ({ date }: { date: string }) => date !== value.start && date !== "2027-04-01";
    const { rerender } = render(
      <QunoDatePicker
        defaultValue={value}
        time="10:30"
        selectionMode="single"
        timeMode
        isDayDisabled={isDayDisabled}
        onChange={onChange}
      />
    );
    clickDay(value.start);
    fireEvent.click(slot("next-button"));
    expect(slot("next-button")).toBeDisabled();
    rerender(
      <QunoDatePicker
        defaultValue={value}
        time="11:30"
        selectionMode="single"
        timeMode
        isDayDisabled={isDayDisabled}
        onChange={onChange}
      />
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        value: { start: "2027-04-01", end: "2027-04-01" },
        time: "11:30"
      })
    );
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
  });

  it("cancels a pending day search when leaving time navigation", () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(
        <QunoDatePicker
          defaultValue={value}
          selectionMode="single"
          timeMode
          isDayDisabled={({ date }) => date !== value.start && date !== "2027-04-01"}
          onChange={onChange}
        />
      );
      clickDay(value.start);
      onChange.mockClear();
      fireEvent.click(slot("next-button"));
      fireEvent.click(slot("month-heading-button"));
      act(() => vi.runAllTimers());
      expect(onChange).not.toHaveBeenCalled();
      expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the selected full date only in time navigation and follows controlled dates", () => {
    const props = { selectionMode: "single" as const, timeMode: true, initialMonth: "2026-11-01" as const };
    const { rerender } = render(<QunoDatePicker {...props} value={value} />);
    expect(slot("month-heading-button")).toHaveTextContent("November 2026");
    fireEvent.click(slot("previous-button"));
    clickDay(value.start);
    expect(slot("month-heading-button")).toHaveTextContent("6 October 2026");
    expect(slot("month-heading-button")).toHaveAccessibleName("6 October 2026. Choose a date");
    expect(slot("month-heading-button")).not.toHaveAttribute("aria-expanded");
    const nextValue = { start: "2026-10-19", end: "2026-10-19" } as const;
    rerender(<QunoDatePicker {...props} value={nextValue} locale="de-DE" />);
    expect(slot("month-heading-button")).toHaveTextContent("19. Oktober 2026");
    rerender(
      <QunoDatePicker {...props} value={nextValue} formatters={{ timeDate: ({ date }) => `Time for ${date}` }} />
    );
    expect(slot("month-heading-button")).toHaveTextContent("Time for 2026-10-19");
    fireEvent.click(slot("month-heading-button"));
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    expect(document.querySelector('[data-slot="month-navigation"]')).toBeNull();
    expect(slot("month-heading-button")).toHaveFocus();
    expect(slot("month-heading-button")).toHaveTextContent("October 2026");
    expect(document.querySelector('[data-date="2026-10-19"]')).toHaveAttribute("data-selected", "true");
    fireEvent.click(slot("month-heading-button"));
    expect(slot("calendar")).toHaveAttribute("data-view", "month-navigation");
  });

  it.each(cadences)("offers cadence %i only inside enabled hours", (minuteCadence) => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker
        defaultValue={value}
        selectionMode="single"
        timeMode
        enabledHours={[17, 9, 9, -1, 24]}
        minuteCadence={minuteCadence}
        onChange={onChange}
      />
    );
    clickDay(value.start);
    onChange.mockClear();
    const groups = document.querySelectorAll('[data-slot="hour-group"]');
    expect([...groups].map((group) => group.getAttribute("data-hour"))).toEqual(["9", "17"]);
    const minutes = groups[0].querySelectorAll('[data-slot="minute-option"]');
    expect([...minutes].map((button) => button.textContent)).toEqual(
      Array.from({ length: Math.ceil(60 / minuteCadence) }, (_, index) =>
        String(index * minuteCadence).padStart(2, "0")
      )
    );
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(minutes[1]);
    expect(onChange).toHaveBeenLastCalledWith({ value, time: `09:${String(minuteCadence).padStart(2, "0")}` });
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    expect(slot("month-heading-button")).toHaveFocus();
  });

  it("returns via the title or Escape, mutually excluding month navigation", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker defaultValue={value} selectionMode="single" timeMode defaultTime="10:30" onChange={onChange} />
    );
    clickDay(value.start);
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    fireEvent.click(slot("month-heading-button"));
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    fireEvent.click(slot("month-heading-button"));
    expect(slot("calendar")).toHaveAttribute("data-view", "month-navigation");
    fireEvent.click(slot("month-heading-button"));
    clickDay(value.start);
    onChange.mockClear();
    expect(document.querySelector('[data-slot="month-navigation"]')).toBeNull();
    fireEvent.keyDown(screen.getByRole("button", { name: "10:30", pressed: true }), { key: "Escape" });
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves a clock while choosing another day and clears both", () => {
    const onChange = vi.fn();
    render(
      <QunoDatePicker defaultValue={value} selectionMode="single" timeMode defaultTime="10:30" onChange={onChange} />
    );
    clickDay("2026-10-12");
    expect(slot("calendar")).toHaveAttribute("data-view", "time");
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-10-12", end: "2026-10-12" }, time: "10:30" });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith({ value: null, time: null });
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
    expect(document.querySelector('[data-slot="time-button"]')).toBeNull();
  });

  it("renders controlled clocks without rewriting them when settings change", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <QunoDatePicker value={value} time="10:17" selectionMode="single" timeMode onChange={onChange} />
    );
    clickDay(value.start);
    fireEvent.click(screen.getByRole("button", { name: "11:30" }));
    expect(slot("selection-summary")).toHaveTextContent("10:17");
    rerender(
      <QunoDatePicker
        value={value}
        time="11:30"
        selectionMode="single"
        timeMode
        enabledHours={[]}
        onChange={onChange}
      />
    );
    clickDay(value.start);
    expect(screen.getAllByRole("button", { name: /^\d{2}:\d{2}$/ })).toHaveLength(96);
    fireEvent.click(screen.getByRole("button", { name: "23:45" }));
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "23:45" });
    expect(onChange).toHaveBeenCalledTimes(4);
    rerender(<QunoDatePicker value={value} time="11:30" selectionMode="single" timeMode isDayDisabled={() => true} />);
    expect(document.querySelector('[data-slot="time-button"]')).toBeNull();
    expect(slot("calendar")).toHaveAttribute("data-view", "dates");
  });

  it("keeps default and range selection date-only", () => {
    const { rerender } = render(<QunoDatePicker selectionMode="single" />);
    expect(document.querySelector('[data-slot="time-button"]')).toBeNull();
    rerender(<QunoDatePicker selectionMode="range" timeMode />);
    expect(document.querySelector('[data-slot="time-button"]')).toBeNull();
  });
});
