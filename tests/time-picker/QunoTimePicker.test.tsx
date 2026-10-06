import { fireEvent, render, screen } from "@testing-library/react";
import { QunoTimePicker, type MinuteCadence } from "@quno/calendar/timepicker";
import { describe, expect, it, vi } from "vitest";

const option = (time: string) => screen.getByRole("button", { name: time });

describe("standalone time picker", () => {
  it("selects and clears an uncontrolled clock without a date", () => {
    const onChange = vi.fn();
    render(<QunoTimePicker defaultValue="10:30" enabledHours={[10]} onChange={onChange} />);
    expect(option("10:30")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(option("10:45"));
    expect(option("10:45")).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenLastCalledWith({ value: "10:45" });
    fireEvent.click(screen.getByRole("button", { name: "Clear time" }));
    expect(option("10:45")).toHaveAttribute("aria-pressed", "false");
    expect(onChange).toHaveBeenLastCalledWith({ value: null });
    expect(screen.getByRole("button", { name: "Clear time" })).toBeDisabled();
  });

  it("keeps controlled state authoritative across choices and external changes", () => {
    const onChange = vi.fn();
    const { rerender, container } = render(<QunoTimePicker value="10:30" enabledHours={[10]} onChange={onChange} />);
    fireEvent.click(option("10:45"));
    expect(onChange).toHaveBeenLastCalledWith({ value: "10:45" });
    expect(option("10:30")).toHaveAttribute("aria-pressed", "true");
    rerender(<QunoTimePicker value="23:59" enabledHours={[10]} minuteCadence={30} onChange={onChange} />);
    expect(container.querySelector('[data-slot="selection-summary"]')).toHaveTextContent("23:59");
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    rerender(<QunoTimePicker value={null} onChange={onChange} />);
    expect(container.querySelector('[data-slot="selection-summary"]')).toHaveTextContent("Choose a time");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 10, 15, 20, 30] as MinuteCadence[])(
    "offers cadence %s from 00 through 59",
    (minuteCadence) => {
      const { container } = render(<QunoTimePicker enabledHours={[9]} minuteCadence={minuteCadence} />);
      const options = [...container.querySelectorAll('[data-slot="minute-option"]')];
      expect(options.map((button) => button.getAttribute("data-time"))).toEqual(
        Array.from(
          { length: Math.ceil(60 / minuteCadence) },
          (_, index) => `09:${String(index * minuteCadence).padStart(2, "0")}`
        )
      );
      expect(container.querySelector<HTMLElement>(".quno-time-picker-minute-options")?.style.gridTemplateColumns).toBe(
        `repeat(${{ 1: 5, 2: 5, 3: 5, 4: 5, 5: 6, 6: 5, 10: 6, 15: 4, 20: 3, 30: 2 }[minuteCadence]}, minmax(0, 1fr))`
      );
    }
  );

  it("orders valid enabled hours and defaults omitted or empty lists to all hours", () => {
    const { container, rerender } = render(<QunoTimePicker enabledHours={[23, 9, 9, -1, 24, 1.5, NaN]} />);
    expect(
      [...container.querySelectorAll('[data-slot="hour-group"]')].map((group) => group.getAttribute("data-hour"))
    ).toEqual(["9", "23"]);
    rerender(<QunoTimePicker enabledHours={[]} />);
    expect(container.querySelectorAll('[data-slot="hour-group"]')).toHaveLength(24);
    expect(option("00:00")).toBeEnabled();
    expect(option("23:45")).toBeEnabled();
    rerender(<QunoTimePicker />);
    expect(container.querySelectorAll('[data-slot="hour-group"]')).toHaveLength(24);
  });

  it("disables native selection and clear without changing the clock", () => {
    const onChange = vi.fn();
    render(<QunoTimePicker defaultValue="09:30" enabledHours={[9]} disabled onChange={onChange} />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    fireEvent.click(option("09:45"));
    fireEvent.click(screen.getByRole("button", { name: "Clear time" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(option("09:30")).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves uncontrolled off-slot values after settings change", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<QunoTimePicker defaultValue="09:17" onChange={onChange} />);
    rerender(<QunoTimePicker defaultValue="12:00" enabledHours={[]} minuteCadence={30} onChange={onChange} />);
    expect(container.querySelector('[data-slot="selection-summary"]')).toHaveTextContent("09:17");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies consumer labels, formatting, slots, and root attributes", () => {
    const { container } = render(
      <QunoTimePicker
        id="clock"
        aria-label="Appointment time"
        className="custom"
        defaultValue="09:15"
        enabledHours={[9]}
        locale="de-DE"
        labels={{ clear: "Reset", timeNavigation: "Slots" }}
        classNames={{ minuteOption: "minute" }}
        formatters={{ time: ({ time, locale }) => `${locale} ${time}` }}
      />
    );
    expect(container.querySelector("#clock")).toHaveClass("custom");
    expect(screen.getByRole("group", { name: "Slots" })).toBeInTheDocument();
    expect(option("de-DE 09:15")).toHaveClass("minute");
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });
});
