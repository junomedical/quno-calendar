import { useState } from "react";
import { todayIso, addMonths } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker, type DateRange } from "@quno/calendar/datepicker";
import { getScenario } from "./scenarioCatalog";
import { useInputPicker } from "./useInputPicker";
export function InputScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("date-input", scenario).initial;
  const [value, setValue] = useState<DateRange | null>(initial.range);
  const picker = useInputPicker(initial.range);
  const [expectedRange] = useState(() => {
    const date = todayIso();
    return { start: addMonths({ date, amount: -12 }), end: addMonths({ date, amount: 12 }) };
  });
  return (
    <div
      className="concept-product-card"
      data-ready="true"
      ref={picker.root}
      onBlurCapture={picker.blur}
      onPointerDownCapture={picker.pointerDown}
    >
      <label htmlFor="concept-date">{initial.label}</label>
      <QunoDateInput
        id="concept-date"
        data-action="date-input"
        value={value}
        onChange={({ value: next }) => {
          picker.follow(value, next);
          setValue(next);
        }}
        onFocus={() => {
          if (initial.picker) picker.setOpen(true);
        }}
        aria-expanded={initial.picker ? picker.open : undefined}
        aria-controls={initial.picker && picker.open ? "concept-input-picker" : undefined}
        expectedRange={expectedRange}
        locale="en-GB"
        selectionMode={initial.selectionMode}
        placeholder={initial.selectionMode === "range" ? "Try next week or a date range" : "Try next Friday"}
      />
      {initial.picker && picker.open && (
        <div id="concept-input-picker">
          <QunoDatePicker
            key={picker.revision}
            classNames={{ selectionHeader: "concept-input-picker-summary" }}
            initialMonth={picker.month}
            onVisibleMonthChange={({ month }) => picker.setMonth(month)}
            value={value}
            onChange={({ value: next }) => setValue(next)}
          />
        </div>
      )}
    </div>
  );
}
