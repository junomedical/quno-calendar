import type { DateInputToken } from "./dateInputTypes";

const isDigit = ({ value }: { value: string }): boolean => /\d/u.test(value);
const isLetter = ({ value }: { value: string }): boolean => /\p{L}|\p{M}/u.test(value);
const isUnicodeWhitespace = ({ value }: { value: string }): boolean => /\p{Zs}|\s/u.test(value);
const isDash = ({ value }: { value: string }): boolean => value === "-" || value === "–" || value === "—";

const isRangeSeparatorWord = ({ value }: { value: string }): boolean => value === "to" || value === "bis";

const classifyWord = ({ word, start, end }: { word: string; start: number; end: number }): DateInputToken => {
  const value = word.toLowerCase();
  return {
    type: isRangeSeparatorWord({ value }) ? "range-separator" : "word",
    value,
    raw: word,
    start,
    end
  };
};

const dateSeparator = ({ value, start, end }: { value: string; start: number; end: number }): DateInputToken => ({
  type: "date-separator",
  value,
  raw: value,
  start,
  end
});

const rangeSeparator = ({ value, start, end }: { value: string; start: number; end: number }): DateInputToken => ({
  type: "range-separator",
  value,
  raw: value,
  start,
  end
});

export const tokenizeDateInput = ({ text }: { text: string }): DateInputToken[] => {
  const tokens: DateInputToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const char = text[cursor];
    const next = cursor + 1;

    if (isDigit({ value: char })) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isDigit({ value: text[cursor] })) {
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

    if (isLetter({ value: char })) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isLetter({ value: text[cursor] })) {
        cursor += 1;
      }
      const raw = text.slice(start, cursor);
      tokens.push(classifyWord({ word: raw, start, end: cursor }));
      continue;
    }

    if (isDash({ value: char })) {
      const before = cursor > 0 ? text[cursor - 1] : "";
      const after = cursor + 1 < text.length ? text[cursor + 1] : "";
      if (isUnicodeWhitespace({ value: before }) && (!after || isUnicodeWhitespace({ value: after }))) {
        tokens.push(rangeSeparator({ value: char, start: cursor, end: next }));
      } else {
        tokens.push(dateSeparator({ value: char, start: cursor, end: next }));
      }
      cursor = next;
      continue;
    }

    if (char === "/" || char === ".") {
      tokens.push(dateSeparator({ value: char, start: cursor, end: next }));
      cursor = next;
      continue;
    }

    if (isUnicodeWhitespace({ value: char })) {
      const start = cursor;
      cursor += 1;
      while (cursor < text.length && isUnicodeWhitespace({ value: text[cursor] })) {
        cursor += 1;
      }
      tokens.push(dateSeparator({ value: text.slice(start, cursor), start, end: cursor }));
      continue;
    }

    tokens.push(dateSeparator({ value: char, start: cursor, end: next }));
    cursor = next;
  }

  return tokens;
};
