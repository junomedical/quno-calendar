import type { DateRange, DateSelectionMode, WeekStart } from "@quno/calendar";
import { parseDateInput, type DateInputDateOrder, type DateInputParserLanguage } from "@quno/calendar/date-input";
import { useId, useState } from "react";

type DateInputParserExampleProps = {
  expectedRange?: DateRange;
  initialText?: string;
  label?: string;
  locale?: string;
  parserLanguages?: ReadonlyArray<DateInputParserLanguage>;
  preferredDateOrder?: DateInputDateOrder;
  samples?: ReadonlyArray<string>;
  selectionMode?: DateSelectionMode;
  weekStartsOn?: WeekStart;
};

const defaultExpectedRange: DateRange = { start: "2025-08-25", end: "2027-08-25" };

export function DateInputParserExample({
  expectedRange = defaultExpectedRange,
  initialText = "3/4/2026",
  label = "Phrase to parse",
  locale = "en-GB",
  parserLanguages,
  preferredDateOrder = "dmy",
  samples = [],
  selectionMode,
  weekStartsOn
}: DateInputParserExampleProps) {
  const inputId = useId();
  const [text, setText] = useState(initialText);
  const result = parseDateInput(text, {
    expectedRange,
    locale,
    parserLanguages,
    selectionMode,
    weekStartsOn,
    referenceDate: "2026-08-25",
    preferredDateOrder
  });

  return (
    <div className="date-input-parser-example">
      {samples.length ? (
        <div className="date-input-guide__samples" aria-label={`${label} examples`}>
          {samples.map((sample) => (
            <button type="button" key={sample} onClick={() => setText(sample)}>
              {sample}
            </button>
          ))}
        </div>
      ) : null}
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} value={text} onChange={(event) => setText(event.target.value)} />
      <pre aria-live="polite">
        <code>{JSON.stringify(result, null, 2)}</code>
      </pre>
    </div>
  );
}
