import { DateTimeExample } from "#quno-demo/guide/date-picker/DateTimeExample";
import { ComponentDemoShell } from "./ComponentDemoShell";

export function DateTimeDemo() {
  return (
    <ComponentDemoShell
      title="Quno/Date & Time"
      guideHref="/guide/datepicker#date-time"
      description="Type tomorrow 10:30AM or choose a day and time below. Both controls stay in sync."
    >
      <DateTimeExample />
    </ComponentDemoShell>
  );
}
