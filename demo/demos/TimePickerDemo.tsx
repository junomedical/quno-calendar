import { TimePickerExample } from "#quno-demo/guide/time-picker/TimePickerExample";
import { ComponentDemoShell } from "./ComponentDemoShell";

export function TimePickerDemo() {
  return (
    <ComponentDemoShell
      title="Quno/Timepicker"
      guideHref="/guide/timepicker"
      description="Choose a clock with sticky hours and your preferred minute cadence."
    >
      <TimePickerExample />
    </ComponentDemoShell>
  );
}
