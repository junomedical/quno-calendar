import { DateTimeExample, dateTimeSnippet } from "./DateTimeExample";
import { StoryFeature } from "./StoryFeature";
import { StoryHowTo } from "./StoryHowTo";

export function DateTimeStory({ number = "16" }: { number?: string }) {
  return (
    <StoryFeature
      id="date-time"
      number={number}
      kicker="Optional time mode"
      title="Choose a day and its time."
      copy={
        <p>
          Single-day time mode opens time selection as soon as you choose a day. Pick minutes beside sticky hour labels
          under the selected date’s full title. The arrows move through enabled days while keeping time selection open;
          click the date title to return to days. Typing and picking share the same day and clock. Typed times ignore
          the picker’s cadence and hours unless you enable the force setting.{" "}
          <a href="/demo/date-time">Open the date-time demo</a>.
        </p>
      }
      instruction="Type 6 oct 2pm and press Enter to recognize 6 October 2026 at 14:00, or try tomorrow 10:30AM. Select the day in the calendar to choose a time, then change the cadence or enabled hours. Type 08:17 to bypass the picker settings, then enable Force cadence and hours to restrict typing. Enable Skip weekends, then use the header arrows to move through available days. Click the date title to return to days, or press Escape."
      howTo={
        <StoryHowTo
          title="Compose a date-time field"
          language="TSX"
          copy="Control one date range and a separate HH:mm clock. Picker settings restrict typing only when Date Input enables forceCadence."
          code={dateTimeSnippet}
        />
      }
    >
      <DateTimeExample />
    </StoryFeature>
  );
}
