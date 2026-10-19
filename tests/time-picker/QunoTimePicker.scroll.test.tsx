import { fireEvent, render, screen } from "@testing-library/react";
import { QunoTimePicker } from "@quno/calendar/timepicker";

it("preserves an uncontrolled visible selection and ignores equivalent hour-array rerenders", () => {
  const { container, rerender } = render(<QunoTimePicker defaultValue="09:00" enabledHours={[9, 10, 11]} />);
  const panel = container.querySelector<HTMLElement>('[data-slot="time-navigation"]')!;
  const group = container.querySelector<HTMLElement>('[data-hour="10"]')!;
  Object.defineProperty(group, "offsetTop", { value: 90 });
  Object.defineProperty(panel, "clientHeight", { value: 300 });
  panel.scrollTop = 35;
  const button = screen.getByRole("button", { name: "10:45" });
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(panel.scrollTop).toBe(35);
  panel.scrollTop = 150;
  rerender(<QunoTimePicker defaultValue="09:00" enabledHours={[9, 10, 11]} />);
  expect(panel.scrollTop).toBe(150);
});
