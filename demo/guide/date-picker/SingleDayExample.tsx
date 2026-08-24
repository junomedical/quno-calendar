import { QunoDatePicker, type DateRange } from "@quno/calendar/date-picker";
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
    <div className="story__single-day">
      <QunoDateInput
        value={value}
        onChange={setValue}
        expectedRange={expectedRange}
        referenceDate="2026-08-19"
        selectionMode="single"
        aria-label="Choose one day"
      />
      <QunoDatePicker
        value={value}
        onChange={setValue}
        initialMonth="2026-08-01"
        selectionMode="single"
        labels={{ selectedPeriod: "Selected day", hint: "Choose one day." }}
      />
    </div>
  );
};
