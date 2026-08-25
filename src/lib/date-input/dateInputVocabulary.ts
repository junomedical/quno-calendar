import { DATE_INPUT_LEXICON } from "./dateInputLexicon";
import type { DateInputLexicon, DateInputParserLanguage } from "./dateInputTypes";

type RelativeWord = Exclude<keyof DateInputLexicon, "monthNames" | "weekdayNames" | "datePartMarkers">;

export type DateInputVocabulary = {
  months: Record<string, number>;
  weekdays: Record<string, number>;
  datePartMarkers: string[];
  words: Partial<Record<RelativeWord, string[]>>;
};

export const normalizeDateInputWord = (word: string): string =>
  word.normalize("NFKD").replace(/\p{M}/gu, "").replace(/\.$/u, "").toLowerCase();

const addWords = (vocabulary: DateInputVocabulary, lexicon: Partial<DateInputLexicon>): void => {
  Object.entries(lexicon.monthNames ?? {}).forEach(([month, aliases]) =>
    aliases?.forEach((alias) => {
      vocabulary.months[normalizeDateInputWord(alias)] = Number(month);
    })
  );
  Object.entries(lexicon.weekdayNames ?? {}).forEach(([weekday, aliases]) =>
    aliases?.forEach((alias) => {
      vocabulary.weekdays[normalizeDateInputWord(alias)] = Number(weekday);
    })
  );
  lexicon.datePartMarkers?.forEach((marker) => vocabulary.datePartMarkers.push(normalizeDateInputWord(marker)));
  Object.entries(lexicon).forEach(([name, aliases]) => {
    if (name !== "monthNames" && name !== "weekdayNames" && name !== "datePartMarkers")
      (aliases as ReadonlyArray<string>)?.forEach((word) => {
        const words = vocabulary.words[name as RelativeWord] ?? [];
        words.push(normalizeDateInputWord(word));
        vocabulary.words[name as RelativeWord] = words;
      });
  });
};

export const createDateInputVocabulary = (
  languages: ReadonlyArray<DateInputParserLanguage>,
  extension?: Partial<DateInputLexicon>
): DateInputVocabulary => {
  const vocabulary: DateInputVocabulary = { months: {}, weekdays: {}, datePartMarkers: [], words: {} };
  languages.forEach((language) => addWords(vocabulary, DATE_INPUT_LEXICON[language]));
  if (extension) addWords(vocabulary, extension);
  return vocabulary;
};

export const hasDateInputWord = (vocabulary: DateInputVocabulary, name: RelativeWord, value: string): boolean =>
  vocabulary.words[name]?.includes(value) ?? false;
