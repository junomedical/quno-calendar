import { StoryFeature } from "#quno-demo/guide/date-picker/StoryFeature";
import { StoryHowTo } from "#quno-demo/guide/date-picker/StoryHowTo";
import {
  ControlledDateInputExample,
  DateInputModeExample,
  KeyboardDateInputExample,
  RangeDateInputExample
} from "./DateInputGuideExamples";
import { controlledSnippet, keyboardSnippet, modeSnippet, rangeSnippet } from "./dateInputGuideSnippets";

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
        title="Keep one timezone-free value shape."
        copy="One explicit flag changes what the field accepts while the value remains null or an inclusive DateRange."
        instruction="Switch modes, type one date or a two-date period, and press Enter."
        howTo={recipe("Choose a selection mode", "Keep the same controlled range value in either mode.", modeSnippet)}
      >
        <DateInputModeExample />
      </StoryFeature>

      <StoryFeature
        id="controlled-state"
        number="02"
        kicker="Controlled state"
        title="Let the product own every committed change."
        copy="Controlled and uncontrolled fields share parsing, recognition, and commit behavior without replacing native input events."
        instruction="Type a different date and press Enter, then use Reset to restore the parent-owned value."
        howTo={recipe(
          "Control the field",
          "Pass value and onChange just like any other React field.",
          controlledSnippet
        )}
      >
        <ControlledDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="keyboard-controls"
        number="03"
        kicker="Keyboard controls"
        title="Edit the part under the caret."
        copy="Enter or blur commits. Arrow Up and Arrow Down spin the focused day, month, year, duration unit, or range endpoint without replacing the native field."
        instruction="Place the caret over 25, August, or 2026 and press Arrow Up or Arrow Down; press Enter to commit."
        howTo={recipe(
          "Use keyboard editing",
          "Native input events remain available for product shortcuts.",
          keyboardSnippet
        )}
      >
        <KeyboardDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="range-input"
        number="03"
        kicker="Range entry"
        title="Type both ends in one field."
        copy="A dash begins the second endpoint, mixed endpoint formats are accepted, and the committed result stays inclusive."
        instruction="Replace the value with 12 June 2026 – next Monday, then press Enter."
        howTo={recipe("Capture a date range", "Range mode is the default.", rangeSnippet)}
        subsection
      >
        <RangeDateInputExample />
      </StoryFeature>
    </>
  );
}
