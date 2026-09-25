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
