import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import type { JSX } from "react";
import { useState } from "react";

export const SingleDayExample = (): JSX.Element => {
  const [padDayNumbers, setPadDayNumbers] = useState(false);
  const [value, setValue] = useState<DateRange | null>({
    start: "2026-08-19",
    end: "2026-08-19"
  });

  return (
    <div className="story__single-day">
      <label>
        <input type="checkbox" checked={padDayNumbers} onChange={(event) => setPadDayNumbers(event.target.checked)} />
        Show leading zeros (01–09)
      </label>
      <QunoDatePicker
        padDayNumbers={padDayNumbers}
        value={value}
        onChange={({ value }) => setValue(value)}
        initialMonth="2026-08-01"
        selectionMode="single"
        labels={{ selectedPeriod: "Selected day", hint: "Choose one day." }}
      />
    </div>
  );
};
