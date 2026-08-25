import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import type { JSX } from "react";
import { useState } from "react";

const expectedRange: DateRange = { start: "2025-08-19", end: "2026-08-19" };

export const SingleDayExample = (): JSX.Element => {
  const [value, setValue] = useState<DateRange | null>({
    start: "2026-08-19",
    end: "2026-08-19"
  });

  return (
    <div className="quno-date-picker story__single-day">
      <header className="quno-date-picker-selection-header story__single-day-header">
        <label className="story__single-day-field">
          <span className="quno-date-picker-eyebrow">Selected day</span>
          <QunoDateInput
            value={value}
            onChange={setValue}
            expectedRange={expectedRange}
            referenceDate="2026-08-19"
            selectionMode="single"
            aria-label="Selected day"
          />
        </label>
        <button className="quno-date-picker-clear" disabled={!value} onClick={() => setValue(null)} type="button">
          Clear
        </button>
      </header>
      <QunoDatePicker
        className="story__single-day-picker"
        value={value}
        onChange={setValue}
        initialMonth="2026-08-01"
        selectionMode="single"
        labels={{ selectedPeriod: "Selected day", hint: "Choose one day." }}
      />
    </div>
  );
};
