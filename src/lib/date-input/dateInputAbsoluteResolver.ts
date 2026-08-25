import { normalizeDateInputWord, type DateInputVocabulary } from "./dateInputVocabulary";
import type { DateInputResolveOptions, DateInputToken, ResolvedDateCandidate } from "./dateInputTypes";

type Part = { value: number; digits: number };

const isUsLocale = (locale: string): boolean => /^en-us\b/i.test(locale);

const separator = (value: string): boolean => /^[\s/.,\-–—]+$/u.test(value);

const dateOrder = (options: DateInputResolveOptions): "dmy" | "mdy" | "ymd" =>
  options.preferredDateOrder === "locale" ? (isUsLocale(options.locale) ? "mdy" : "dmy") : options.preferredDateOrder;

const valid = (year: number, month: number, day: number): boolean => {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
};

const yearsInWindow = (options: DateInputResolveOptions): number[] => {
  const start = Number(options.expectedRange.start.slice(0, 4));
  const end = Number(options.expectedRange.end.slice(0, 4));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const yearsFor = (part: Part | undefined, options: DateInputResolveOptions): number[] => {
  if (!part) return yearsInWindow(options);
  if (part.digits === 3) return [];
  if (part.digits > 2 || part.value >= 100) return [part.value];
  const inWindow = yearsInWindow(options).filter((year) => year % 100 === part.value);
  if (inWindow.length) return inWindow;
  const reference = Number(options.referenceDate.slice(0, 4));
  const century = Math.floor(reference / 100) * 100;
  return [century - 100 + part.value, century + part.value, century + 100 + part.value].sort(
    (left, right) => Math.abs(left - reference) - Math.abs(right - reference) || left - right
  );
};

const append = (
  result: ResolvedDateCandidate[],
  month: number,
  day: number,
  year: Part | undefined,
  localePenalty: number,
  options: DateInputResolveOptions
): void =>
  yearsFor(year, options).forEach((resolvedYear) => {
    if (valid(resolvedYear, month, day)) {
      result.push({
        date: `${resolvedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as ResolvedDateCandidate["date"],
        localePenalty
      });
    }
  });

const extract = (
  tokens: DateInputToken[],
  vocabulary: DateInputVocabulary
): { parts: Part[]; month?: number } | null => {
  const values: Part[] = [];
  let month: number | undefined;
  for (const token of tokens) {
    if (token.type === "date-separator" && separator(token.value)) continue;
    if (token.type === "number") values.push({ value: Number(token.value), digits: token.value.length });
    else if (token.type === "word") {
      const word = normalizeDateInputWord(token.value);
      if (month !== undefined) return null;
      const resolvedMonth = vocabulary.months[word];
      if (resolvedMonth) month = resolvedMonth;
      else return null;
    } else return null;
  }
  return values.length ? { parts: values, month } : null;
};

const resolveNumeric = (parts: Part[], options: DateInputResolveOptions, result: ResolvedDateCandidate[]): void => {
  const first = parts[0];
  const second = parts[1];
  if (!first || !second || parts.length > 3) return;
  if (parts.length === 2) {
    const primary = dateOrder(options) === "mdy" ? [first, second] : [second, first];
    const fallback = dateOrder(options) === "mdy" ? [second, first] : [first, second];
    append(result, primary[0].value, primary[1].value, undefined, 0, options);
    append(result, fallback[0].value, fallback[1].value, undefined, 1, options);
    return;
  }
  const third = parts[2];
  const yearIndex = parts.findIndex((part) => part.digits === 4 || part.value > 31);
  if (yearIndex === 0) append(result, second.value, third.value, first, 0, options);
  else if (yearIndex === 1) {
    const primary = dateOrder(options) === "mdy" ? [first, third] : [third, first];
    const fallback = dateOrder(options) === "mdy" ? [third, first] : [first, third];
    append(result, primary[0].value, primary[1].value, second, 0, options);
    append(result, fallback[0].value, fallback[1].value, second, 1, options);
  } else if (dateOrder(options) === "ymd") append(result, second.value, third.value, first, 0, options);
  else {
    const primary = dateOrder(options) === "mdy" ? [first, second] : [second, first];
    const fallback = dateOrder(options) === "mdy" ? [second, first] : [first, second];
    append(result, primary[0].value, primary[1].value, third, 0, options);
    append(result, fallback[0].value, fallback[1].value, third, 1, options);
  }
};

export const resolveAbsoluteDateCandidates = (
  tokens: DateInputToken[],
  options: DateInputResolveOptions,
  vocabulary: DateInputVocabulary
): ResolvedDateCandidate[] => {
  const extracted = extract(tokens, vocabulary);
  if (!extracted) return [];
  const result: ResolvedDateCandidate[] = [];
  if (extracted.month) {
    if (extracted.parts.length === 1) append(result, extracted.month, extracted.parts[0].value, undefined, 0, options);
    if (extracted.parts.length === 2) {
      const [first, second] = extracted.parts;
      if (first.digits === 4 || first.value > 31) append(result, extracted.month, second.value, first, 0, options);
      else {
        append(result, extracted.month, first.value, second, 0, options);
        append(result, extracted.month, second.value, first, 1, options);
      }
    }
  } else resolveNumeric(extracted.parts, options, result);
  return [...new Map(result.map((candidate) => [candidate.date, candidate])).values()];
};
