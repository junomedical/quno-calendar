export const modeSnippet = `const [value, setValue] = useState<DateRange | null>(null);

<QunoDateInput
  value={value}
  onChange={({ value }) => setValue(value)}
  expectedRange={expectedRange}
  selectionMode="single" // or "range" (the default)
/>;`;

export const controlledSnippet = `const [value, setValue] = useState<DateRange | null>(initialValue);

<QunoDateInput
  value={value}
  onChange={({ value }) => setValue(value)}
  expectedRange={expectedRange}
/>;`;

export const formatsSnippet = `const result = parseDateInput({ text: text, ...({
  expectedRange,
  locale: "en-GB",
  preferredDateOrder: "dmy"
}) });

// 3/4/2026, 2026-04-03, 3 April 2026,
// and April 3, 2026 all resolve to the same IsoDate.`;

export const preferredOrderSnippet = `<QunoDateInput
  expectedRange={expectedRange}
  preferredDateOrder="dmy" // "mdy", "ymd", or "locale"
  locale="en-GB"
  onChange={({ value }) => setValue(value)}
/>

// 3/4/2026 → 3 April in DMY, 4 March in MDY.
// "locale" derives DMY or MDY from the configured locale.`;

export const relativeSnippet = `<QunoDateInput
  expectedRange={expectedRange}
  referenceDate="2026-08-25"
  weekStartsOn={0} // same 0–6 format as QunoDatePicker
  onChange={({ value }) => setValue(value)}
/>

// Try: yesterday, this week, previous week, last Monday,
// next month, 90 days, or 3 months ago.
// Calendar-week phrases now use Sunday–Saturday.`;

export const keyboardSnippet = `<QunoDateInput
  defaultValue={{ start: "2026-08-25", end: "2026-08-25" }}
  expectedRange={expectedRange}
  onChange={({ value }) => setValue(value)}
/>

// Enter commits. Blur commits. ArrowUp/ArrowDown edits
// the day, month, year, duration, or endpoint at the caret.`;

export const rangeSnippet = `<QunoDateInput
  value={period}
  onChange={({ value }) => setPeriod(value)}
  expectedRange={expectedRange}
  selectionMode="range"
/>

// A typed first endpoint plus "-" or "–" starts a range.`;

export const expectedPeriodSnippet = `const expectedRange = {
  start: "2025-08-25",
  end: "2027-08-25"
};

<QunoDateInput
  expectedRange={expectedRange}
  referenceDate="2026-08-25"
  onChange={({ value }) => setValue(value)}
/>

// Missing years and ambiguous dates are ranked inside this window.
// Explicit dates outside it still resolve; validate them separately.`;

export const localizationSnippet = `import { formatIsoDate, type DateRange } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";

const formatProductRange = ({ value, locale }: { value: DateRange; locale: string }) =>
  [value.start, value.end].map((date) => formatIsoDate({ value: date, locale })).join(" – ");

<QunoDateInput
  locale="de-DE"
  parserLanguages={["de", "en"]}
  preferredDateOrder="locale"
  labels={{ placeholder: "Zeitraum eingeben" }}
  formatters={{ range: formatProductRange }}
  lexicon={{ today: ["heute"] }}
  expectedRange={expectedRange}
/>;`;

export const parserConnectionSnippet = `<QunoDateInput
  expectedRange={expectedRange}
  referenceDate="2026-08-25"
  weekStartsOn={0}
  preferredDateOrder="dmy"
  parserLanguages={["en", "de"]}
  onChange={({ value }) => setValue(value)}
/>;

// Headless parsing options live at @quno/calendar/date-parser.`;

export const accessibilitySnippet = `<label htmlFor="appointment-date">Appointment date</label>
<QunoDateInput
  id="appointment-date"
  expectedRange={expectedRange}
  labels={{ placeholder: "Type a date" }}
  onChange={({ value }) => setValue(value)}
/>

// Invalid committed text sets aria-invalid; native events remain available.`;

export const multipleLanguagesSnippet = `<QunoDateInput
  expectedRange={expectedRange}
  locale="en-GB"
  parserLanguages={["en", "de"]}
  onChange={({ value }) => setValue(value)}
/>

// One field accepts both "12 June 2026" and "12 Juni 2026".
// locale still controls display; parserLanguages controls recognition.`;

export const compositionSnippet = `const [value, setValue] = useState<DateRange | null>(null);

<QunoDateInput
  value={value}
  onChange={({ value }) => setValue(value)}
  expectedRange={expectedRange}
/>
<QunoDatePicker
  value={value}
  onChange={({ value }) => setValue(value)}
/>

// Both components share the same timezone-free DateRange.`;
