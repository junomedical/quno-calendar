import type { DateRange } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { useState } from "react";
import { ComponentDemoShell } from "./ComponentDemoShell";

const expectedRange: DateRange = { start: "2025-08-25", end: "2027-08-25" };

export function DateInputDemo() {
  const [value, setValue] = useState<DateRange | null>(null);

  return (
    <ComponentDemoShell
      description="Try “next 2 weeks”, “12 June”, or a complete typed range."
      guideHref="/guide/date-input-field"
      title="Date input field"
    >
      <div className="component-demo__panel">
        <QunoDateInput
          aria-label="Enter a date or period"
          expectedRange={expectedRange}
          onChange={setValue}
          placeholder="Try next 2 weeks"
          referenceDate="2026-08-25"
          value={value}
        />
        <p className="component-demo__value" aria-live="polite">
          {value ? `${value.start} → ${value.end}` : "Enter a date or period"}
        </p>
      </div>
    </ComponentDemoShell>
  );
}
