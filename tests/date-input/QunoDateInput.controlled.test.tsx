import { fireEvent, render, screen } from "@testing-library/react";
import { QunoDateInput, type DateRange } from "@quno/calendar/date-input";
import { useState } from "react";

const expectedRange: DateRange = { start: "2025-01-01", end: "2027-12-31" };

describe("QunoDateInput controlled drafts", () => {
  it("keeps a single-date draft through an unrelated parent rerender", () => {
    const Example = () => {
      const [count, setCount] = useState(0);
      const [value, setValue] = useState<DateRange>({ start: "2026-07-04", end: "2026-07-04" });
      return (
        <>
          <QunoDateInput
            aria-label="Date"
            expectedRange={expectedRange}
            onChange={({ value: next }) => next && setValue(next)}
            selectionMode="single"
            value={value}
          />
          <button onClick={() => setCount((current) => current + 1)}>Render {count}</button>
        </>
      );
    };

    render(<Example />);
    const input = screen.getByRole("textbox", { name: "Date" });
    fireEvent.input(input, { target: { value: "8 July 2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Render 0" }));
    expect(input).toHaveValue("8 July 2026");
  });
});
