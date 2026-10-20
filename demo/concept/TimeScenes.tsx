import { useState } from "react";
import { QunoTimePicker, type MinuteCadence } from "@quno/calendar/timepicker";
import { getScenario } from "./scenarioCatalog";
import type { InitialByProduct } from "./scenarioTypes";
import { TimeCalendarScene } from "./TimeCalendarScene";
import "./timeCadence.css";
export function TimeScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("timepicker", scenario).initial;
  return initial.date ? <TimeCalendarScene initial={initial} /> : <StandaloneTimeScene initial={initial} />;
}
function StandaloneTimeScene({ initial }: { initial: InitialByProduct["timepicker"] }) {
  const [value, setValue] = useState<string | null>(initial.value);
  const [cadence, setCadence] = useState<MinuteCadence>(initial.cadence);
  return (
    <div className="concept-product-card" data-ready="true">
      <QunoTimePicker
        value={value}
        onChange={({ value: next }) => setValue(next)}
        minuteCadence={cadence}
        enabledHours={initial.businessHours ? [9, 10, 11, 12, 13, 14, 15, 16, 17] : undefined}
      />
      <fieldset className="concept-choice concept-cadence">
        <legend>Cadence</legend>
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
    </div>
  );
}
