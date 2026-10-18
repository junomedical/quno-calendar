import { useState } from "react";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { getScenario } from "./scenarioCatalog";
import { initialMonth } from "./productValues";
export function PickerScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("datepicker", scenario).initial;
  const [value, setValue] = useState<DateRange | null>(initial.range);
  const [single, setSingle] = useState(initial.single);
  return (
    <div className="concept-product-card" data-ready="true">
      <label>
        <input type="checkbox" checked={single} onChange={(event) => setSingle(event.target.checked)} /> Single day
      </label>
      <QunoDatePicker
        value={value}
        onChange={({ value: next }) => setValue(next)}
        initialMonth={initialMonth}
        selectionMode={single ? "single" : "range"}
      />
      <output className="concept-result" aria-live="polite">
        {value
          ? `${value.start} → ${value.end} · ${1 + Math.round((Date.parse(value.end) - Date.parse(value.start)) / 86400000)} days`
          : "Drag across the dates to select a range"}
      </output>
    </div>
  );
}
