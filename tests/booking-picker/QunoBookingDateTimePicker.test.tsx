import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  bookingPickerDateBounds,
  formatBookingDate,
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
  it.each([
    ["en-US", "Europe/Berlin", "2026-01-15T08:00:00Z", "9:00 AM (CET)"],
    ["de", "Europe/Berlin", "2026-07-15T07:00:00Z", "09:00 (CEST)"],
    ["en-US", "America/New_York", "2026-07-15T13:00:00Z", "9:00 AM (EDT)"],
    ["en-US", "Europe/Istanbul", "2026-07-15T13:00:00Z", "4:00 PM (+03)"],
    ["en-US", "Asia/Kathmandu", "2026-07-15T13:00:00Z", "6:45 PM (+0545)"]
  ])("formats %s booking times with a timezone label in %s", (locale, timeZone, timestamp, expected) => {
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[slot(timestamp)]}
        locale={locale}
        timeZone={timeZone}
        showTimeZone
      />
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/^Times shown in/)).not.toBeInTheDocument();
  });
  it("focuses the first selectable time only after an explicit day selection", async () => {
    const onSlotSelected = vi.fn();
    const diagnostic = { ...slot("2026-09-02T08:00:00Z"), selectable: false };
    const { container } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[slot("2026-09-01T09:00:00Z"), diagnostic, slot("2026-09-02T10:00:00Z")]}
        onSlotSelected={onSlotSelected}
        focusFirstTimeOnDateSelection
      />
    );
    expect(screen.getByRole("button", { name: "09:00–09:30" })).not.toHaveFocus();
    fireEvent.click(container.querySelector('[data-date="2026-09-02"]')!);
    await waitFor(() => expect(screen.getByRole("button", { name: "10:00–10:30" })).toHaveFocus());
    expect(onSlotSelected).not.toHaveBeenCalled();
  });

  it("formats the heading from the booking timezone's civil date", () => {
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[slot("2026-12-31T12:00:00Z")]}
        timeZone="Pacific/Kiritimati"
        labels={{ selectedDate: formatBookingDate }}
      />
    );
    expect(screen.getByRole("heading", { name: "Friday 1st January" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "02:00–02:30" })).toBeInTheDocument();
  });

  it("reveals one date-only confirmation after choosing a day and selects its slot on confirmation", () => {
    const diagnostic = { ...slot("2026-09-01T08:00:00.000Z"), selectable: false };
    const first = slot("2026-09-01T09:00:00.000Z");
    const later = slot("2026-09-01T11:00:00.000Z");
    const onSlotSelected = vi.fn();
    const { container } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        dateOnly
        slots={[diagnostic, first, later]}
        labels={{ dateOnlySlot: "Bestätigen" }}
        onSlotSelected={onSlotSelected}
      />
    );
    expect(onSlotSelected).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="booking-slot-group"]')).toBeNull();
    const day = container.querySelector('[data-slot="day"][data-date="2026-09-01"]')!;
    fireEvent.pointerDown(day);
    fireEvent.pointerUp(day);
    expect(onSlotSelected).not.toHaveBeenCalled();
    const options = container.querySelectorAll('[data-slot="available-slots"] button');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Bestätigen");
    fireEvent.click(screen.getByRole("button", { name: "Bestätigen" }));
    expect(onSlotSelected).toHaveBeenCalledExactlyOnceWith({ slot: first });
  });

  it("preselects the first bookable date after loading without selecting its slot", () => {
    const readOnly = { ...slot("2026-09-01T08:00:00Z"), selectable: false };
    const bookable = slot("2026-09-03T09:00:00Z");
    const onSlotSelected = vi.fn();
    const props = { ...baseProps, dateOnly: true, autoSelectDate: true, showTimeZone: true, onSlotSelected };
    const { rerender } = render(<QunoBookingDateTimePicker {...props} initialMonth="2026-09" slots={[]} loading />);
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    rerender(<QunoBookingDateTimePicker {...props} initialMonth="2026-09" slots={[]} />);
    expect(screen.getByText("No available times on this date.")).toBeInTheDocument();
    rerender(<QunoBookingDateTimePicker {...props} initialMonth="2026-09" slots={[readOnly, bookable]} />);
    expect(screen.queryByText(/^Times shown in/)).not.toBeInTheDocument();
    expect(screen.getByRole("gridcell", { selected: true })).toHaveAttribute("data-date", "2026-09-03");
    expect(onSlotSelected).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onSlotSelected).toHaveBeenCalledExactlyOnceWith({ slot: bookable });
  });

  it.each([false, true])(
    "moves to the first bookable month after the opening read settles (date-only: %s)",
    (dateOnly) => {
      const openingMonth = "2026-09";
      const onVisibleMonthChange = vi.fn();
      const onSlotSelected = vi.fn();
      const props = {
        ...baseProps,
        dateOnly,
        autoSelectDate: true,
        shouldSeekFirstAvailableDate: () => true,
        onVisibleMonthChange,
        onSlotSelected
      };
      const openingReadOnly = { ...slot("2026-09-02T08:00:00Z"), selectable: false };
      const readOnly = { ...slot("2026-10-02T08:00:00Z"), selectable: false };
      const bookable = slot("2026-12-03T09:00:00Z");
      const { rerender } = render(
        <QunoBookingDateTimePicker {...props} initialMonth={openingMonth} slots={[]} loading />
      );
      rerender(
        <QunoBookingDateTimePicker
          {...props}
          initialMonth={openingMonth}
          slots={[openingReadOnly, readOnly, bookable]}
        />
      );
      expect(screen.getByRole("gridcell", { selected: true })).toHaveAttribute("data-date", "2026-12-03");
      expect(screen.getByRole("button", { name: dateOnly ? "Confirm" : "09:00–09:30" })).toBeEnabled();
      expect(onVisibleMonthChange).toHaveBeenCalledExactlyOnceWith({ month: "2026-12" });
      expect(onSlotSelected).not.toHaveBeenCalled();
    }
  );

  it("leaves the visible month in place after the consumer ends the initial search", () => {
    const onVisibleMonthChange = vi.fn();
    const shouldSeekFirstAvailableDate = vi.fn().mockReturnValue(false);
    const props = { ...baseProps, onVisibleMonthChange, shouldSeekFirstAvailableDate };
    const { rerender } = render(<QunoBookingDateTimePicker {...props} initialMonth="2026-09" slots={[]} loading />);
    rerender(<QunoBookingDateTimePicker {...props} initialMonth="2026-09" slots={[slot("2026-12-03T09:00:00Z")]} />);
    expect(screen.getByRole("grid", { name: /September 2026/ })).toBeVisible();
    expect(onVisibleMonthChange).not.toHaveBeenCalled();
  });

  it("hands off a date-only draft on day click when the consumer supplies confirmation", () => {
    const first = slot("2026-09-01T09:00:00.000Z");
    const onSlotSelected = vi.fn();
    const { container } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        dateOnly
        selectSlotOnDayClick
        slots={[first]}
        onSlotSelected={onSlotSelected}
      />
    );
    expect(onSlotSelected).not.toHaveBeenCalled();
    const day = container.querySelector('[data-slot="day"][data-date="2026-09-01"]')!;
    fireEvent.pointerDown(day);
    fireEvent.pointerUp(day);
    expect(onSlotSelected).toHaveBeenCalledExactlyOnceWith({ slot: first });
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
  });

  it("keeps browsing separate from a controlled slot until its external value changes", () => {
    const first = { ...slot("2026-09-10T09:00:00Z"), participants: [{ sub: "doctor-a" }] };
    const second = { ...slot("2026-09-11T11:00:00Z"), participants: [{ sub: "doctor-b" }] };
    const slots = [first, second];
    const onSlotSelected = vi.fn();
    const { container, rerender } = render(
      <QunoBookingDateTimePicker {...baseProps} slots={slots} value={first} onSlotSelected={onSlotSelected} />
    );
    const day = container.querySelector('[data-slot="day"][data-date="2026-09-11"]')!;
    fireEvent.pointerDown(day);
    fireEvent.pointerUp(day);
    expect(screen.getByRole("button", { name: "11:00–11:30" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
    // A parent may rerender with an equivalent value object before committing the next slot.
    rerender(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[...slots]}
        value={{ ...first }}
        onSlotSelected={onSlotSelected}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "11:00–11:30" }));
    expect(onSlotSelected).toHaveBeenCalledWith({ slot: second });
    expect(onSlotSelected.mock.calls[0][0].slot).toBe(second);
    rerender(<QunoBookingDateTimePicker {...baseProps} slots={slots} value={second} onSlotSelected={onSlotSelected} />);
    expect(screen.getByRole("button", { name: "11:00–11:30" })).toHaveAttribute("aria-pressed", "true");
    rerender(<QunoBookingDateTimePicker {...baseProps} slots={slots} value={first} onSlotSelected={onSlotSelected} />);
    expect(screen.getByRole("button", { name: "09:00–09:30" })).toHaveAttribute("aria-pressed", "true");
  });

  it.each([false, true])("applies a controlled day when delayed availability arrives (loading=%s)", (loading) => {
    const first = slot("2026-09-01T10:00:00Z");
    const second = slot("2026-09-02T11:00:00Z");
    const props = { ...baseProps, onSlotSelected: vi.fn() };
    const { container, rerender } = render(<QunoBookingDateTimePicker {...props} slots={[first]} value={first} />);

    rerender(<QunoBookingDateTimePicker {...props} slots={[first]} value={second} loading={loading} />);
    expect(screen.queryByRole("button", { name: "11:00–11:30" })).not.toBeInTheDocument();
    rerender(<QunoBookingDateTimePicker {...props} slots={[first, second]} value={second} />);

    expect(container.querySelector('[data-date="2026-09-02"]')).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "11:00–11:30" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "10:00–10:30" })).not.toBeInTheDocument();
    expect(props.onSlotSelected).not.toHaveBeenCalled();
  });

  it.each([false, true])("synchronizes the calendar and time list across months (loading=%s)", (loading) => {
    const september = slot("2026-09-10T10:00:00Z");
    const october = slot("2026-10-12T11:00:00Z");
    const props = {
      ...baseProps,
      initialMonth: "2026-09" as const,
      queryPeriods: [{ start: "2026-09-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }],
      onSlotSelected: vi.fn(),
      onVisibleMonthChange: vi.fn()
    };
    const slots = loading ? [september] : [september, october];
    const { container, rerender } = render(<QunoBookingDateTimePicker {...props} slots={slots} value={september} />);

    rerender(<QunoBookingDateTimePicker {...props} slots={slots} value={october} loading={loading} />);
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "10:00–10:30" })).not.toBeInTheDocument();
    if (loading) {
      expect(screen.getByText("Loading available times…")).toBeInTheDocument();
    }
    rerender(<QunoBookingDateTimePicker {...props} slots={[september, october]} value={october} />);
    expect(container.querySelector('[data-date="2026-10-12"]')).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "11:00–11:30" })).toHaveAttribute("aria-pressed", "true");
    expect(props.onSlotSelected).not.toHaveBeenCalled();
    expect(props.onVisibleMonthChange).toHaveBeenCalledExactlyOnceWith({ month: "2026-10", source: "value" });

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10:00–10:30" })).toBeInTheDocument();
    expect(props.onVisibleMonthChange).toHaveBeenLastCalledWith({ month: "2026-09" });
    rerender(<QunoBookingDateTimePicker {...props} slots={[september, october]} value={{ ...october }} />);
    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(props.onVisibleMonthChange).toHaveBeenCalledTimes(2);
  });

  it.each(["new value", "clear", "uncontrolled", "browse day"] as const)(
    "discards a pending external day after %s",
    (action) => {
      const first = slot("2026-09-10T10:00:00Z");
      const pending = slot("2026-09-11T11:00:00Z");
      const other = slot("2026-09-12T12:00:00Z");
      const props = { ...baseProps, onSlotSelected: vi.fn() };
      const slots = [first, other];
      const { container, rerender } = render(<QunoBookingDateTimePicker {...props} slots={slots} value={first} />);
      rerender(<QunoBookingDateTimePicker {...props} slots={slots} value={pending} />);

      let value: QunoBookingDateTimeSlot | null | undefined = pending;
      if (action === "browse day") {
        const day = container.querySelector('[data-slot="day"][data-date="2026-09-12"]')!;
        fireEvent.pointerDown(day);
        fireEvent.pointerUp(day);
      } else {
        value = action === "new value" ? other : action === "clear" ? null : undefined;
        rerender(<QunoBookingDateTimePicker {...props} slots={slots} value={value} />);
      }
      rerender(<QunoBookingDateTimePicker {...props} slots={[...slots, pending]} value={value} />);

      const label = action === "new value" || action === "browse day" ? "12:00–12:30" : "10:00–10:30";
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-pressed",
        action === "new value" ? "true" : "false"
      );
      expect(screen.queryByRole("button", { name: "11:00–11:30" })).not.toBeInTheDocument();
      expect(props.onSlotSelected).not.toHaveBeenCalled();
    }
  );

  it("keeps a user navigation when the previous month's pending value arrives", () => {
    const september = slot("2026-09-10T10:00:00Z");
    const october = slot("2026-10-12T11:00:00Z");
    const props = {
      ...baseProps,
      queryPeriods: [{ start: "2026-09-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }],
      onSlotSelected: vi.fn(),
      onVisibleMonthChange: vi.fn()
    };
    const { rerender } = render(<QunoBookingDateTimePicker {...props} slots={[september]} value={september} />);
    rerender(<QunoBookingDateTimePicker {...props} slots={[september]} value={october} loading />);
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    rerender(<QunoBookingDateTimePicker {...props} slots={[september, october]} value={october} />);

    expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10:00–10:30" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "11:00–11:30" })).not.toBeInTheDocument();
    expect(props.onVisibleMonthChange.mock.calls).toEqual([
      [{ month: "2026-10", source: "value" }],
      [{ month: "2026-09" }]
    ]);
    expect(props.onSlotSelected).not.toHaveBeenCalled();
  });

  it("recomputes a pending date in the current booking timezone across a DST month boundary", () => {
    const first = slot("2026-10-20T10:00:00Z");
    const boundary = slot("2026-10-31T23:30:00Z");
    const props = { ...baseProps, onSlotSelected: vi.fn(), onVisibleMonthChange: vi.fn() };
    const { container, rerender } = render(<QunoBookingDateTimePicker {...props} slots={[first]} value={first} />);
    rerender(<QunoBookingDateTimePicker {...props} slots={[first]} value={boundary} />);
    rerender(
      <QunoBookingDateTimePicker {...props} slots={[first, boundary]} value={boundary} timeZone="Europe/Berlin" />
    );

    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(container.querySelector('[data-date="2026-11-01"]')).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "00:30–01:00" })).toHaveAttribute("aria-pressed", "true");
    expect(props.onVisibleMonthChange).toHaveBeenCalledExactlyOnceWith({ month: "2026-11", source: "value" });
    expect(props.onSlotSelected).not.toHaveBeenCalled();
  });

  it("keeps a pending external day across a precision change without dispatching a date-only draft", () => {
    const first = slot("2026-09-01T10:00:00Z");
    const second = slot("2026-09-02T11:00:00Z");
    const props = { ...baseProps, onSlotSelected: vi.fn(), selectSlotOnDayClick: true };
    const { container, rerender } = render(<QunoBookingDateTimePicker {...props} slots={[first]} value={first} />);
    rerender(<QunoBookingDateTimePicker {...props} slots={[first]} value={second} dateOnly />);
    rerender(<QunoBookingDateTimePicker {...props} slots={[first, second]} value={second} dateOnly />);

    expect(container.querySelector('[data-date="2026-09-02"]')).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    expect(props.onSlotSelected).not.toHaveBeenCalled();
  });

  it("selects newly loaded October times after clearing September without emitting a stale slot", async () => {
    const september = slot("2026-09-10T09:00:00Z");
    const october = { ...slot("2026-10-12T11:00:00Z"), participants: [{ sub: "october-doctor" }] };
    const onSlotSelected = vi.fn();
    const queryPeriods = [{ start: "2026-09-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }];
    const { rerender } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[september]}
        queryPeriods={queryPeriods}
        onSlotSelected={onSlotSelected}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
    expect(onSlotSelected).not.toHaveBeenCalled();
    rerender(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[september, october]}
        queryPeriods={queryPeriods}
        onSlotSelected={onSlotSelected}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "11:00–11:30" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "11:00–11:30" }));
    expect(onSlotSelected).toHaveBeenCalledWith({ slot: october });
    expect(onSlotSelected.mock.calls[0][0].slot).toBe(october);
  });

  it("determines the displayed month in the booking timezone", () => {
    const octoberLocal = slot("2026-09-30T23:00:00Z");
    render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={[octoberLocal]}
        timeZone="Europe/Berlin"
        initialMonth="2026-09"
        queryPeriods={[{ start: "2026-08-31T22:00:00Z", end: "2026-10-31T23:00:00Z" }]}
      />
    );
    expect(screen.queryByRole("button", { name: "01:00–01:30" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("button", { name: "01:00–01:30" })).toBeInTheDocument();
  });

  it("never displays a previous-month time when a complete slots array stays unchanged", () => {
    const slots = [slot("2026-09-10T09:00:00Z")];
    const onSlotSelected = vi.fn();
    const onVisibleMonthChange = vi.fn();
    const { container } = render(
      <QunoBookingDateTimePicker
        {...baseProps}
        slots={slots}
        queryPeriods={[{ start: "2026-09-01T00:00:00Z", end: "2026-11-01T00:00:00Z" }]}
        onSlotSelected={onSlotSelected}
        onVisibleMonthChange={onVisibleMonthChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="available-slots"] button')).toBeNull();
    expect(onSlotSelected).not.toHaveBeenCalled();
    expect(onVisibleMonthChange).toHaveBeenCalledWith({ month: "2026-10" });
  });

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
  it("clears the previous month while loading, then selects the new month's first day", async () => {
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
    expect(screen.queryByRole("button", { name: "09:00–09:30" })).not.toBeInTheDocument();
    expect(screen.getByText("Loading available times…")).toBeInTheDocument();
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
  it("omits timezone labels on slots when disabled", () => {
    render(
      <QunoBookingDateTimePicker {...baseProps} slots={[slot("2026-09-10T09:00:00.000Z")]} timeZone="Europe/Berlin" />
    );
    expect(screen.getByRole("button", { name: "11:00–11:30" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /CEST/ })).not.toBeInTheDocument();
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
  it.each([
    { timeZone: "Europe/Berlin", start: "2026-10-31T23:00:00Z", end: "2026-11-30T23:00:00Z" },
    { timeZone: "America/New_York", start: "2026-11-01T04:00:00Z", end: "2026-12-01T05:00:00Z" }
  ])("uses local midnight for $timeZone bounds and the first visible month", ({ timeZone, start, end }) => {
    const periods = [{ start, end }];
    expect(bookingPickerDateBounds({ periods, timeZone })).toEqual({ minDate: "2026-11-01", maxDate: "2026-11-30" });
    render(
      <QunoBookingDateTimePicker
        slots={[]}
        queryPeriods={periods}
        timeZone={timeZone}
        showTimeZone={false}
        onSlotSelected={() => {}}
      />
    );
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });
});
