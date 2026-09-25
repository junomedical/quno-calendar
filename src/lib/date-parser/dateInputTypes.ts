import type { DateRange, DateSelectionMode, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";

export type DateInputParserLanguage = "en" | "de";

export type DateInputDateOrder = "locale" | "dmy" | "mdy" | "ymd";

export type DateInputTokenType = "number" | "word" | "date-separator" | "range-separator";

export type DateInputToken = {
  type: DateInputTokenType;
  value: string;
  raw: string;
  start: number;
  end: number;
};

export type DateInputLexicon = {
  monthNames?: Partial<Record<number, ReadonlyArray<string>>>;
  weekdayNames?: Partial<Record<number, ReadonlyArray<string>>>;
  today?: ReadonlyArray<string>;
  yesterday?: ReadonlyArray<string>;
  tomorrow?: ReadonlyArray<string>;
  last?: ReadonlyArray<string>;
  previous?: ReadonlyArray<string>;
  past?: ReadonlyArray<string>;
  day?: ReadonlyArray<string>;
  days?: ReadonlyArray<string>;
  week?: ReadonlyArray<string>;
  weeks?: ReadonlyArray<string>;
  month?: ReadonlyArray<string>;
  months?: ReadonlyArray<string>;
  year?: ReadonlyArray<string>;
  years?: ReadonlyArray<string>;
  ago?: ReadonlyArray<string>;
  this?: ReadonlyArray<string>;
  next?: ReadonlyArray<string>;
};

export type DateInputParseOptions = {
  expectedRange: DateRange;
  selectionMode?: DateSelectionMode;
  referenceDate?: IsoDate;
  weekStartsOn?: WeekStart;
  locale?: string;
  preferredDateOrder?: DateInputDateOrder;

  parserLanguages?: ReadonlyArray<DateInputParserLanguage>;
  lexicon?: Partial<DateInputLexicon>;
};

export type DateInputResolveOptions = {
  expectedRange: DateRange;
  referenceDate: IsoDate;
  weekStartsOn: WeekStart;
  locale: string;
  preferredDateOrder: DateInputDateOrder;
  parserLanguages: ReadonlyArray<DateInputParserLanguage>;
  lexicon?: Partial<DateInputLexicon>;
};

export type DateInputParseErrorResult = {
  status: "invalid";
};

export type DateInputParseEmptyResult = {
  status: "empty";
};

export type DateInputParseSuccessResult = {
  status: "success";
  value: DateRange;
};

export type DateInputParsePartialRangeResult = {
  status: "partial-range";
  value: DateRange;
};

export type DateInputParseResult =
  | DateInputParseErrorResult
  | DateInputParseEmptyResult
  | DateInputParseSuccessResult
  | DateInputParsePartialRangeResult;

export type ResolvedDateCandidate = {
  date: IsoDate;
  localePenalty: number;
};
