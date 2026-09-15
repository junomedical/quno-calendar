import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  bookingPickerDateBounds,
  QunoBookingDateTimePicker,
  type QunoBookingDateTimeSlot
} from "@quno/calendar/booking-picker";
const slot = (start: string, comparison?: string): QunoBookingDateTimeSlot => ({
  start,
  end: new Date(Date.parse(start) + 30 * 60000).toISOString(),
  availabilityComparison: comparison
});
const baseProps = {
  locale: "en-GB",
  timeZone: "UTC",
  showTimeZone: false,
  onSlotSelected: vi.fn()
};
describe("QunoBookingDateTimePicker", () => {
  it("opts scheduling calendars into two-digit day numbers", () => {
    const { container } = render(
      <QunoBookingDateTimePicker {...baseProps} slots={[slot("2026-09-01T09:00:00.000Z")]} />
    );
    expect(container.querySelector('[data-slot="day"][data-date="2026-09-01"]')).toHaveTextContent(/^01$/);
  });
  it("disables arrows at both ends of the known booking window", () => {
    const onVisibleMonthChange = vi.fn();
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[slot("2026-09-10T09:00:00.000Z")]}
        queryPeriods={[{ start: "2026-09-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }]}
        onVisibleMonthChange={onVisibleMonthChange}
      />
    );
    const previous = screen.getByRole("button", { name: "Previous month" });
    const next = screen.getByRole("button", { name: "Next month" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    fireEvent.click(previous);
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
    fireEvent.click(next);
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();
    onVisibleMonthChange.mockClear();
    fireEvent.click(next);
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
  });
  it("preserves consumer styling hooks without selecting an appearance theme", () => {
    const { container } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        className="brand"
        classNames={{ availableDay: "page-day" }}
        slots={[slot("2026-09-10T09:00:00.000Z")]}
      />
    );
    expect(container.querySelector(".quno-booking-date-time-picker")).toHaveClass("brand");
    expect(container.querySelector(".quno-booking-date-time-picker__available-day")).toHaveClass("page-day");
    expect(container.querySelector("[data-booking-theme]")).toBeNull();
  });
  it("owns the common date, time, deduplication, and comparison rendering", () => {
    const first = slot("2026-09-10T09:00:00.000Z", "match");
    const onSlotSelected = vi.fn();
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[first, { ...first }]}
        queryPeriods={[
          {
            start: "2026-09-01T00:00:00.000Z",
            end: "2026-10-01T00:00:00.000Z"
          }
        ]}
        onSlotSelected={onSlotSelected}
      />
    );
    const buttons = screen.getAllByRole("button", { name: "09:00–09:30" });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("data-comparison", "match");
    expect(screen.getByText(/10 Sept 2026/)).toBeInTheDocument();
    fireEvent.click(buttons[0]);
    expect(onSlotSelected).toHaveBeenCalledWith({ slot: first });
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
  });
  it("keeps the current choice while a new month loads, then selects the new month's first day", async () => {
    const september = slot("2026-09-10T09:00:00.000Z");
    const october = slot("2026-10-12T11:00:00.000Z");
    const props = {
      ...baseProps,
      slots: [september],
      queryPeriods: [{ start: "2026-09-01T00:00:00.000Z", end: "2026-11-01T00:00:00.000Z" }]
    };
    const { rerender } = render(<QunoBookingDateTimePicker {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    rerender(<QunoBookingDateTimePicker {...props} loading />);
    expect(screen.getByRole("button", { name: "09:00–09:30" })).toBeInTheDocument();
    expect(screen.queryByText("Loading available times…")).not.toBeInTheDocument();
    rerender(<QunoBookingDateTimePicker {...props} slots={[september, october]} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "11:00–11:30" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
  });
  it("renders a genuine empty state after a completed month response has no slots", async () => {
    const september = slot("2026-09-10T09:00:00.000Z");
    const props = {
      ...baseProps,
      slots: [september],
      queryPeriods: [{ start: "2026-09-01T00:00:00.000Z", end: "2026-11-01T00:00:00.000Z" }]
    };
    const { rerender } = render(<QunoBookingDateTimePicker {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    rerender(<QunoBookingDateTimePicker {...props} loading />);
    rerender(<QunoBookingDateTimePicker {...props} slots={[{ ...september }]} />);
    await waitFor(() => expect(screen.getByText("No available times on this date.")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
  });
  it("shows timezone information only when explicitly requested", () => {
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[slot("2026-09-10T09:00:00.000Z")]}
        timeZone="Europe/Berlin"
        showTimeZone
      />
    );
    expect(screen.getByText("Times shown in Europe/Berlin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CEST/ })).toBeInTheDocument();
  });
  it("does not submit a diagnostic-only interval", () => {
    const onSlotSelected = vi.fn();
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[{ ...slot("2026-09-10T09:00:00.000Z"), selectable: false }]}
        onSlotSelected={onSlotSelected}
      />
    );
    const choice = screen.getByRole("button", { name: "09:00–09:30" });
    expect(choice).toBeDisabled();
    fireEvent.click(choice);
    expect(onSlotSelected).not.toHaveBeenCalled();
  });
  it("converts exclusive query ends into exact inclusive date bounds", () => {
    expect(
      bookingPickerDateBounds({ periods: [{ start: "2026-09-15T00:00:00.000Z", end: "2026-11-01T00:00:00.000Z" }] })
    ).toEqual({
      minDate: "2026-09-15",
      maxDate: "2026-10-31"
    });
  });
});
