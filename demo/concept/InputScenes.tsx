import { useState } from "react";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { expectedRange, referenceDate, referenceLabel, initialMonth } from "./productValues";
import { getScenario } from "./scenarioCatalog";
export function InputScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("date-input", scenario).initial;
  const [value, setValue] = useState<DateRange | null>(initial.range);
  const [open, setOpen] = useState(false);
  return (
    <div className="concept-product-card" data-ready="true">
      <label htmlFor="concept-date">{initial.label}</label>
      <QunoDateInput
        id="concept-date"
        data-action="date-input"
        value={value}
        onChange={({ value: next }) => setValue(next)}
        expectedRange={expectedRange}
        referenceDate={referenceDate}
        locale="en-GB"
        selectionMode={initial.selectionMode}
        placeholder="Try next Friday"
      />
      <small>Reference date: {referenceLabel}</small>
      {initial.picker && (
        <>
          <button data-action="open-picker" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Close picker" : "Open picker"}
          </button>
          {open && (
            <QunoDatePicker initialMonth={initialMonth} value={value} onChange={({ value: next }) => setValue(next)} />
          )}
        </>
      )}
      <output className="concept-result" aria-live="polite">
        {value ? `${value.start} → ${value.end}` : "No date committed yet"}
      </output>
    </div>
  );
}
