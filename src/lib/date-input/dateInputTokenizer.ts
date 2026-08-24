import type { DateInputToken } from "./dateInputTypes";

const isDigit = (value: string): boolean => /\d/u.test(value);
const isLetter = (value: string): boolean => /\p{L}|\p{M}/u.test(value);
const isUnicodeWhitespace = (value: string): boolean => /\p{Zs}|\s/u.test(value);
const isDash = (value: string): boolean => value === "-" || value === "–" || value === "—";

const isRangeSeparatorWord = (value: string): boolean => value === "to" || value === "bis";

const classifyWord = (word: string, start: number, end: number): DateInputToken => {
  const value = word.toLowerCase();
  return {
    type: isRangeSeparatorWord(value) ? "range-separator" : "word",
    value,
    raw: word,
    start,
    end
  };
};

const dateSeparator = (value: string, start: number, end: number): DateInputToken => ({
  type: "date-separator",
  value,
  raw: value,
  start,
  end
});

const rangeSeparator = (value: string, start: number, end: number): DateInputToken => ({
  type: "range-separator",
  value,
  raw: value,
  start,
  end
});

export const tokenizeDateInput = (text: string): DateInputToken[] => {
  const tokens: DateInputToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const char = text[cursor];
    const next = cursor + 1;

    if (isDigit(char)) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isDigit(text[cursor])) {
        cursor += 1;
      }
      tokens.push({
        type: "number",
        value: text.slice(start, cursor),
        raw: text.slice(start, cursor),
        start,
        end: cursor
      });
      continue;
    }

    if (isLetter(char)) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isLetter(text[cursor])) {
        cursor += 1;
      }
      const raw = text.slice(start, cursor);
      tokens.push(classifyWord(raw, start, cursor));
      continue;
    }

    if (isDash(char)) {
      const before = cursor > 0 ? text[cursor - 1] : "";
      const after = cursor + 1 < text.length ? text[cursor + 1] : "";
      if (isUnicodeWhitespace(before) && (!after || isUnicodeWhitespace(after))) {
        tokens.push(rangeSeparator(char, cursor, next));
      } else {
        tokens.push(dateSeparator(char, cursor, next));
      }
      cursor = next;
      continue;
    }

    if (char === "/" || char === ".") {
      tokens.push(dateSeparator(char, cursor, next));
      cursor = next;
      continue;
    }

    if (isUnicodeWhitespace(char)) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isUnicodeWhitespace(text[cursor])) {
        cursor += 1;
      }
      tokens.push(dateSeparator(text.slice(start, cursor), start, cursor));
      continue;
    }

    tokens.push(dateSeparator(char, cursor, next));
    cursor = next;
  }

  return tokens;
};
