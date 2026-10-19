import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QunoDateInput } from "@quno/calendar/date-input";

it("keeps single-date dash typing native without offering range completion", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <QunoDateInput
      expectedRange={{ start: "2025-01-01", end: "2027-12-31" }}
      selectionMode="single"
      aria-label="Date"
      onChange={onChange}
    />
  );
  const input = screen.getByRole("textbox");
  await user.type(input, "19 Oct 2026 -");
  expect(input).toHaveValue("19 Oct 2026 -");
  await user.type(input, " 23 Oct 2026{Enter}");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(onChange).not.toHaveBeenCalled();
});

it("allows native typing after an automatically completed range dash", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <QunoDateInput
      expectedRange={{ start: "2025-01-01", end: "2027-12-31" }}
      selectionMode="range"
      aria-label="Dates"
      onChange={onChange}
    />
  );
  const input = screen.getByRole("textbox");
  await user.type(input, "19 Oct 2026 -");
  expect(input).toHaveValue("19 October 2026 – ");
  await user.type(input, "23 Oct 2026{Enter}");
  expect(input).toHaveValue("19 October 2026 – 23 October 2026");
  expect(input).not.toHaveAttribute("aria-invalid");
  expect(onChange).toHaveBeenCalledWith({ value: { start: "2026-10-19", end: "2026-10-23" } });
});
