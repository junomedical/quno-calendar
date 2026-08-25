import { fireEvent, render, screen, within } from "@testing-library/react";
import { DatePickerStory } from "#quno-demo/guide/date-picker/DatePickerStory";

describe("datepicker field guide", () => {
  it("renders the public integration chapters and live examples", () => {
    render(<DatePickerStory />);

    expect(
      screen.getByRole("heading", {
        name: "Date range selection you won't hate"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Paint, drag and correct a range without going to forced from-to sequence.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(14);
    const contents = screen.getByRole("navigation", {
      name: "Table of contents"
    });
    expect(within(contents).getAllByRole("link")).toHaveLength(11);
    expect(within(contents).queryByRole("link", { name: /Interactive demo/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All components" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Demo/ })).toHaveAttribute("href", "/demo/datepicker");
    expect(within(contents).getByRole("link", { name: /Customize meaningful dates/ })).toHaveAttribute(
      "href",
      "#day-handler"
    );
    expect(document.querySelector("#quick-jump")).toBeInTheDocument();
    expect(screen.getByText(/Months follow the seasons/)).toBeInTheDocument();
    expect(screen.getByText(/Sticky year labels keep the year readable during fast scrolling/)).toBeInTheDocument();
    expect(screen.queryByText("Why Quno")).not.toBeInTheDocument();
    expect(screen.queryByText("Quno approach")).not.toBeInTheDocument();
    expect(screen.getAllByText(/^Try it$/).length).toBeGreaterThan(5);
    expect(screen.getAllByText(/^Implementation/).length).toBeGreaterThan(5);
    expect(
      screen.getByRole("heading", {
        name: "Range editing, not two date inputs sharing a box"
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Forced order")).toBeInTheDocument();
    expect(screen.getByText("Mobile parity")).toBeInTheDocument();
    expect(screen.getByText("One active gesture")).toBeInTheDocument();
    expect(screen.getByText("paint · resize · move")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Mark the dates that matter to your product."
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/isNonWorking = weekday === 3/)).toBeInTheDocument();
    expect(screen.getByText(/isHoliday = date === '2026-08-27'/)).toBeInTheDocument();
    expect(screen.getByText("Holiday: 27 Aug")).toBeInTheDocument();
    expect(screen.getByText("Période sélectionnée")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Effacer" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Sélecteur de période: août 2026" })).toBeInTheDocument();
    expect(document.querySelector("#week-starts")).toBeInTheDocument();
    expect(within(contents).getByRole("link", { name: /Choose one day/ })).toHaveAttribute("href", "#single-day");
    expect(within(contents).getByRole("link", { name: /Combine with Date Input/ })).toHaveAttribute(
      "href",
      "#date-input-composition"
    );
    expect(within(contents).getByRole("link", { name: /Separate value, view, and gesture state/ })).toHaveAttribute(
      "href",
      "#idea"
    );
    expect(within(contents).queryByText("Understand and ship the model")).not.toBeInTheDocument();
    expect(document.querySelector('[data-story-topic="natural-input"]')).not.toBeInTheDocument();
    expect(screen.getByText("9.00 KiB gzip")).toBeInTheDocument();
    expect(screen.getByText("3.20 KiB gzip")).toBeInTheDocument();
    expect(screen.queryByText("Public API at a glance")).not.toBeInTheDocument();
    expect(screen.queryByText(/docs\/shared\/usage\.md/)).not.toBeInTheDocument();
  });

  it("keeps the quick jump example interactive", () => {
    render(<DatePickerStory />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="quick-jump"]');
    expect(topic).not.toBeNull();
    fireEvent.click(
      within(topic as HTMLElement).getByRole("button", {
        name: /Open month and year navigation/
      })
    );
    fireEvent.click(
      within(topic as HTMLElement).getByRole("button", {
        name: "January 2029"
      })
    );
    expect(within(topic as HTMLElement).getByRole("grid")).toHaveAccessibleName("Date range picker: January 2029");
  });

  it("switches the live example between different week starts", () => {
    render(<DatePickerStory />);
    const controls = screen.getByRole("group", { name: "First day of week" });
    const topic = document.querySelector<HTMLElement>('[data-story-topic="week-starts"]');
    const firstWeekday = () => topic?.querySelector<HTMLElement>('[data-slot="weekday"]')?.textContent;

    expect(firstWeekday()).toBe("Mon");
    fireEvent.click(within(controls).getByRole("button", { name: "Sunday" }));
    expect(firstWeekday()).toBe("Sun");
    fireEvent.click(within(controls).getByRole("button", { name: "Saturday" }));
    expect(firstWeekday()).toBe("Sat");
  });

  it("keeps single-day mode focused on Datepicker configuration", () => {
    render(<DatePickerStory />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="single-day"]');
    expect(topic).not.toBeNull();
    expect(within(topic as HTMLElement).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(topic as HTMLElement).getByText("Selected day")).toBeInTheDocument();
    expect(within(topic as HTMLElement).getByRole("button", { name: "Clear" })).toBeInTheDocument();

    const pickedDay = topic?.querySelector<HTMLElement>('[data-date="2026-08-18"]');
    expect(pickedDay).not.toBeNull();
    fireEvent.pointerDown(pickedDay as HTMLElement);
    fireEvent.pointerUp(pickedDay as HTMLElement);
    expect(pickedDay).toHaveAttribute("data-selected", "true");
  });

  it("opens the range picker only from its Date Input selection surface", () => {
    render(<DatePickerStory />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="date-input-composition"]') as HTMLElement;
    const editor = within(topic).getByRole("textbox", { name: "Choose a period" });

    expect(within(topic).queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.focus(editor);
    expect(within(topic).getByRole("grid")).toBeInTheDocument();
    expect(topic.querySelector('[data-slot="selection-header"]')).not.toBeVisible();

    fireEvent.input(editor, { target: { value: "12 juni - 18 juni" } });
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(editor).toHaveValue("12 June 2026 – 18 June 2026");
    expect(topic.querySelector('[data-date="2026-06-12"]')).toHaveAttribute("data-range-start", "true");
    expect(topic.querySelector('[data-date="2026-06-15"]')).toHaveAttribute("data-selected", "true");
    expect(topic.querySelector('[data-date="2026-06-18"]')).toHaveAttribute("data-range-end", "true");
  });

  it("opens the range picker from the selected-period input", () => {
    render(<DatePickerStory />);
    const topic = document.querySelector<HTMLElement>("#difference") as HTMLElement;
    const input = within(topic).getByRole("textbox", { name: "Choose a period" });

    expect(within(topic).queryByRole("grid")).not.toBeInTheDocument();
    fireEvent.focus(input);
    expect(within(topic).getByRole("grid")).toHaveAccessibleName("Date range picker: August 2026");
  });

  it("keeps the theming story interactive", () => {
    render(<DatePickerStory />);
    const violet = screen.getByRole("button", { name: "violet theme" });
    fireEvent.click(violet);
    expect(violet).toHaveAttribute("aria-pressed", "true");

    for (const theme of ["acid", "candy"]) {
      const button = screen.getByRole("button", { name: `${theme} theme` });
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(document.querySelector(`[data-story-topic="theming"] .story__picker`)).toHaveClass(
        `story__theme--${theme}`
      );
    }

    const topic = document.querySelector<HTMLElement>('[data-story-topic="theming"]');
    const day = topic?.querySelector<HTMLElement>('[data-date="2026-08-15"]');
    expect(topic).not.toBeNull();
    expect(day).not.toBeNull();
    fireEvent.pointerDown(day as HTMLElement);
    fireEvent.pointerUp(day as HTMLElement);
    expect(day).toHaveAttribute("data-cycle-trigger", "true");
    expect(
      within(topic as HTMLElement)
        .getAllByRole("gridcell")
        .some((cell) => cell.hasAttribute("data-cycle-preview"))
    ).toBe(true);

    fireEvent.click(
      within(topic as HTMLElement).getByRole("button", {
        name: "Previous month"
      })
    );
    const endpointPills = topic?.querySelectorAll('[data-slot="pill"]');
    expect(endpointPills).toHaveLength(2);
    expect(endpointPills?.[0]).toHaveAttribute("data-endpoint", "start");
    expect(endpointPills?.[1]).toHaveAttribute("data-endpoint", "end");
  });
});

describe("datepicker field guide entry", () => {
  it("uses the combined package in its primary recipe", () => {
    render(<DatePickerStory />);
    expect(screen.getAllByText(/@quno\/calendar\/datepicker/).length).toBeGreaterThan(0);
  });
});
