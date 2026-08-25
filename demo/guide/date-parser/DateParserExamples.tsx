import { parseDateInput, tokenizeDateInput, type DateInputDateOrder } from "@quno/calendar/date-parser";
import { useState } from "react";

const expectedRange = { start: "2025-08-25", end: "2027-08-25" } as const;

export function PreferredOrderParserExample() {
  const [order, setOrder] = useState<Extract<DateInputDateOrder, "dmy" | "mdy">>("dmy");
  const result = parseDateInput("3/4/2026", { expectedRange, preferredDateOrder: order });
  return (
    <div className="date-input-guide__example">
      <div className="story__controls" aria-label="Preferred date order">
        {(["dmy", "mdy"] as const).map((option) => (
          <button aria-pressed={order === option} key={option} onClick={() => setOrder(option)} type="button">
            {option.toUpperCase()}
          </button>
        ))}
      </div>
      <code className="date-input-guide__ambiguous">3/4/2026</code>
      <output className="date-input-guide__value">
        {result.status === "success" ? result.value.start : "Unrecognized"}
      </output>
    </div>
  );
}

export function TokenParserExample() {
  const [text, setText] = useState("next 2 weeks");
  return (
    <div className="date-input-parser-example">
      <label htmlFor="token-parser-input">Text to tokenize</label>
      <input id="token-parser-input" value={text} onChange={(event) => setText(event.target.value)} />
      <pre aria-live="polite">
        <code>{JSON.stringify(tokenizeDateInput(text), null, 2)}</code>
      </pre>
    </div>
  );
}

const japaneseMarkers = ["年", "月", "日"] as const;

export function JapaneseParserExample() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("2026年8月25日");
  const result = parseDateInput(text, {
    expectedRange,
    lexicon: enabled ? { datePartMarkers: japaneseMarkers } : undefined
  });

  return (
    <div className="date-input-parser-example">
      <div className="story__controls" aria-label="Japanese parser setup">
        <button aria-pressed={enabled} onClick={() => setEnabled((current) => !current)} type="button">
          Date markers {enabled ? "on" : "off"}
        </button>
      </div>
      <code className="date-input-guide__ambiguous">lexicon.datePartMarkers = ["年", "月", "日"]</code>
      <label htmlFor="japanese-parser-input">Japanese date</label>
      <input id="japanese-parser-input" value={text} onChange={(event) => setText(event.target.value)} />
      <pre aria-live="polite">
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </div>
  );
}
