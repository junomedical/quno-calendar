import type { DateRange, DateSelectionMode } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, type DateInputDateOrder } from "@quno/calendar/date-parser";
import { useState } from "react";

const expectedRange: DateRange = { start: "2024-01-01", end: "2028-12-31" };
const oneDay: DateRange = { start: "2026-08-25", end: "2026-08-25" };
const period: DateRange = { start: "2026-08-18", end: "2026-08-25" };

const Value = ({ value }: { value: DateRange | null }) => (
  <output className="date-input-guide__value">
    {value ? `${value.start}${value.start === value.end ? "" : ` → ${value.end}`}` : "No committed value"}
  </output>
);

export function DateInputModeExample() {
  const [mode, setMode] = useState<DateSelectionMode>("single");
  const [value, setValue] = useState<DateRange | null>(oneDay);
  const chooseMode = (next: DateSelectionMode) => {
    setMode(next);
    setValue(next === "single" ? oneDay : period);
  };
  return (
    <div className="date-input-guide__example">
      <div className="story__controls" aria-label="Selection mode">
        {(["single", "range"] as const).map((option) => (
          <button aria-pressed={mode === option} key={option} onClick={() => chooseMode(option)} type="button">
            {option}
          </button>
        ))}
      </div>
      <QunoDateInput
        key={mode}
        aria-label={`${mode} date input`}
        expectedRange={expectedRange}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        selectionMode={mode}
        value={value}
      />
      <Value value={value} />
    </div>
  );
}

export function KeyboardDateInputExample() {
  const [value, setValue] = useState<DateRange | null>(oneDay);
  return (
    <div className="date-input-guide__example">
      <QunoDateInput
        aria-label="Keyboard editable date"
        defaultValue={oneDay}
        expectedRange={expectedRange}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
      />
      <Value value={value} />
    </div>
  );
}

export function ControlledDateInputExample() {
  const [value, setValue] = useState<DateRange | null>(oneDay);
  return (
    <div className="date-input-guide__example">
      <QunoDateInput
        aria-label="Controlled date"
        expectedRange={expectedRange}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        value={value}
      />
      <button type="button" onClick={() => setValue(oneDay)}>
        Reset
      </button>
      <Value value={value} />
    </div>
  );
}

export function PreferredDateOrderExample() {
  const [order, setOrder] = useState<Extract<DateInputDateOrder, "dmy" | "mdy">>("dmy");
  const result = parseDateInput({
    text: "3/4/2026",
    ...{
      expectedRange,
      preferredDateOrder: order,
      referenceDate: "2026-08-25"
    }
  });
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
      <output className="date-input-guide__value" aria-live="polite">
        {result.status === "success" ? result.value.start : "Unrecognized"}
      </output>
    </div>
  );
}

export function RangeDateInputExample() {
  const [value, setValue] = useState<DateRange | null>(period);
  return (
    <div className="date-input-guide__example">
      <QunoDateInput
        aria-label="Travel period"
        expectedRange={expectedRange}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        value={value}
      />
      <Value value={value} />
    </div>
  );
}

export function LocalizedDateInputExample() {
  const [locale, setLocale] = useState<"en-GB" | "de-DE">("en-GB");
  const [value, setValue] = useState<DateRange | null>(oneDay);
  return (
    <div className="date-input-guide__example">
      <div className="story__controls" aria-label="Input language">
        <button aria-pressed={locale === "en-GB"} onClick={() => setLocale("en-GB")} type="button">
          English
        </button>
        <button aria-pressed={locale === "de-DE"} onClick={() => setLocale("de-DE")} type="button">
          Deutsch
        </button>
      </div>
      <QunoDateInput
        aria-label="Localized date"
        expectedRange={expectedRange}
        locale={locale}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        value={value}
      />
      <Value value={value} />
    </div>
  );
}

export function ParserConfiguredInputExample() {
  const [value, setValue] = useState<DateRange | null>(period);
  return (
    <div className="date-input-guide__example">
      <QunoDateInput
        aria-label="Sunday-first date range"
        expectedRange={expectedRange}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        value={value}
        weekStartsOn={0}
      />
      <Value value={value} />
    </div>
  );
}

export function AccessibleDateInputExample() {
  const [value, setValue] = useState<DateRange | null>(oneDay);
  return (
    <div className="date-input-guide__example">
      <label htmlFor="accessible-date-input">Appointment date</label>
      <QunoDateInput
        id="accessible-date-input"
        expectedRange={expectedRange}
        labels={{ placeholder: "Type a date" }}
        onChange={({ value }) => setValue(value)}
        referenceDate="2026-08-25"
        value={value}
      />
      <Value value={value} />
    </div>
  );
}
