import { useState } from "react";
import { QunoTimePicker, type MinuteCadence } from "@quno/calendar/timepicker";
import { getScenario } from "./scenarioCatalog";
export function TimeScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("timepicker", scenario).initial;
  const [value, setValue] = useState<string | null>(initial.value);
  const [cadence, setCadence] = useState<MinuteCadence>(initial.cadence);
  const [business, setBusiness] = useState(initial.businessHours);
  return (
    <div className="concept-product-card" data-ready="true">
      <fieldset className="concept-choice">
        <legend>Minute cadence</legend>
        {([5, 15, 20] as const).map((step) => (
          <button
            key={step}
            data-action={`cadence-${step}`}
            aria-pressed={cadence === step}
            onClick={() => setCadence(step)}
          >
            {step} min
          </button>
        ))}
      </fieldset>
      <label>
        <input type="checkbox" checked={business} onChange={(event) => setBusiness(event.target.checked)} /> Business
        hours (09–17)
      </label>
      <QunoTimePicker
        value={value}
        onChange={({ value: next }) => setValue(next)}
        minuteCadence={cadence}
        enabledHours={business ? [9, 10, 11, 12, 13, 14, 15, 16, 17] : undefined}
      />
      <output className="concept-result" aria-live="polite">
        Selected time: {value ?? "none"}
      </output>
    </div>
  );
}
