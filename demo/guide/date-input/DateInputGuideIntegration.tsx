import { StoryFeature } from "#quno-demo/guide/date-picker/StoryFeature";
import { StoryHowTo } from "#quno-demo/guide/date-picker/StoryHowTo";
import { TypeToEditExample } from "#quno-demo/guide/date-picker/TypeToEditExample";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import { dateInputProduction } from "#quno-demo/guide/shared/productionProfiles";
import {
  AccessibleDateInputExample,
  LocalizedDateInputExample,
  ParserConfiguredInputExample
} from "./DateInputGuideExamples";
import {
  accessibilitySnippet,
  compositionSnippet,
  localizationSnippet,
  parserConnectionSnippet
} from "./dateInputGuideSnippets";

const recipe = (title: string, copy: string, code: string) => (
  <StoryHowTo title={title} language="TSX" copy={copy} code={code} />
);

export function DateInputGuideIntegration() {
  return (
    <>
      <StoryFeature
        id="localization"
        number="04"
        kicker="Localized field"
        title="Separate recognition from presentation."
        copy="Locale, labels, and formatting control what people see, while parser languages decide which words the field recognizes."
        instruction="Switch to Deutsch, type 12 Juni, and press Enter; switch back to compare the committed format."
        howTo={recipe("Localize the field", "Configure recognition and display deliberately.", localizationSnippet)}
      >
        <LocalizedDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="parser-configuration"
        number="05"
        kicker="Date Parser"
        title="Use the same parsing contract everywhere."
        copy={
          <p>
            Date Input consumes Quno/Date Parser semantics. Configure the same expected range, language, date order,
            reference date, and week start; explore the full grammar in the{" "}
            <a href="/guide/date-parser">Date Parser field guide</a>.
          </p>
        }
        instruction="Type this week and press Enter. This field starts weeks on Sunday, matching the configured Datepicker format."
        howTo={recipe(
          "Share parser options",
          "Pass one parsing context to every date surface.",
          parserConnectionSnippet
        )}
      >
        <ParserConfiguredInputExample />
      </StoryFeature>

      <StoryFeature
        id="picker-composition"
        number="06"
        kicker="Datepicker composition"
        title="Let typing and direct manipulation share one value."
        copy="Date Input and Datepicker stay independent and synchronize through one controlled DateRange without an adapter."
        instruction="Type a range, use Arrow keys, or choose dates in the calendar. Both surfaces keep the same value."
        howTo={recipe("Compose input and Datepicker", "Own one range in the parent.", compositionSnippet)}
      >
        <TypeToEditExample />
      </StoryFeature>

      <StoryFeature
        id="accessibility"
        number="07"
        kicker="Native contracts"
        title="Keep the field understandable to every input method."
        copy="The component retains native labels and events, exposes recognition state, and marks invalid committed text with aria-invalid."
        instruction="Enter an invalid phrase and press Enter, then replace it with tomorrow and commit again."
        howTo={recipe(
          "Label and validate the field",
          "Use native input attributes and product labels.",
          accessibilitySnippet
        )}
      >
        <AccessibleDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="library-size"
        number="08"
        kicker="Production"
        title="Ship Date Input independently."
        copy="Date Input JavaScript is 6.77 KiB gzip. Its optional stylesheet is a separate 0.58 KiB gzip import; neither number includes external application runtimes."
        instruction="Compare JavaScript, optional CSS, runtime contracts, and the public surface without treating them as one payload."
      >
        <FieldGuideProduction profile={dateInputProduction} anchorIds={["dependencies"]} />
      </StoryFeature>
    </>
  );
}
