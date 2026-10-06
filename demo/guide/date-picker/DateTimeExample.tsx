import { useState } from "react";
import type { DateTimeSelectionChange, MinuteCadence } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import "./date-time.css";

const expectedRange = { start: "2025-01-01", end: "2027-12-31" } as const;
const businessHours = Array.from({ length: 9 }, (_, index) => index + 9);
const cadences: MinuteCadence[] = [1, 2, 3, 4, 5, 6, 10, 15, 20, 30];

export function DateTimeExample() {
  const [selection, setSelection] = useState<DateTimeSelectionChange>({
    value: { start: "2026-10-06", end: "2026-10-06" },
    time: "10:30"
  });
  const [minuteCadence, setCadence] = useState<MinuteCadence>(15);
  const [hourMode, setHourMode] = useState("business");
  const [forceCadence, setForceCadence] = useState(false);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [inputMonth, setInputMonth] = useState("2026-10");
  const enabledHours = hourMode === "all" ? undefined : hourMode === "empty" ? [] : businessHours;
  const options = {
    selectionMode: "single",
    timeMode: true,
    minuteCadence,
    enabledHours,
    value: selection.value,
    time: selection.time,
    onChange: setSelection
  } as const;
  return (
    <div className="date-time-example">
      <div className="date-time-example__settings">
        <label>
          Minute cadence
          <select
            aria-label="Minute cadence"
            value={minuteCadence}
            onChange={(event) => setCadence(Number(event.target.value) as MinuteCadence)}
          >
            {cadences.map((cadence) => (
              <option key={cadence} value={cadence}>
                {cadence} min
              </option>
            ))}
          </select>
        </label>
        <label>
          Enabled hours
          <select aria-label="Enabled hours" value={hourMode} onChange={(event) => setHourMode(event.target.value)}>
            <option value="business">09–17</option>
            <option value="all">00–23</option>
            <option value="empty">All (empty list)</option>
          </select>
        </label>
        <label className="date-time-example__restriction">
          <input type="checkbox" checked={forceCadence} onChange={(event) => setForceCadence(event.target.checked)} />
          Force cadence and hours for typing
        </label>
        <label className="date-time-example__restriction">
          <input type="checkbox" checked={weekdaysOnly} onChange={(event) => setWeekdaysOnly(event.target.checked)} />
          Skip weekends
        </label>
      </div>
      <QunoDateInput
        {...options}
        forceCadence={forceCadence}
        onChange={(next) => {
          setSelection(next);
          setInputMonth(next.value?.start.slice(0, 7) ?? "empty");
        }}
        expectedRange={expectedRange}
        referenceDate="2026-10-06"
        parserLanguages={["en", "de"]}
        aria-label="Date and time"
        placeholder="Try tomorrow 10:30AM"
      />
      <QunoDatePicker
        key={inputMonth}
        {...options}
        initialMonth={selection.value?.start ?? "2026-10-01"}
        labels={{ hint: "" }}
        limitDateFrom={expectedRange.start}
        limitDateTo={expectedRange.end}
        isDayDisabled={
          weekdaysOnly ? ({ date }) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay()) : undefined
        }
      />
      <p aria-live="polite" className="date-time-example__value">
        {selection.value
          ? `${selection.value.start}${selection.time ? ` at ${selection.time}` : " · Choose a time"}`
          : "Choose a date and time"}
      </p>
    </div>
  );
}

export const dateTimeSnippet = `import { useState } from "react";
import type { DateTimeSelectionChange } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import "@quno/calendar/date-input/styles.css";
import "@quno/calendar/datepicker/styles.css";

function DateTimeField() {
  const [selection, setSelection] = useState<DateTimeSelectionChange>({ value: null, time: null });
  const [inputMonth, setInputMonth] = useState("empty");
  const options = {
    selectionMode: "single" as const, timeMode: true,
    enabledHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], minuteCadence: 15 as const,
    value: selection.value, time: selection.time, onChange: setSelection
  };
  return <>
    <QunoDateInput {...options} forceCadence={false} aria-label="Date and time"
      onChange={next => { setSelection(next); setInputMonth(next.value?.start.slice(0, 7) ?? "empty"); }}
      expectedRange={{ start: "2025-01-01", end: "2027-12-31" }} />
    <QunoDatePicker key={inputMonth} {...options}
      initialMonth={selection.value?.start} />
  </>;
}`;
