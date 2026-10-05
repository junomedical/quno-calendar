import { todayIso } from "#quno-internal/shared/dateRangeModel";
import { resolveAbsoluteDateCandidates } from "./dateInputAbsoluteResolver";
import { resolveRelativeDateRange } from "./dateInputRelativeResolver";
import { tokenizeDateTokens as tokenizeDateInput } from "./dateInputDateTokenizer";
import { pickBestDate, pickBestDateRange } from "./dateInputRanking";
import { createDateInputVocabulary, type DateInputVocabulary } from "./dateInputVocabulary";
import { endpointCandidates } from "./dateInputEndpoint";
import type {
  DateInputParseOptions,
  DateInputParseResult,
  DateInputResolveOptions,
  DateInputToken
} from "./dateInputTypes";

export { tokenizeDateInput };

const resolveOptions = (options: DateInputParseOptions): DateInputResolveOptions => ({
  ...options,
  referenceDate: options.referenceDate ?? todayIso(),
  weekStartsOn: options.weekStartsOn ?? 1,
  locale: options.locale ?? "en-GB",
  preferredDateOrder: options.preferredDateOrder ?? "locale",
  parserLanguages: options.parserLanguages?.length
    ? [...new Set(options.parserLanguages)]
    : [/^de\b/i.test(options.locale ?? "en-GB") ? "de" : "en"]
});

export type DateInputAnalysis = {
  tokens: DateInputToken[];
  result: DateInputParseResult;
};

export type DateInputAnalyzer = {
  analyze: (args: { text: string }) => DateInputAnalysis;
};

export const parseDateTokens = ({
  tokens,
  options,
  vocabulary
}: {
  tokens: DateInputToken[];
  options: DateInputResolveOptions;
  vocabulary: DateInputVocabulary;
}): DateInputParseResult => {
  if (!tokens.some((token) => token.type !== "date-separator")) return { status: "empty" };
  const divider = tokens.findIndex((token) => token.type === "range-separator");
  if (divider === -1) {
    const relative = resolveRelativeDateRange({ tokens, options, vocabulary });
    if (relative) return { status: "success", value: relative };
    const date = pickBestDate({ candidates: resolveAbsoluteDateCandidates({ tokens, options, vocabulary }), options });
    return date ? { status: "success", value: { start: date.date, end: date.date } } : { status: "invalid" };
  }
  if (tokens.slice(divider + 1).some((token) => token.type === "range-separator")) return { status: "invalid" };
  const firstCandidates = endpointCandidates({ tokens: tokens.slice(0, divider), options, vocabulary });
  const first = pickBestDate({ candidates: firstCandidates, options });
  if (!first) return { status: "invalid" };
  const rest = tokens.slice(divider + 1);
  if (!rest.some((token) => token.type !== "date-separator")) {
    return { status: "partial-range", value: { start: first.date, end: first.date } };
  }
  const secondCandidates = endpointCandidates({ tokens: rest, options, vocabulary });
  if (!secondCandidates.length) return { status: "invalid" };
  const value = pickBestDateRange({ starts: firstCandidates, ends: secondCandidates, options });
  return value ? { status: "success", value } : { status: "invalid" };
};

/** Compiles stable vocabulary while retaining a live default reference date. */
export const createDateInputAnalyzer = ({
  tokenize = tokenizeDateInput,
  parse = parseDateTokens,
  ...parseOptions
}: DateInputParseOptions & {
  tokenize?: (args: { text: string; recognizeTime?: boolean }) => DateInputToken[];
  parse?: (args: {
    tokens: DateInputToken[];
    options: DateInputResolveOptions;
    vocabulary: DateInputVocabulary;
  }) => DateInputParseResult;
}): DateInputAnalyzer => {
  const initialOptions = resolveOptions(parseOptions);
  const vocabulary = createDateInputVocabulary({
    languages: initialOptions.parserLanguages,
    extension: initialOptions.lexicon
  });
  return {
    analyze: ({ text }) => {
      const tokens = tokenize({ text: text.normalize("NFKC"), recognizeTime: parseOptions.recognizeTime });
      const options = parseOptions.referenceDate ? initialOptions : { ...initialOptions, referenceDate: todayIso() };
      const result = parse({ tokens, options, vocabulary });
      return {
        tokens,
        result:
          parseOptions.selectionMode === "single" &&
          result.status === "success" &&
          result.value.start !== result.value.end
            ? { status: "invalid" }
            : result
      };
    }
  };
};
