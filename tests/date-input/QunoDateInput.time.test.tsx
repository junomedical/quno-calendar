import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { QunoDateInput } from "@quno/calendar/date-input";
import type { DateTimeSelectionChange } from "@quno/calendar";

const expectedRange = { start: "2025-01-01", end: "2027-12-31" } as const;
const value = { start: "2026-10-06", end: "2026-10-06" } as const;
const input = () => screen.getByRole("textbox");
const enter = (text: string) => {
  fireEvent.input(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key: "Enter" });
};

describe("single-day date-time input", () => {
  it.each([undefined, []])("enables all hours with forced cadence and hours %s", (enabledHours) => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        selectionMode="single"
        timeMode
        forceCadence
        enabledHours={enabledHours}
        minuteCadence={15}
        defaultValue={value}
        defaultTime="23:45"
        onChange={onChange}
      />
    );
    const element = input() as HTMLInputElement;
    element.setSelectionRange(element.value.length, element.value.length);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(input()).toHaveValue("6 October 2026 00:00");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(element, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "00:00" });
    enter("6 October 2026 12:30");
    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "12:30" });
  });

  it("enforces and spins twenty-minute cadence when requested", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        selectionMode="single"
        timeMode
        forceCadence
        minuteCadence={20}
        enabledHours={[10, 11]}
        onChange={onChange}
      />
    );
    enter("6 October 2026 10:15");
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(onChange).not.toHaveBeenCalled();
    enter("6 October 2026 10:20");
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "10:20" });
    const element = input() as HTMLInputElement;
    element.setSelectionRange(element.value.length, element.value.length);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(input()).toHaveValue("6 October 2026 10:40");
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(input()).toHaveValue("6 October 2026 11:00");
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(element, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "11:00" });
  });

  it("commits an abbreviated date without a year and an AM/PM clock", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        referenceDate="2026-10-06"
        parserLanguages={["en", "de"]}
        selectionMode="single"
        timeMode
        onChange={onChange}
      />
    );
    enter("6 oct 2pm");
    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "14:00" });
    expect(input()).toHaveValue("6 October 2026 14:00");
  });

  it.each(["tomorrow 10:30AM", "morgen um 10:30", "7 October 2026 at 10:30"])("commits %s with its clock", (text) => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        referenceDate="2026-10-06"
        parserLanguages={["en", "de"]}
        selectionMode="single"
        timeMode
        onChange={onChange}
      />
    );
    enter(text);
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-10-07", end: "2026-10-07" }, time: "10:30" });
    expect(input()).toHaveValue("7 October 2026 10:30");
    fireEvent.blur(input());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("publishes time-only changes and synchronizes controlled external changes", () => {
    function Example() {
      const [selection, setSelection] = useState<DateTimeSelectionChange>({ value, time: "10:30" });
      return (
        <>
          <QunoDateInput
            {...selection}
            expectedRange={expectedRange}
            selectionMode="single"
            timeMode
            onChange={setSelection}
          />
          <button onClick={() => setSelection({ value, time: "15:00" })}>External time</button>
        </>
      );
    }
    render(<Example />);
    enter("6 October 2026 11AM");
    expect(input()).toHaveValue("6 October 2026 11:00");
    fireEvent.click(screen.getByRole("button", { name: "External time" }));
    expect(input()).toHaveValue("6 October 2026 15:00");
    enter("");
    expect(input()).toHaveValue("");
  });

  it.each(["tomorrow 08:30", "tomorrow 10:17", "tomorrow 10:00–11:00", "tomorrow 23:00–01:00", "tomorrow 25:00"])(
    "rejects disallowed or multiple clocks: %s",
    (text) => {
      const onChange = vi.fn();
      render(
        <QunoDateInput
          expectedRange={expectedRange}
          referenceDate="2026-10-06"
          selectionMode="single"
          timeMode
          forceCadence
          enabledHours={[9, 10, 11]}
          minuteCadence={15}
          onChange={onChange}
        />
      );
      enter(text);
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["tomorrow 08:17", [9, 10, 11], "08:17"],
    ["tomorrow 23:59", [], "23:59"]
  ])("accepts typed clocks outside picker settings by default: %s", (text, enabledHours, time) => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        referenceDate="2026-10-06"
        selectionMode="single"
        timeMode
        enabledHours={enabledHours as number[]}
        minuteCadence={30}
        onChange={onChange}
      />
    );
    enter(text as string);
    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-10-07", end: "2026-10-07" }, time });
  });

  it("allows free keyboard clock edits until cadence is forced", () => {
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        selectionMode="single"
        timeMode
        defaultValue={value}
        defaultTime="10:45"
        enabledHours={[]}
        minuteCadence={30}
      />
    );
    const element = input() as HTMLInputElement;
    element.setSelectionRange(element.value.length, element.value.length);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(element).toHaveValue("6 October 2026 10:46");
  });

  it("toggles typed enforcement without rewriting the committed time", () => {
    const onChange = vi.fn();
    const props = {
      expectedRange,
      selectionMode: "single" as const,
      timeMode: true,
      enabledHours: [],
      minuteCadence: 30 as const,
      onChange
    };
    const { rerender } = render(<QunoDateInput {...props} />);
    enter("6 October 2026 08:17");
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "08:17" });
    rerender(<QunoDateInput {...props} forceCadence />);
    expect(input()).toHaveValue("6 October 2026 08:17");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<QunoDateInput {...props} forceCadence={false} />);
    fireEvent.blur(input());
    expect(input()).not.toHaveAttribute("aria-invalid");
  });

  it("preserves clocks during date spins and spins the clock at its caret", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        selectionMode="single"
        timeMode
        defaultValue={value}
        defaultTime="10:30"
        minuteCadence={1}
        onChange={onChange}
      />
    );
    const element = input() as HTMLInputElement;
    element.setSelectionRange(0, 0);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(element).toHaveValue("7 October 2026 10:30");
    element.setSelectionRange(element.value.length, element.value.length);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(element).toHaveValue("7 October 2026 10:31");
    fireEvent.keyDown(element, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-10-07", end: "2026-10-07" }, time: "10:31" });
  });

  it("allows a date without time and retains date-only defaults", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <QunoDateInput expectedRange={expectedRange} selectionMode="single" timeMode onChange={onChange} />
    );
    enter("6 October 2026");
    expect(onChange).toHaveBeenLastCalledWith({ value, time: null });
    rerender(<QunoDateInput expectedRange={expectedRange} selectionMode="single" onChange={onChange} />);
    enter("7 October 2026 10:00");
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("spins by cadence and skips disabled hours without committing", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        expectedRange={expectedRange}
        selectionMode="single"
        timeMode
        defaultValue={value}
        defaultTime="10:45"
        minuteCadence={15}
        forceCadence
        enabledHours={[10, 13]}
        onChange={onChange}
      />
    );
    const element = input() as HTMLInputElement;
    element.setSelectionRange(element.value.length, element.value.length);
    fireEvent.keyDown(element, { key: "ArrowUp" });
    expect(element).toHaveValue("6 October 2026 13:00");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("defers recognition and commits while composing a clock", () => {
    const onChange = vi.fn();
    render(<QunoDateInput expectedRange={expectedRange} selectionMode="single" timeMode onChange={onChange} />);
    fireEvent.compositionStart(input());
    fireEvent.input(input(), { target: { value: "6 October 2026 10:30" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input()).not.toHaveAttribute("data-recognition");
    fireEvent.compositionEnd(input());
    fireEvent.blur(input());
    expect(onChange).toHaveBeenLastCalledWith({ value, time: "10:30" });
  });

  it("controls the clock independently of an uncontrolled day", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <QunoDateInput
        expectedRange={expectedRange}
        defaultValue={value}
        selectionMode="single"
        timeMode
        time="10:30"
        onChange={onChange}
      />
    );
    enter("7 October 2026 11:30");
    expect(onChange).toHaveBeenLastCalledWith({ value: { start: "2026-10-07", end: "2026-10-07" }, time: "11:30" });
    rerender(
      <QunoDateInput
        expectedRange={expectedRange}
        defaultValue={value}
        selectionMode="single"
        timeMode
        time="13:00"
        onChange={onChange}
      />
    );
    expect(input()).toHaveValue("7 October 2026 13:00");
  });
});
