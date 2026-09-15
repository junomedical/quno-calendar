import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QunoAvailabilitySourcePanel, QunoBookingChoiceGroup } from "@quno/calendar/booking-picker";

const labels = {
  label: "Availability source (diagnostic)",
  cronofy: "Cronofy",
  quno: "API",
  compare: "Compare",
  matching: ({ count }: { count: number }) => `${count} matching`,
  qunoOnly: ({ count }: { count: number }) => `${count} API only`,
  cronofyOnly: ({ count }: { count: number }) => `${count} Cronofy only`,
  bootstrapIn: ({ milliseconds }: { milliseconds: number }) => `bootstrap in ${milliseconds} ms`,
  availabilityIn: ({ milliseconds }: { milliseconds: number }) => `availability in ${milliseconds} ms`
};

describe("booking diagnostics", () => {
  it("selects modes and reports each source's independent latency", () => {
    const onSelect = vi.fn();
    render(
      <QunoAvailabilitySourcePanel
        mode="compare"
        loading={false}
        counts={{ matching: 4, qunoOnly: 2, cronofyOnly: 1 }}
        timings={{
          cronofy: { bootstrap: 418, availability: 73 },
          quno: { bootstrap: 512, availability: 81 }
        }}
        labels={labels}
        onSelect={onSelect}
      />
    );

    expect(document.querySelector('[data-timing="cronofy"]')).toHaveTextContent(
      "Cronofy · bootstrap in 418 ms · availability in 73 ms"
    );
    expect(document.querySelector('[data-timing="quno"]')).toHaveTextContent(
      "API · bootstrap in 512 ms · availability in 81 ms"
    );
    expect(screen.getByText("4 matching")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "API" }));
    expect(onSelect).toHaveBeenCalledWith({ mode: "quno" });
  });

  it("shows ongoing availability without inventing a bootstrap measurement", () => {
    render(
      <QunoAvailabilitySourcePanel
        mode="quno"
        loading={false}
        counts={null}
        timings={{ quno: { availability: 64 } }}
        labels={labels}
        onSelect={vi.fn()}
      />
    );

    expect(document.querySelector('[data-timing="quno"]')).toHaveTextContent("API · availability in 64 ms");
    expect(screen.queryByText(/bootstrap in/)).not.toBeInTheDocument();
  });

  it("owns the shared responsive and stacked choice layouts", () => {
    const { rerender } = render(
      <QunoBookingChoiceGroup>
        <button type="button">09:00</button>
      </QunoBookingChoiceGroup>
    );
    expect(screen.getByText("09:00").parentElement).toHaveAttribute("data-layout", "responsive");

    rerender(
      <QunoBookingChoiceGroup layout="stack">
        <button type="button">Doctor</button>
      </QunoBookingChoiceGroup>
    );
    expect(screen.getByText("Doctor").parentElement).toHaveAttribute("data-layout", "stack");
  });
});
