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
    expect(within(contents).getByRole("link", { name: /Adapt locale-specific syntax/ })).toHaveAttribute(
      "href",
      "#internationalization"
    );
    expect(screen.getAllByText(/^Try it$/)).toHaveLength(9);
    expect(screen.getAllByText(/^Implementation/)).toHaveLength(9);
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

  it("shows the complete Japanese marker setup and its parsing effect", () => {
    render(<DateParserFieldGuide />);
    const topic = document.querySelector<HTMLElement>('[data-story-topic="internationalization"]') as HTMLElement;
    const toggle = within(topic).getByRole("button", { name: "Date markers on" });
    const output = topic.querySelector(".date-input-parser-example pre") as HTMLElement;

    expect(within(topic).getByText('lexicon.datePartMarkers = ["年", "月", "日"]')).toBeInTheDocument();
    expect(within(topic).getByRole("textbox", { name: "Japanese date" })).toHaveValue("2026年8月25日");
    expect(output).toHaveTextContent('"start": "2026-08-25"');
    fireEvent.click(toggle);
    expect(output).toHaveTextContent('"status": "invalid"');
  });
});
