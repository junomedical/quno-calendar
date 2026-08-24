import { fireEvent, render, screen } from "@testing-library/react";
import { QunoDateInput, type DateRange } from "../../src/lib/date-input";
import { useState } from "react";

const props = {
  expectedRange: { start: "2025-08-19", end: "2026-08-19" } as DateRange,
  referenceDate: "2026-08-19" as const
};

describe("QunoDateInput", () => {
  it("commits once on Enter and formats the selected date", () => {
    const onChange = vi.fn();
    render(<QunoDateInput {...props} onChange={onChange} aria-label="Dates" />);
    const input = screen.getByRole("textbox", { name: "Dates" });
    fireEvent.input(input, { target: { value: "12/14" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ start: "2025-12-14", end: "2025-12-14" });
    expect(input).toHaveValue("14 December 2025");
  });

  it("commits a this or next calendar period", () => {
    const onChange = vi.fn();
    render(<QunoDateInput {...props} onChange={onChange} aria-label="Dates" />);
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "next month" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ start: "2026-09-01", end: "2026-09-30" });
    expect(input).toHaveValue("1 September 2026 – 30 September 2026");
  });

  it("limits recognition and committed values to one day in single mode", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        {...props}
        selectionMode="single"
        parserLanguages={["en", "de"]}
        onChange={onChange}
        aria-label="Date"
      />
    );
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "next month" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.input(input, { target: { value: "12 juni" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ start: "2026-06-12", end: "2026-06-12" });
    fireEvent.input(input, { target: { value: "12/14 –" } });
    expect(input).toHaveValue("12/14 –");
    expect(input).toHaveAttribute("data-recognition", "recognized");
    fireEvent.input(input, { target: { value: "12/14 – 15/12" } });
    expect(input).toHaveValue("12/14 – 15/12");
  });

  it("formats a recognized partial range without emitting a value", () => {
    const onChange = vi.fn();
    render(<QunoDateInput {...props} onChange={onChange} aria-label="Dates" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "12/14 -" } });
    expect(input).toHaveValue("14 December 2025 – ");
    expect(input.selectionStart).toBe(input.value.length);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not recreate a partial range delimiter while it is deleted", () => {
    render(<QunoDateInput {...props} aria-label="Dates" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "12/14 -" } });
    expect(input).toHaveValue("14 December 2025 – ");
    fireEvent.input(input, { target: { value: "14 December 2025 –" } });
    expect(input).toHaveValue("14 December 2025 –");
    fireEvent.input(input, { target: { value: "14 December 2025 " } });
    expect(input).toHaveValue("14 December 2025 ");
  });

  it("uses recognition state and aria-invalid without an error label", () => {
    const onChange = vi.fn();
    render(<QunoDateInput {...props} onChange={onChange} aria-label="Dates" />);
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "12/14" } });
    expect(input).toHaveAttribute("data-recognition", "recognized");
    fireEvent.input(input, { target: { value: "not a date" } });
    expect(input).toHaveAttribute("data-recognition", "unrecognized");
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.input(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("follows external controlled state and ignores IME composition", () => {
    const Example = () => {
      const [value, setValue] = useState<DateRange | null>({ start: "2026-08-01", end: "2026-08-02" });
      return (
        <>
          <QunoDateInput {...props} value={value} onChange={setValue} aria-label="Dates" />
          <button onClick={() => setValue({ start: "2026-08-03", end: "2026-08-03" })}>Calendar</button>
        </>
      );
    };
    render(<Example />);
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.input(input, { target: { value: "12/14" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("12/14");
    fireEvent.compositionEnd(input);
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(input).toHaveValue("3 August 2026");
  });

  it("spins recognized duration and date fields with ArrowUp and ArrowDown", () => {
    render(<QunoDateInput {...props} defaultValue={{ start: "2025-12-14", end: "2025-12-14" }} aria-label="Dates" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "90 days" } });
    input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("91 days");
    input.setSelectionRange(5, 5);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("91 weeks");
    fireEvent.input(input, { target: { value: "14 December 2025" } });
    input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("15 December 2025");
    input.setSelectionRange(input.value.indexOf("December") + 2, input.value.indexOf("December") + 2);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("15 January 2026");
    input.setSelectionRange(input.value.length - 2, input.value.length - 2);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("15 January 2025");
    fireEvent.input(input, { target: { value: "100 days" } });
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.selectionStart).toBe(2);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("100 days");
    expect(input.selectionStart).toBe(3);
    fireEvent.input(input, { target: { value: "21 September 2026" } });
    input.setSelectionRange(input.value.indexOf("September") + 8, input.value.indexOf("September") + 8);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("21 August 2026");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.selectionStart).toBe(input.value.indexOf("September") + 8);
  });

  it("spins the range endpoint containing the caret", () => {
    render(<QunoDateInput {...props} defaultValue={{ start: "2026-05-21", end: "2026-08-18" }} aria-label="Dates" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.setSelectionRange(input.value.lastIndexOf("18") + 1, input.value.lastIndexOf("18") + 1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("21 May 2026 – 19 August 2026");
    input.setSelectionRange(input.value.indexOf("May") + 1, input.value.indexOf("May") + 1);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("21 April 2026 – 19 August 2026");
  });

  it("follows a crossed endpoint as the rendered dates exchange places", () => {
    render(<QunoDateInput {...props} defaultValue={{ start: "1984-12-31", end: "1985-01-01" }} aria-label="Dates" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.setSelectionRange(input.value.lastIndexOf("1985") + 2, input.value.lastIndexOf("1985") + 2);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("1 January 1984 – 31 December 1984");
    expect(input.selectionStart).toBe(input.value.indexOf("1984") + 2);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("1 January 1983 – 31 December 1984");
  });

  it("keeps equal endpoints as a range while Arrow editing remains focused", () => {
    const onChange = vi.fn();
    render(
      <QunoDateInput
        {...props}
        defaultValue={{ start: "2025-01-09", end: "2025-01-10" }}
        onChange={onChange}
        aria-label="Dates"
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.setSelectionRange(0, 0);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("10 January 2025 – 10 January 2025");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("10 January 2025 – 11 January 2025");
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith({ start: "2025-01-10", end: "2025-01-11" });
  });
});
