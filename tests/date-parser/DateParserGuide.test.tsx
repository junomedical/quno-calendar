import { fireEvent, render, screen, within } from "@testing-library/react";
import { DateParserFieldGuide } from "#quno-demo/guide/date-parser/DateParserFieldGuide";

describe("date parser field guide", () => {
  it("owns the headless parsing chapters and a focused demo link", () => {
    render(<DateParserFieldGuide />);
    expect(screen.getByRole("heading", { name: "Dates, understood the way people write them." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All components" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Demo/ })).toHaveAttribute("href", "/demo/date-parser");
    const contents = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(contents).getAllByRole("link")).toHaveLength(9);
    expect(within(contents).getByRole("link", { name: /Resolve numeric order/ })).toHaveAttribute(
      "href",
      "#preferred-date-order"
    );
    expect(screen.getAllByText(/^Try it$/)).toHaveLength(9);
    expect(screen.getAllByText(/^Implementation/)).toHaveLength(8);
    const production = document.querySelector<HTMLElement>('[data-story-topic="parser-production"]') as HTMLElement;
    expect(within(production).queryByText(/^Implementation/)).not.toBeInTheDocument();
    expect(within(production).queryByText("Import Date Parser")).not.toBeInTheDocument();
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

  it("demonstrates optional clocks and overnight dates through the public parser", () => {
    render(<DateParserFieldGuide />);
    const times = document.querySelector<HTMLElement>('[data-story-topic="time-parsing"]') as HTMLElement;
    fireEvent.click(within(times).getByRole("button", { name: "tomorrow 23:00–01:00" }));
    expect(within(times).getByText(/"end": "2026-08-27"/)).toHaveTextContent('"start": "23:00"');
    fireEvent.change(within(times).getByRole("combobox", { name: "Clock times" }), { target: { value: "false" } });
    expect(within(times).getByText(/"status": "invalid"/)).toBeInTheDocument();
  });

  it("shows distinct output for every language and product-vocabulary sample", () => {
    render(<DateParserFieldGuide />);
    const languages = document.querySelector<HTMLElement>('[data-story-topic="multiple-languages"]') as HTMLElement;
    const output = languages.querySelector(".date-input-parser-example pre") as HTMLElement;
    const samples = [
      ["12 June 2026", '"start": "2026-06-12"'],
      ["14 Juli 2026", '"start": "2026-07-14"'],
      ["tomorrow", '"start": "2026-08-26"'],
      ["gestern", '"start": "2026-08-24"'],
      ["prior week", '"start": "2026-08-17"']
    ] as const;

    for (const [sample, expectedStart] of samples) {
      fireEvent.click(within(languages).getByRole("button", { name: sample }));
      expect(output).toHaveTextContent(expectedStart);
    }
    expect(output).toHaveTextContent('"end": "2026-08-23"');
  });
});
