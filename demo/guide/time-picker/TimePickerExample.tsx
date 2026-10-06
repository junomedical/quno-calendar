import { useState } from "react";
import { QunoTimePicker, type MinuteCadence } from "@quno/calendar/timepicker";
import "./time-picker-demo.css";

const cadences: MinuteCadence[] = [1, 2, 3, 4, 5, 6, 10, 15, 20, 30];
const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export function TimePickerExample() {
  const [value, setValue] = useState<string | null>("10:30");
  const [minuteCadence, setCadence] = useState<MinuteCadence>(15);
  const [hours, setHours] = useState("business");
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="time-picker-example">
      <div className="time-picker-example__settings">
        <label>
          Minute cadence
          <select
            aria-label="Minute cadence"
            value={minuteCadence}
            onChange={(event) => setCadence(Number(event.target.value) as MinuteCadence)}
          >
            {cadences.map((cadence) => (
              <option key={cadence} value={cadence}>
                {cadence} min
              </option>
            ))}
          </select>
        </label>
        <label>
          Enabled hours
          <select aria-label="Enabled hours" value={hours} onChange={(event) => setHours(event.target.value)}>
            <option value="business">09–17</option>
            <option value="all">00–23</option>
            <option value="empty">All (empty list)</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} /> Disabled
        </label>
        <button type="button" onClick={() => setValue("23:59")}>
          Set 23:59 externally
        </button>
      </div>
      <QunoTimePicker
        value={value}
        onChange={({ value }) => setValue(value)}
        minuteCadence={minuteCadence}
        enabledHours={hours === "business" ? businessHours : hours === "empty" ? [] : undefined}
        disabled={disabled}
      />
      <output aria-live="polite">{value ?? "No selected time"}</output>
    </div>
  );
}

export function UncontrolledTimeExample() {
  const [lastChange, setLastChange] = useState<string | null>("13:15");
  return (
    <div className="time-picker-example time-picker-example--themed">
      <QunoTimePicker
        defaultValue="13:15"
        enabledHours={[12, 13, 14]}
        minuteCadence={15}
        locale="de-DE"
        labels={{ clear: "Reset time" }}
        formatters={{ time: ({ time }) => `${time} Uhr` }}
        onChange={({ value }) => setLastChange(value)}
      />
      <output aria-live="polite">{lastChange ?? "No selected time"}</output>
    </div>
  );
}

export const timePickerRecipe = `import { useState } from "react";
import { QunoTimePicker } from "@quno/calendar/timepicker";
import "@quno/calendar/timepicker/styles.css";

function TimeField() {
  const [value, setValue] = useState<string | null>("10:30");
  return <QunoTimePicker value={value} onChange={({ value }) => setValue(value)}
    enabledHours={[9, 10, 11, 12, 13, 14, 15, 16, 17]} minuteCadence={15} />;
}`;
