import { useState } from "react";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import type { InitialByProduct } from "./scenarioTypes";
import "./timeCalendarScene.css";
export function TimeCalendarScene({ initial }: { initial: InitialByProduct["timepicker"] }) {
  const [value, setValue] = useState<DateRange | null>({ start: initial.date!, end: initial.date! });
  const [time, setTime] = useState(initial.value);
  return (
    <div className="concept-product-card concept-time-calendar" data-ready="true">
      <QunoDatePicker
        selectionMode="single"
        timeMode
        initialMonth={initial.date}
        value={value}
        time={time}
        minuteCadence={initial.cadence}
        enabledHours={initial.businessHours ? [9, 10, 11, 12, 13, 14, 15, 16, 17] : undefined}
        labels={{ hint: "" }}
        onChange={({ value, time }) => {
          setValue(value);
          setTime(time ?? null);
        }}
      />
    </div>
  );
}
