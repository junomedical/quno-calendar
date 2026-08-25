import { StoryFeature } from "../date-picker/StoryFeature";
import { StoryHowTo } from "../date-picker/StoryHowTo";
import {
  DateInputModeExample,
  KeyboardDateInputExample,
  PreferredDateOrderExample,
  RangeDateInputExample
} from "./DateInputGuideExamples";
import { DateInputParserExample } from "./DateInputParserExample";
import {
  formatsSnippet,
  keyboardSnippet,
  modeSnippet,
  preferredOrderSnippet,
  rangeSnippet,
  relativeSnippet
} from "./dateInputGuideSnippets";

const recipe = (title: string, copy: string, code: string) => (
  <StoryHowTo title={title} language="TSX" copy={copy} code={code} />
);

export function DateInputGuideBasics() {
  return (
    <>
      <StoryFeature
        id="selection-mode"
        number="01"
        kicker="Single or range"
        title="Choose one day or a period."
        copy="One explicit flag changes what the field accepts while the value always stays null or a timezone-free DateRange."
        instruction="Switch modes, then type a single date or a two-date period and press Enter."
        howTo={recipe("Choose a selection mode", "Set the mode beside the same controlled range value.", modeSnippet)}
      >
        <DateInputModeExample />
      </StoryFeature>

      <StoryFeature
        id="date-formats"
        number="02"
        kicker="Flexible formats"
        title="Recognize dates in familiar formats."
        copy="Numeric, ISO-like, and month-name dates resolve to the same YYYY-MM-DD value. Locale and preferred order settle genuinely ambiguous numeric input."
        instruction="Try each example, then edit separators, month names, or the order yourself."
        howTo={recipe(
          "Recognize date formats",
          "Pass the same parsing context to the field or headless parser.",
          formatsSnippet
        )}
        reverse
      >
        <DateInputParserExample
          initialText="3/4/2026"
          samples={["3/4/2026", "2026-04-03", "3 April 2026", "April 3, 2026"]}
        />
      </StoryFeature>

      <StoryFeature
        id="preferred-date-order"
        number="03"
        kicker="Preferred date order"
        title="Decide what an ambiguous number means."
        copy="The field recognizes familiar alternatives, then preferredDateOrder gives DMY, MDY, YMD, or locale-derived input the intended priority. Explicit month names and ISO order stay clear."
        instruction="Switch between DMY and MDY to resolve the same 3/4/2026 text as 3 April or 4 March."
        howTo={recipe(
          "Prefer a date order",
          "Set an explicit product convention or derive it from locale.",
          preferredOrderSnippet
        )}
      >
        <PreferredDateOrderExample />
      </StoryFeature>

      <StoryFeature
        id="relative-dates"
        number="04"
        kicker="Relative dates"
        title="Understand dates relative to today."
        copy="Rolling durations, complete calendar periods, and named weekdays resolve from an explicit reference date. Calendar-week phrases use the same weekStartsOn value as the datepicker."
        instruction="This example starts weeks on Sunday. Compare this week, previous week, last Monday, next month, and 90 days from the fixed 25 August reference."
        howTo={recipe(
          "Resolve relative dates",
          "Pin referenceDate whenever reproducible output matters.",
          relativeSnippet
        )}
      >
        <DateInputParserExample
          initialText="previous week"
          label="Relative phrase"
          samples={["this week", "previous week", "last Monday", "next month", "90 days"]}
          weekStartsOn={0}
        />
      </StoryFeature>

      <StoryFeature
        id="keyboard-controls"
        number="05"
        kicker="Keyboard controls"
        title="Edit the part under the caret."
        copy="Enter or blur commits. Arrow Up and Arrow Down spin the focused day, month, year, duration unit, or range endpoint without replacing the native text field."
        instruction="Place the caret over 25, August, or 2026 and press Arrow Up or Arrow Down; press Enter to commit."
        howTo={recipe(
          "Use keyboard editing",
          "Native input events remain available for product shortcuts.",
          keyboardSnippet
        )}
        reverse
      >
        <KeyboardDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="range-input"
        number="06"
        kicker="Range input"
        title="Type both ends in one field."
        copy="A dash begins the second endpoint, and mixed endpoint formats are accepted. The committed value is normalized into inclusive start and end dates."
        instruction="Replace the value with 12 June 2026 – next Monday, then press Enter."
        howTo={recipe(
          "Capture a date range",
          "Range mode is the default; declare it when the distinction helps readers.",
          rangeSnippet
        )}
      >
        <RangeDateInputExample />
      </StoryFeature>
    </>
  );
}
