import { useState } from "react";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { getScenario } from "./scenarioCatalog";
import { initialMonth } from "./productValues";
import "./pickerHover.css";
export function PickerScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("datepicker", scenario).initial;
  const [value, setValue] = useState<DateRange | null>(initial.range);
  return (
    <div className="concept-product-card" data-ready="true">
      <QunoDatePicker
        value={value}
        onChange={({ value: next }) => setValue(next)}
        initialMonth={initialMonth}
        selectionMode={initial.single ? "single" : "range"}
        labels={{ hint: "" }}
      />
    </div>
  );
}
