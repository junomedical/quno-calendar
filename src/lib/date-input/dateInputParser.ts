import { todayIso } from "#quno-internal/shared/dateRangeModel";
import { resolveAbsoluteDateCandidates } from "./dateInputAbsoluteResolver";
import { resolveRelativeDateRange } from "./dateInputRelativeResolver";
import { tokenizeDateInput } from "./dateInputTokenizer";
import { pickBestDate, pickBestDateRange } from "./dateInputRanking";
import { createDateInputVocabulary, type DateInputVocabulary } from "./dateInputVocabulary";
import type {
  DateInputParseOptions,
  DateInputParseResult,
  DateInputParserLanguage,
  DateInputResolveOptions,
  DateInputToken
} from "./dateInputTypes";

export { tokenizeDateInput };

const languagesFor = (
  locale: string,
  language?: DateInputParserLanguage,
  languages?: ReadonlyArray<DateInputParserLanguage>
): ReadonlyArray<DateInputParserLanguage> =>
  languages?.length ? [...new Set(languages)] : [language ?? (/^de\b/i.test(locale) ? "de" : "en")];

const resolveOptions = (options: DateInputParseOptions): DateInputResolveOptions => ({
  expectedRange: options.expectedRange,
  referenceDate: options.referenceDate ?? todayIso(),
  locale: options.locale ?? "en-GB",
  preferredDateOrder: options.preferredDateOrder ?? "locale",
  parserLanguages: languagesFor(options.locale ?? "en-GB", options.parserLanguage, options.parserLanguages),
  lexicon: options.lexicon
});

const hasMeaningful = (tokens: DateInputToken[]): boolean => tokens.some((token) => token.type !== "date-separator");

const endpointCandidates = (
  tokens: DateInputToken[],
  options: DateInputResolveOptions,
  vocabulary: DateInputVocabulary
) => {
  const relative = resolveRelativeDateRange(tokens, options, vocabulary);
  if (relative && relative.start === relative.end) return [{ date: relative.start, localePenalty: 0 }];
  return resolveAbsoluteDateCandidates(tokens, options, vocabulary);
};

const singleOnly = (
  result: DateInputParseResult,
  selectionMode: DateInputParseOptions["selectionMode"]
): DateInputParseResult =>
  selectionMode === "single" && result.status === "success" && result.value.start !== result.value.end
    ? { status: "invalid" }
    : result;

export const parseDateInput = (text: string, parseOptions: DateInputParseOptions): DateInputParseResult => {
  const tokens = tokenizeDateInput(text.normalize("NFKC"));
  if (!hasMeaningful(tokens)) return { status: "empty" };
  const options = resolveOptions(parseOptions);
  const vocabulary = createDateInputVocabulary(options.parserLanguages, options.lexicon);
  const divider = tokens.findIndex((token) => token.type === "range-separator");
  if (divider === -1) {
    const relative = resolveRelativeDateRange(tokens, options, vocabulary);
    if (relative) return singleOnly({ status: "success", value: relative }, parseOptions.selectionMode);
    const date = pickBestDate(resolveAbsoluteDateCandidates(tokens, options, vocabulary), options);
    return date ? { status: "success", value: { start: date.date, end: date.date } } : { status: "invalid" };
  }
  if (tokens.slice(divider + 1).some((token) => token.type === "range-separator")) return { status: "invalid" };
  const firstCandidates = endpointCandidates(tokens.slice(0, divider), options, vocabulary);
  const first = pickBestDate(firstCandidates, options);
  if (!first) return { status: "invalid" };
  const rest = tokens.slice(divider + 1);
  if (!hasMeaningful(rest))
    return singleOnly(
      { status: "partial-range", value: { start: first.date, end: first.date } },
      parseOptions.selectionMode
    );
  const secondCandidates = endpointCandidates(rest, options, vocabulary);
  if (!secondCandidates.length) return { status: "invalid" };
  const value = pickBestDateRange(firstCandidates, secondCandidates, options);
  return value ? singleOnly({ status: "success", value }, parseOptions.selectionMode) : { status: "invalid" };
};
