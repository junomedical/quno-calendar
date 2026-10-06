import type { DateInputToken, DateInputTokenType } from "./dateInputTypes";

const digit = /\d/u;
const letter = /[\p{L}\p{M}]/u;
const whitespace = /\s|\p{Zs}/u;

type ClockReader = (args: { text: string; start: number }) => DateInputToken | null;

export const tokenizeDateTokens = ({ text, clock }: { text: string; clock?: ClockReader }): DateInputToken[] => {
  const tokens: DateInputToken[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = cursor;
    const char = text[cursor];
    const pattern = digit.test(char) ? digit : letter.test(char) ? letter : whitespace.test(char) ? whitespace : null;
    let type: DateInputTokenType = pattern === digit ? "number" : pattern === letter ? "word" : "date-separator";
    const time = type === "number" ? clock?.({ text, start }) : null;
    if (time) {
      tokens.push(time);
      cursor = time.end;
      continue;
    }
    cursor++;
    while (pattern && cursor < text.length && pattern.test(text[cursor])) cursor++;
    const raw = text.slice(start, cursor);
    const value = type === "word" ? raw.toLowerCase() : raw;
    if (type === "word" && (value === "to" || value === "bis")) type = "range-separator";
    if (char === "-" || char === "–" || char === "—") {
      const before = start > 0 ? text[start - 1] : "";
      const after = text[cursor] ?? "";
      if (
        (whitespace.test(before) && (!after || whitespace.test(after))) ||
        (clock && tokens.at(-1)?.type === "time" && clock({ text, start: cursor }))
      )
        type = "range-separator";
    }
    tokens.push({ type, value, raw, start, end: cursor });
  }
  return tokens;
};
