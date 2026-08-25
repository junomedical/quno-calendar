import { StoryFeature } from "../date-picker/StoryFeature";
import { StoryHowTo } from "../date-picker/StoryHowTo";
import { TypeToEditExample } from "../date-picker/TypeToEditExample";
import {
  DateInputDependencyFacts,
  DateInputLibrarySizeFacts,
  LocalizedDateInputExample
} from "./DateInputGuideExamples";
import { DateInputParserExample } from "./DateInputParserExample";
import {
  compositionSnippet,
  dependenciesSnippet,
  expectedPeriodSnippet,
  librarySizeSnippet,
  localizationSnippet,
  multipleLanguagesSnippet
} from "./dateInputGuideSnippets";

const recipe = (title: string, copy: string, code: string, language = "TSX") => (
  <StoryHowTo title={title} language={language} copy={copy} code={code} />
);

export function DateInputGuideIntegration() {
  return (
    <>
      <StoryFeature
        id="expected-period"
        number="07"
        kicker="Expected period"
        title="Guide ambiguity toward a useful period."
        copy="The required expectedRange ranks missing years and ambiguous dates around the product’s real domain. It is a hint, not a validity boundary; products validate explicit out-of-period dates separately."
        instruction="Switch between 12/14 and 1/1/30. The first infers a nearby year; the explicit 2030 date still resolves."
        howTo={recipe(
          "Set the expected period",
          "Use a realistic business window for ranking, then apply product validation separately.",
          expectedPeriodSnippet
        )}
        reverse
      >
        <DateInputParserExample
          expectedRange={{ start: "2025-08-25", end: "2027-08-25" }}
          initialText="12/14"
          label="Date inside the expected period"
          samples={["12/14", "1/1/30"]}
        />
      </StoryFeature>

      <StoryFeature
        id="localization"
        number="08"
        kicker="Localization"
        title="Parse and format for the product language."
        copy="Locale controls output and numeric order. Parser languages, labels, formatter, and lexicon let products accept multilingual or domain-specific wording deliberately."
        instruction="Switch to Deutsch, type 12 Juni, and press Enter; switch back to compare formatting."
        howTo={recipe(
          "Localize the field",
          "Configure recognition and presentation independently when needed.",
          localizationSnippet
        )}
      >
        <LocalizedDateInputExample />
      </StoryFeature>

      <StoryFeature
        id="multiple-languages"
        number="09"
        kicker="Multiple languages"
        title="Let languages live together in one field."
        copy="Recognition languages are independent from display locale. A multilingual product can accept English and German month names or relative words together, then format every committed value consistently."
        instruction="Switch between 12 June 2026, 12 Juni 2026, today, and heute; every phrase resolves in the same parser."
        howTo={recipe(
          "Recognize multiple languages",
          "List accepted parser languages while keeping one output locale.",
          multipleLanguagesSnippet
        )}
      >
        <DateInputParserExample
          initialText="12 June 2026"
          label="English or German date"
          parserLanguages={["en", "de"]}
          samples={["12 June 2026", "12 Juni 2026", "today", "heute"]}
        />
      </StoryFeature>

      <StoryFeature
        id="picker-composition"
        number="10"
        kicker="Date range input"
        title="Compose typing with the date range picker."
        copy="QunoDateInput and QunoDatePicker stay independent and synchronize through one controlled DateRange. Neither component needs an adapter or private coupling."
        instruction="Type a range, use Arrow keys, or choose dates in the calendar. Both surfaces keep the same value."
        howTo={recipe(
          "Compose input and picker",
          "Own one range in the parent and pass it to both public entry points.",
          compositionSnippet
        )}
        reverse
      >
        <TypeToEditExample />
      </StoryFeature>

      <StoryFeature
        id="library-size"
        number="11"
        kicker="Library size"
        title="Import only the field-sized payload."
        copy="The date-input entry is built and measured independently from the picker and timeline, with JavaScript and optional CSS tracked against separate gzip budgets."
        instruction="Compare the current independently measured artifacts with their release budgets."
        howTo={recipe(
          "Keep the input entry independent",
          "Import the date-input entry and add its stylesheet only when the default presentation is useful.",
          librarySizeSnippet
        )}
      >
        <DateInputLibrarySizeFacts />
      </StoryFeature>

      <StoryFeature
        id="dependencies"
        number="12"
        kicker="Dependencies"
        title="Know what the field brings with it."
        copy="The date-input entry is independently importable, SSR-safe, and has no date-library runtime. Its stylesheet is optional and JavaScript never injects CSS."
        instruction="Review the independently measured payload and runtime contracts before adding the entry to a production build."
        howTo={recipe(
          "Import the date input",
          "Import only the entry and optional stylesheet you use.",
          dependenciesSnippet
        )}
        reverse
      >
        <DateInputDependencyFacts />
      </StoryFeature>
    </>
  );
}
