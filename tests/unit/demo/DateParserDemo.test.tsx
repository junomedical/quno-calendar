import { fireEvent, render, screen } from "@testing-library/react";
import { DateParserDemo } from "#quno-demo/demos/DateParserDemo";

describe("date parser demo", () => {
  it("recognizes English and German samples together by default", () => {
    render(<DateParserDemo />);

    expect(screen.getByRole("combobox", { name: "Languages" })).toHaveValue("en-de");
    fireEvent.click(screen.getByRole("button", { name: "12 June 2026 – next Monday" }));
    expect(screen.getByText(/"end": "2026-08-31"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "12 Juni 2026" }));
    expect(screen.getByText(/"start": "2026-06-12"/)).toBeInTheDocument();
  });

  it("enables times for both resolved output and diagnostic tokens", () => {
    render(<DateParserDemo />);
    fireEvent.click(screen.getByRole("button", { name: "tomorrow 10:30PM" }));
    expect(screen.getByText(/"status": "invalid"/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Clock times" }), { target: { value: "true" } });
    expect(screen.getByText(/"times":/)).toHaveTextContent('"start": "22:30"');
    expect(screen.getByText(/"type": "time"/)).toHaveTextContent('"raw": "10:30PM"');
  });
});
