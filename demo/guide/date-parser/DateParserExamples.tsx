import { parseDateInput, tokenizeDateInput, type DateInputDateOrder } from "@quno/calendar/date-parser";
import { useState } from "react";

const expectedRange = { start: "2025-08-25", end: "2027-08-25" } as const;

export function PreferredOrderParserExample() {
  const [order, setOrder] = useState<Extract<DateInputDateOrder, "dmy" | "mdy">>("dmy");
  const result = parseDateInput({ text: "3/4/2026", ...{ expectedRange, preferredDateOrder: order } });
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
        <code>{JSON.stringify(tokenizeDateInput({ text }), null, 2)}</code>
      </pre>
    </div>
  );
}

const timeSamples = [
  "10:00",
  "10AM",
  "10:30PM",
  "13",
  "23",
  "12:59",
  "tomorrow 13",
  "6 oct 2pm",
  "tomorrow 23:00–01:00"
];

export function TimeParserExample() {
  const [text, setText] = useState("tomorrow 10:30PM");
  const [recognizeTime, setRecognizeTime] = useState(true);
  const result = parseDateInput({ text, expectedRange, referenceDate: "2026-08-25", recognizeTime });
  return (
    <div className="date-input-parser-example">
      <label htmlFor="time-parser-mode">Clock times</label>
      <select
        id="time-parser-mode"
        value={String(recognizeTime)}
        onChange={(event) => setRecognizeTime(event.target.value === "true")}
      >
        <option value="true">Recognize times</option>
        <option value="false">Date only</option>
      </select>
      <div className="date-input-guide__samples" aria-label="Date and time examples">
        {timeSamples.map((sample) => (
          <button key={sample} type="button" onClick={() => setText(sample)}>
            {sample}
          </button>
        ))}
      </div>
      <label htmlFor="time-parser-input">Date and time to parse</label>
      <input id="time-parser-input" value={text} onChange={(event) => setText(event.target.value)} />
      <pre aria-live="polite">
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </div>
  );
}
