import type { DateRange, DateSelectionMode, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { FormEventHandler, InputHTMLAttributes } from "react";
import type {
  DateInputDateOrder,
  DateInputParserLanguage,
  DateInputLexicon
} from "#quno-internal/date-parser/dateInputTypes";
export type QunoDateInputLabels = {
  placeholder?: string;
};

export type QunoDateInputSlot = "root" | "input";

export type QunoDateInputClassNames = Partial<Record<QunoDateInputSlot, string>>;

export type QunoDateInputFormatters = {
  range: (args: { value: DateRange; locale: string }) => string;
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

  parserLanguages?: ReadonlyArray<DateInputParserLanguage>;
  labels?: Partial<QunoDateInputLabels>;
  formatters?: Partial<QunoDateInputFormatters>;
  lexicon?: Partial<DateInputLexicon>;
  classNames?: QunoDateInputClassNames;
  className?: string;
  placeholder?: string;
  onInput?: FormEventHandler<HTMLInputElement>;
  onChange?: (args: { value: DateRange | null }) => void;
};

export type { DateRange, IsoDate, WeekStart };
