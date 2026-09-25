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

const languagesFor = ({
  locale,
  languages
}: {
  locale: string;
  languages?: ReadonlyArray<DateInputParserLanguage>;
}): ReadonlyArray<DateInputParserLanguage> =>
  languages?.length ? [...new Set(languages)] : [/^de\b/i.test(locale) ? "de" : "en"];

const resolveOptions = (options: DateInputParseOptions): DateInputResolveOptions => ({
  expectedRange: options.expectedRange,
  referenceDate: options.referenceDate ?? todayIso(),
  weekStartsOn: options.weekStartsOn ?? 1,
  locale: options.locale ?? "en-GB",
  preferredDateOrder: options.preferredDateOrder ?? "locale",
  parserLanguages: languagesFor({ locale: options.locale ?? "en-GB", languages: options.parserLanguages }),
  lexicon: options.lexicon
});

const hasMeaningful = ({ tokens }: { tokens: DateInputToken[] }): boolean =>
  tokens.some((token) => token.type !== "date-separator");

const endpointCandidates = ({
  tokens,
  options,
  vocabulary
}: {
  tokens: DateInputToken[];
  options: DateInputResolveOptions;
  vocabulary: DateInputVocabulary;
}) => {
  const relative = resolveRelativeDateRange({ tokens, options, vocabulary });
  if (relative && relative.start === relative.end) return [{ date: relative.start, localePenalty: 0 }];
  return resolveAbsoluteDateCandidates({ tokens, options, vocabulary });
};

const singleOnly = ({
  result,
  selectionMode
}: {
  result: DateInputParseResult;
  selectionMode: DateInputParseOptions["selectionMode"];
}): DateInputParseResult =>
  selectionMode === "single" && result.status === "success" && result.value.start !== result.value.end
    ? { status: "invalid" }
    : result;

export type DateInputAnalysis = {
  tokens: DateInputToken[];
  result: DateInputParseResult;
};

export type DateInputAnalyzer = {
  analyze: (args: { text: string }) => DateInputAnalysis;
};

const parseTokens = ({
  tokens,
  options,
  vocabulary,
  selectionMode
}: {
  tokens: DateInputToken[];
  options: DateInputResolveOptions;
  vocabulary: DateInputVocabulary;
  selectionMode: DateInputParseOptions["selectionMode"];
}): DateInputParseResult => {
  if (!hasMeaningful({ tokens })) return { status: "empty" };
  const divider = tokens.findIndex((token) => token.type === "range-separator");
  if (divider === -1) {
    const relative = resolveRelativeDateRange({ tokens, options, vocabulary });
    if (relative) return singleOnly({ result: { status: "success", value: relative }, selectionMode });
    const date = pickBestDate({ candidates: resolveAbsoluteDateCandidates({ tokens, options, vocabulary }), options });
    return date ? { status: "success", value: { start: date.date, end: date.date } } : { status: "invalid" };
  }
  if (tokens.slice(divider + 1).some((token) => token.type === "range-separator")) return { status: "invalid" };
  const firstCandidates = endpointCandidates({ tokens: tokens.slice(0, divider), options, vocabulary });
  const first = pickBestDate({ candidates: firstCandidates, options });
  if (!first) return { status: "invalid" };
  const rest = tokens.slice(divider + 1);
  if (!hasMeaningful({ tokens: rest })) {
    return singleOnly({
      result: { status: "partial-range", value: { start: first.date, end: first.date } },
      selectionMode
    });
  }
  const secondCandidates = endpointCandidates({ tokens: rest, options, vocabulary });
  if (!secondCandidates.length) return { status: "invalid" };
  const value = pickBestDateRange({ starts: firstCandidates, ends: secondCandidates, options });
  return value ? singleOnly({ result: { status: "success", value }, selectionMode }) : { status: "invalid" };
};

/** Compiles stable vocabulary while retaining a live default reference date. */
export const createDateInputAnalyzer = (parseOptions: DateInputParseOptions): DateInputAnalyzer => {
  const initialOptions = resolveOptions(parseOptions);
  const vocabulary = createDateInputVocabulary({
    languages: initialOptions.parserLanguages,
    extension: initialOptions.lexicon
  });
  return {
    analyze: ({ text }) => {
      const tokens = tokenizeDateInput({ text: text.normalize("NFKC") });
      const options = parseOptions.referenceDate ? initialOptions : { ...initialOptions, referenceDate: todayIso() };
      return {
        tokens,
        result: parseTokens({ tokens, options, vocabulary, selectionMode: parseOptions.selectionMode })
      };
    }
  };
};

export const parseDateInput = ({
  text,
  ...parseOptions
}: { text: string } & DateInputParseOptions): DateInputParseResult =>
  createDateInputAnalyzer(parseOptions).analyze({ text }).result;
