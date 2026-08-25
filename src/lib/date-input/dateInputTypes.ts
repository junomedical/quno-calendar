import type { DateRange, DateSelectionMode, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { FormEventHandler, InputHTMLAttributes } from "react";

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
  datePartMarkers?: ReadonlyArray<string>;
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
  parserLanguage?: DateInputParserLanguage;
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

export type DateInputRangeFormatter = (value: DateRange, locale: string) => string;

export type DateInputFormatter = {
  range: DateInputRangeFormatter;
};

export type QunoDateInputLabels = {
  placeholder?: string;
};

export type QunoDateInputSlot = "root" | "input";

export type QunoDateInputClassNames = Partial<Record<QunoDateInputSlot, string>>;

export type QunoDateInputFormatter = {
  range: (value: DateRange, locale: string) => string;
};

export type QunoDateInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "placeholder" | "className"
> & {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  expectedRange: DateRange;
  selectionMode?: DateSelectionMode;
  referenceDate?: IsoDate;
  weekStartsOn?: WeekStart;
  locale?: string;
  preferredDateOrder?: DateInputDateOrder;
  parserLanguage?: DateInputParserLanguage;
  parserLanguages?: ReadonlyArray<DateInputParserLanguage>;
  labels?: Partial<QunoDateInputLabels>;
  formatter?: QunoDateInputFormatter;
  lexicon?: Partial<DateInputLexicon>;
  classNames?: QunoDateInputClassNames;
  className?: string;
  placeholder?: string;
  onInput?: FormEventHandler<HTMLInputElement>;
  onChange?: (value: DateRange | null) => void;
};

export type { DateRange, IsoDate, WeekStart };
