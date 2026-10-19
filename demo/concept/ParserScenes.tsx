import { useState } from "react";
import { parseDateInput } from "@quno/calendar/date-parser";
import { expectedRange, referenceDate, referenceLabel } from "./productValues";
import { getScenario } from "./scenarioCatalog";
import { parserLexicon } from "./parserVocabulary";
import { ParserTokens } from "./ParserTokens";
import "./parserScene.css";
export function ParserScenes({ scenario }: { scenario: string }) {
  const initial = getScenario("date-parser", scenario).initial;
  const [text, setText] = useState(initial.text);
  const { order, clocks } = initial;
  const result = parseDateInput({
    text,
    expectedRange,
    referenceDate,
    preferredDateOrder: order,
    recognizeTime: clocks,
    lexicon: parserLexicon
  });
  return (
    <div className="concept-product-card" data-ready="true">
      <label htmlFor="concept-phrase">Enter a date phrase</label>
      <input id="concept-phrase" data-action="phrase" value={text} onChange={(event) => setText(event.target.value)} />
      <small>Reference date: {referenceLabel}</small>
      <ParserTokens text={text} clocks={clocks} />
      <output aria-label="Resolved dates" className="concept-result" aria-live="polite">
        {"start" in result ? (
          <>
            <strong>
              Start · {result.start.date} {result.start.time}
            </strong>
            <strong>
              End · {result.end.date} {result.end.time}
            </strong>
          </>
        ) : result.status === "empty" ? (
          "Enter a phrase to see its dates"
        ) : (
          "Unrecognized date — try another phrase"
        )}
      </output>
    </div>
  );
}
