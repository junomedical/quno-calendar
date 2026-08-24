import { fireEvent, render, screen, within } from "@testing-library/react";
import { DatePickerStory } from "../../demo/guide/date-picker/DatePickerStory";

describe("datepicker field guide", () => {
  it("renders the public integration chapters and live examples", () => {
    render(<DatePickerStory />);

    expect(
      screen.getByRole("heading", {
        name: "One range model. Every calendar interaction."
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(14);
    const contents = screen.getByRole("navigation", {
      name: "Explore the field guide"
    });
    expect(within(contents).getAllByRole("link")).toHaveLength(19);
    expect(within(contents).queryByRole("link", { name: /Interactive demo/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore the complete guide/ })).toHaveAttribute("href", "/guide");
    expect(within(contents).getByRole("link", { name: /Custom day styling/ })).toHaveAttribute("href", "#day-handler");
    expect(within(contents).getByRole("link", { name: /Jump across years/ })).toHaveAttribute("href", "#quick-jump");
    expect(screen.queryByText("Why Quno")).not.toBeInTheDocument();
    expect(screen.queryByText("Quno approach")).not.toBeInTheDocument();
    for (const howTo of [
      "Basic usage how-to",
      "Custom day attributes how-to",
      "Localization how-to",
      "Choose the first weekday how-to",
      "Theme with tokens how-to"
    ]) {
      expect(screen.getByRole("complementary", { name: howTo })).toBeInTheDocument();
    }
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
    expect(within(contents).getByRole("link", { name: /Different week starts/ })).toHaveAttribute(
      "href",
      "#week-starts"
    );
    expect(within(contents).getByRole("link", { name: /Single-day mode/ })).toHaveAttribute("href", "#single-day");
    const naturalInput = document.querySelector<HTMLElement>('[data-story-topic="natural-input"]');
    expect(naturalInput?.querySelectorAll(".story__try code")).toHaveLength(6);
    expect(screen.getByText("9.00 KiB")).toBeInTheDocument();
    expect(screen.getByText("6.95 KiB")).toBeInTheDocument();
    expect(screen.getByText(/docs\/usage\.md/)).toBeInTheDocument();
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

  it("shares controlled state between the natural input and calendar", () => {
    render(<DatePickerStory />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="natural-input"]');
    expect(topic).not.toBeNull();
    const input = within(topic as HTMLElement).getByRole("textbox") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: "12 juni" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("12 June 2026");
    fireEvent.input(input, { target: { value: "12/14" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("14 December 2025");
    const calendarDate = topic?.querySelector<HTMLElement>('[data-date="2025-12-20"]');
    fireEvent.pointerDown(calendarDate as HTMLElement);
    fireEvent.pointerUp(calendarDate as HTMLElement);
    expect(input).toHaveValue("14 December 2025 – 20 December 2025");
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

describe("combined guide entry", () => {
  it("uses the combined package in its primary recipe", () => {
    render(<DatePickerStory />);
    expect(screen.getAllByText(/@quno\/calendar\/date-picker/).length).toBeGreaterThan(0);
  });
});
