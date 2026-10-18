import { useState } from "react";
import { parseDateInput } from "@quno/calendar/date-parser";
import { expectedRange, referenceDate, referenceLabel } from "./productValues";
import { getScenario } from "./scenarioCatalog";
export function ParserScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("date-parser", scenario).initial;
  const [text, setText] = useState(initial.text);
  const [order, setOrder] = useState<"dmy" | "mdy">(initial.order);
  const [clocks, setClocks] = useState(initial.clocks);
  const [copied, setCopied] = useState(false);
  const result = parseDateInput({
    text,
    expectedRange,
    referenceDate,
    preferredDateOrder: order,
    recognizeTime: clocks
  });
  return (
    <div className="concept-product-card" data-ready="true">
      <label htmlFor="concept-phrase">Enter a date phrase</label>
      <input id="concept-phrase" data-action="phrase" value={text} onChange={(event) => setText(event.target.value)} />
      <small>Reference date: {referenceLabel}</small>
      <fieldset className="concept-choice">
        <legend>Date order</legend>
        {(["dmy", "mdy"] as const).map((value) => (
          <button key={value} data-action={value} aria-pressed={order === value} onClick={() => setOrder(value)}>
            {value.toUpperCase()}
          </button>
        ))}
      </fieldset>
      <label>
        <input type="checkbox" checked={clocks} onChange={(event) => setClocks(event.target.checked)} /> Recognize clock
        times
      </label>
      <output className="concept-result" aria-live="polite">
        {"start" in result ? (
          <>
            <strong>
              Start · {result.start.date} {result.start.time}
            </strong>
            <strong>
              End · {result.end.date} {result.end.time}
            </strong>
          </>
        ) : result.status === "empty" ? (
          "Enter a phrase to see its dates"
        ) : (
          "Unrecognized date — try another phrase"
        )}
      </output>
      <details>
        <summary>Structured result</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(
              () => setCopied(true),
              () => setCopied(false)
            );
          }}
        >
          {copied ? "Copied" : "Copy result"}
        </button>
      </details>
    </div>
  );
}
