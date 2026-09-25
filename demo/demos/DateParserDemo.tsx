import type { WeekStart } from "@quno/calendar";
import {
  parseDateInput,
  tokenizeDateInput,
  type DateInputDateOrder,
  type DateInputParserLanguage
} from "@quno/calendar/date-parser";
import { useState } from "react";
import { ComponentDemoShell } from "./ComponentDemoShell";

const samples = ["3/4/2026", "this week", "last Monday", "12 June 2026 – next Monday", "12 Juni 2026"];
type ParserLanguageMode = DateInputParserLanguage | "en-de";

export function DateParserDemo() {
  const [text, setText] = useState("next 2 weeks");
  const [dateOrder, setDateOrder] = useState<DateInputDateOrder>("dmy");
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>(1);
  const [language, setLanguage] = useState<ParserLanguageMode>("en-de");
  const parserLanguages: ReadonlyArray<DateInputParserLanguage> = language === "en-de" ? ["en", "de"] : [language];
  const options = {
    expectedRange: { start: "2025-08-25", end: "2027-08-25" } as const,
    referenceDate: "2026-08-25" as const,
    preferredDateOrder: dateOrder,
    parserLanguages,
    weekStartsOn
  };
  return (
    <ComponentDemoShell
      description="Try familiar dates, relative phrases, or a complete range and inspect the headless result."
      guideHref="/guide/date-parser"
      title="Quno/Date Parser"
    >
      <div className="component-demo__panel date-parser-demo">
        <label htmlFor="date-parser-demo">Date text</label>
        <input id="date-parser-demo" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="date-parser-demo__samples" aria-label="Sample phrases">
          {samples.map((sample) => (
            <button key={sample} onClick={() => setText(sample)} type="button">
              {sample}
            </button>
          ))}
        </div>
        <div className="date-parser-demo__options">
          <label>
            Preferred order
            <select value={dateOrder} onChange={(event) => setDateOrder(event.target.value as DateInputDateOrder)}>
              <option value="dmy">DMY</option>
              <option value="mdy">MDY</option>
              <option value="ymd">YMD</option>
            </select>
          </label>
          <label>
            Week starts
            <select value={weekStartsOn} onChange={(event) => setWeekStartsOn(Number(event.target.value) as WeekStart)}>
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
              <option value={6}>Saturday</option>
            </select>
          </label>
          <label>
            Languages
            <select value={language} onChange={(event) => setLanguage(event.target.value as ParserLanguageMode)}>
              <option value="en-de">English + Deutsch</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
        </div>
        <section>
          <h2>Resolved output</h2>
          <pre className="component-demo__value" aria-live="polite">
            {JSON.stringify(parseDateInput({ text, ...options }), null, 2)}
          </pre>
        </section>
        <section>
          <h2>Tokens</h2>
          <pre className="component-demo__value">{JSON.stringify(tokenizeDateInput({ text }), null, 2)}</pre>
        </section>
      </div>
    </ComponentDemoShell>
  );
}
