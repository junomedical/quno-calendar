export const formatsRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: text, ...({
  expectedRange,
  locale: "en-GB",
  preferredDateOrder: "dmy"
}) });`;

export const orderRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: "3/4/2026", ...({
  expectedRange,
  preferredDateOrder: "mdy" // dmy, mdy, ymd, or locale
}) });`;

export const relativeRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: "this week", ...({
  expectedRange,
  referenceDate: "2026-08-25",
  weekStartsOn: 0
}) });`;

export const rangeRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: "12 June 2026 – next Monday", ...({
  expectedRange,
  selectionMode: "range",
  referenceDate: "2026-08-25"
}) });`;

export const expectedRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: "12/14", ...({
  expectedRange: { start: "2025-01-01", end: "2027-12-31" }
}) });

// expectedRange ranks ambiguity; validate business limits separately.`;

export const languageRecipe = `import { parseDateInput } from "@quno/calendar/date-parser";

parseDateInput({ text: text, ...({
  expectedRange,
  parserLanguages: ["en", "de"],
  lexicon: { previous: ["prior"] }
}) });`;

export const tokenizeRecipe = `import { tokenizeDateInput } from "@quno/calendar/date-parser";

const tokens = tokenizeDateInput({ text: "next 2 weeks" });`;

export const timeRecipe = `import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const result = parseDateInput({
  text: "tomorrow 23:00–01:00",
  recognizeTime: true,
  referenceDate: "2026-08-25",
  expectedRange: { start: "2026-01-01", end: "2027-12-31" }
});
// value: { start: "2026-08-26", end: "2026-08-27" }
// times: { start: "23:00", end: "01:00" }

const tokens = tokenizeDateInput({ text: "10:30PM", recognizeTime: true });
// A time token has value "22:30" and raw "10:30PM".`;
