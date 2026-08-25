import { fireEvent, render, screen, within } from "@testing-library/react";
import { DateInputFieldGuide } from "#quno-demo/guide/date-input/DateInputFieldGuide";

describe("date input field guide", () => {
  it("owns a dedicated guide, demo link, and task-oriented chapters", () => {
    render(<DateInputFieldGuide />);
    expect(
      screen.getByRole("heading", { name: "A date field that stays useful while people type." })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All components" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Demo/ })).toHaveAttribute("href", "/demo/date-input");
    const contents = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(contents).getAllByRole("link")).toHaveLength(8);
    for (const title of [
      "Keep one timezone-free value shape.",
      "Let the product own every committed change.",
      "Edit the part under the caret.",
      "Separate recognition from presentation.",
      "Use the same parsing contract everywhere.",
      "Let typing and direct manipulation share one value.",
      "Keep the field understandable to every input method.",
      "Ship Date Input independently."
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Date Parser field guide" })).toHaveAttribute("href", "/guide/date-parser");
    const production = document.querySelector<HTMLElement>('[data-story-topic="library-size"]') as HTMLElement;
    expect(within(production).queryByText(/^Implementation/)).not.toBeInTheDocument();
    expect(within(production).queryByText("Import Date Input")).not.toBeInTheDocument();
  });

  it("opens the calendar when the button-like input gains focus and closes outside", async () => {
    render(<DateInputFieldGuide />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="picker-composition"]');
    expect(topic).not.toBeNull();
    const control = topic?.querySelector<HTMLElement>(".story__type-to-edit-summary") as HTMLElement;
    expect(within(topic as HTMLElement).queryByRole("grid")).not.toBeInTheDocument();
    const input = within(topic as HTMLElement).getByRole("textbox", { name: "Choose a period" });
    expect(input).toHaveValue("21 May 2026 – 18 August 2026");
    expect(within(control).queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    fireEvent.focus(input);
    expect(within(topic as HTMLElement).getByRole("grid")).toBeInTheDocument();
    expect(within(control).getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(input).toHaveAttribute("data-recognition", "recognized");
    fireEvent.input(input, { target: { value: "90 days" } });
    expect(input).toHaveAttribute("data-recognition", "recognized");
    fireEvent.blur(input);
    expect(within(topic as HTMLElement).getByRole("textbox")).toBeInTheDocument();
    expect(within(control).queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(within(topic as HTMLElement).queryByRole("grid")).not.toBeInTheDocument();
  });

  it("focuses the only changed endpoint and falls back to the nearest off-screen date", async () => {
    render(<DateInputFieldGuide />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="picker-composition"]') as HTMLElement;
    const input = within(topic).getByRole("textbox") as HTMLInputElement;
    fireEvent.focus(input);
    input.setSelectionRange(1, 1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: May 2026");
    expect(topic.querySelector(".story__picker")).toHaveClass("story__picker--draft");
    fireEvent.input(input, { target: { value: "21 May 2026 – 18 December 2026" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: December 2026");
    const updatedInput = within(topic).getByRole("textbox") as HTMLInputElement;
    fireEvent.input(updatedInput, { target: { value: "18 December 2026 – 19 December 2026" } });
    fireEvent.keyDown(updatedInput, { key: "Enter" });
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: December 2026");
    fireEvent.input(updatedInput, { target: { value: "18 January 2026" } });
    fireEvent.keyDown(updatedInput, { key: "Enter" });
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: January 2026");
  });

  it("keeps the committed calendar intact for an unrecognized edit", () => {
    render(<DateInputFieldGuide />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="picker-composition"]') as HTMLElement;
    const input = within(topic).getByRole("textbox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: "1 January 1980 – 1 January 2020" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: January 2020");
    fireEvent.input(input, { target: { value: "1 January 198 – 1 January 2020" } });
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: January 2020");
  });

  it("keeps empty-state guidance and validation beneath the period control", async () => {
    render(<DateInputFieldGuide />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="picker-composition"]') as HTMLElement;
    const control = topic.querySelector<HTMLElement>(".story__type-to-edit-summary") as HTMLElement;
    const input = within(topic).getByRole("textbox") as HTMLInputElement;
    fireEvent.focus(input);
    const clear = within(control).getByRole("button", { name: "Clear" });
    fireEvent.mouseDown(clear);
    fireEvent.mouseUp(clear);
    fireEvent.click(clear);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(input).toHaveAttribute("placeholder", "Choose a period");
    fireEvent.input(input, { target: { value: "not a date" } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(within(topic).queryByRole("alert")).not.toBeInTheDocument();
  });
});
