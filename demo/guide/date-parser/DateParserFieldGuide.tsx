import { DateInputParserExample } from "#quno-demo/guide/date-input/DateInputParserExample";
import "#quno-demo/guide/date-input/dateInputGuide.css";
import "#quno-demo/guide/date-picker/story-topics.css";
import { StoryFeature } from "#quno-demo/guide/date-picker/StoryFeature";
import { StoryHowTo } from "#quno-demo/guide/date-picker/StoryHowTo";
import { FieldGuidePage } from "#quno-demo/guide/shared/FieldGuidePage";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import { dateParserProduction } from "#quno-demo/guide/shared/productionProfiles";
import { PreferredOrderParserExample, TokenParserExample } from "./DateParserExamples";
import {
  expectedRecipe,
  formatsRecipe,
  languageRecipe,
  orderRecipe,
  rangeRecipe,
  relativeRecipe,
  tokenizeRecipe
} from "./dateParserSnippets";

const contents = [
  ["#date-formats", "01", "Recognize familiar formats"],
  ["#preferred-date-order", "02", "Resolve numeric order"],
  ["#relative-dates", "03", "Interpret relative dates"],
  ["#range-parsing", "04", "Parse inclusive ranges"],
  ["#expected-period", "05", "Rank a useful period"],
  ["#multiple-languages", "06", "Recognize languages together"],
  ["#tokenization", "07", "Inspect the headless grammar"],
  ["#parser-production", "08", "Ship without a UI runtime"]
] as const;

const recipe = (title: string, copy: string, code: string) => (
  <StoryHowTo title={title} language="TS" copy={copy} code={code} />
);

export function DateParserFieldGuide() {
  return (
    <FieldGuidePage
      className="date-input-guide"
      product="Quno/Date Parser"
      title="Dates, understood the way people write them."
      intro={
        <p>Turn familiar formats, relative phrases, and multilingual ranges into one timezone-free value model.</p>
      }
      demoHref="/demo/date-parser"
      contents={contents}
      meta={["Interactive examples", "Copyable recipes", "Headless + SSR-safe"]}
    >
      <StoryFeature
        id="date-formats"
        number="01"
        kicker="Accepted formats"
        title="Recognize the forms people already use."
        copy="Numeric, ISO-like, and month-name dates resolve to the same YYYY-MM-DD value."
        instruction="Try every sample, then change separators or month names."
        howTo={recipe("Parse familiar dates", "Provide one explicit parsing context.", formatsRecipe)}
      >
        <DateInputParserExample
          initialText="3/4/2026"
          samples={["3/4/2026", "2026-04-03", "3 April 2026", "April 3, 2026"]}
        />
      </StoryFeature>
      <StoryFeature
        id="preferred-date-order"
        number="02"
        kicker="Date order"
        title="Decide what an ambiguous number means."
        copy="DMY, MDY, YMD, or locale order resolves numeric ambiguity without changing explicit dates."
        instruction="Switch DMY and MDY to compare the same input."
        howTo={recipe("Choose date order", "Use the product convention.", orderRecipe)}
      >
        <PreferredOrderParserExample />
      </StoryFeature>
      <StoryFeature
        id="relative-dates"
        number="03"
        kicker="Relative dates"
        title="Anchor natural phrases to a predictable calendar."
        copy="Reference date and week start make current, previous, and named-weekday phrases deterministic."
        instruction="This example starts Sunday. Compare this week, previous week, and last Monday."
        howTo={recipe("Resolve relative dates", "Pin referenceDate for reproducible output.", relativeRecipe)}
      >
        <DateInputParserExample
          initialText="this week"
          samples={["this week", "previous week", "last Monday", "next month", "90 days"]}
          weekStartsOn={0}
        />
      </StoryFeature>
      <StoryFeature
        id="range-parsing"
        number="04"
        kicker="Ranges"
        title="Parse both endpoints as one inclusive value."
        copy="Each endpoint may use a familiar or relative form; the result is normalized into start and end."
        instruction="Try the complete range, then leave the second endpoint empty."
        howTo={recipe("Parse a range", "Use range mode for inclusive periods.", rangeRecipe)}
      >
        <DateInputParserExample
          initialText="12 June 2026 – next Monday"
          samples={["12 June 2026 – next Monday", "12/14 -"]}
        />
      </StoryFeature>
      <StoryFeature
        id="expected-period"
        number="05"
        kicker="Expected period"
        title="Guide ambiguity without rejecting explicit dates."
        copy="The expected range ranks missing years and plausible alternatives; product validation remains separate."
        instruction="Compare a missing year with the explicit 2030 sample."
        howTo={recipe("Rank a useful period", "Use a realistic business window.", expectedRecipe)}
      >
        <DateInputParserExample initialText="12/14" samples={["12/14", "1/1/30"]} />
      </StoryFeature>
      <StoryFeature
        id="multiple-languages"
        number="06"
        kicker="Languages and lexicon"
        title="Let languages and product vocabulary live together."
        copy="Recognition languages do not dictate output locale, and lexicon extensions add deliberate product wording."
        instruction="Try each English, German, and product-specific phrase. Every sample resolves to a visibly different day or range."
        howTo={recipe("Extend recognition", "List languages and explicit aliases.", languageRecipe)}
      >
        <DateInputParserExample
          initialText="12 June 2026"
          parserLanguages={["en", "de"]}
          lexicon={{ previous: ["prior"] }}
          samples={["12 June 2026", "14 Juli 2026", "tomorrow", "gestern", "prior week"]}
        />
      </StoryFeature>
      <StoryFeature
        id="tokenization"
        number="07"
        kicker="Headless grammar"
        title="Inspect recognition before resolving a value."
        copy="Tokenization exposes words, numbers, date separators, and range separators without rendering a component."
        instruction="Edit the phrase and inspect each token boundary."
        howTo={recipe("Tokenize input", "Use tokens for diagnostics or complementary UI.", tokenizeRecipe)}
      >
        <TokenParserExample />
      </StoryFeature>
      <StoryFeature
        id="parser-production"
        number="08"
        kicker="Production"
        title="Ship Date Parser independently."
        copy="Date Parser JavaScript is 4.45 KiB gzip. It has no stylesheet, UI framework runtime, or runtime dependency."
        instruction="Review its JavaScript artifact, runtime contract, and public surface without a UI payload."
      >
        <FieldGuideProduction profile={dateParserProduction} />
      </StoryFeature>
    </FieldGuidePage>
  );
}
