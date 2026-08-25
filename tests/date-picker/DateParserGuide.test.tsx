import { fireEvent, render, screen, within } from "@testing-library/react";
import { DateParserFieldGuide } from "#quno-demo/guide/date-parser/DateParserFieldGuide";

describe("date parser field guide", () => {
  it("owns the headless parsing chapters and a focused demo link", () => {
    render(<DateParserFieldGuide />);
    expect(screen.getByRole("heading", { name: "Dates, understood the way people write them." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All components" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Demo/ })).toHaveAttribute("href", "/demo/date-parser");
    const contents = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(contents).getAllByRole("link")).toHaveLength(8);
    expect(within(contents).getByRole("link", { name: /Resolve numeric order/ })).toHaveAttribute(
      "href",
      "#preferred-date-order"
    );
    expect(screen.getAllByText(/^Try it$/)).toHaveLength(8);
    expect(screen.getAllByText(/^Implementation/)).toHaveLength(8);
  });

  it("keeps parsing and tokenization interactive", () => {
    render(<DateParserFieldGuide />);
    const formats = document.querySelector<HTMLElement>('[data-story-topic="date-formats"]') as HTMLElement;
    fireEvent.click(within(formats).getByRole("button", { name: "2026-04-03" }));
    expect(within(formats).getByText(/"start": "2026-04-03"/)).toBeInTheDocument();

    const tokenization = document.querySelector<HTMLElement>('[data-story-topic="tokenization"]') as HTMLElement;
    fireEvent.change(within(tokenization).getByRole("textbox"), { target: { value: "next Monday" } });
    const tokens = tokenization.querySelector(".date-input-parser-example pre");
    expect(tokens).toHaveTextContent('"value": "next"');
    expect(tokens).toHaveTextContent('"value": "monday"');
  });
});
