import type { DateRange } from "@quno/calendar";
import { QunoDatePicker } from "@quno/calendar/date-picker";
import { useState } from "react";
import { ComponentDemoShell } from "./ComponentDemoShell";

export function DateRangeDemo() {
  const [value, setValue] = useState<DateRange | null>({
    start: "2026-08-19",
    end: "2026-08-25"
  });

  return (
    <ComponentDemoShell
      description="Paint a range, resize either endpoint, or move the whole period."
      guideHref="/guide/date-range-input"
      title="Date range input"
    >
      <div className="component-demo__panel">
        <QunoDatePicker initialMonth="2026-08-01" onChange={setValue} value={value} />
        <p className="component-demo__value" aria-live="polite">
          {value ? `${value.start} → ${value.end}` : "No dates selected"}
        </p>
      </div>
    </ComponentDemoShell>
  );
}
