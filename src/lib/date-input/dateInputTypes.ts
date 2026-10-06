import type { DateRange, DateSelectionMode, IsoDate, WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { FormEventHandler, InputHTMLAttributes } from "react";
import type { DateTimeSelectionChange, TimeSelectionOptions } from "#quno-internal/shared/clockTime";
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
  time?: (args: { time: string; locale: string }) => string;
};

export type QunoDateInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "placeholder" | "className"
> &
  TimeSelectionOptions & {
    value?: DateRange | null;
    defaultValue?: DateRange | null;
    expectedRange: DateRange;
    selectionMode?: DateSelectionMode;
    referenceDate?: IsoDate;
    weekStartsOn?: WeekStart;
    locale?: string;
    preferredDateOrder?: DateInputDateOrder;
    /** Enforce enabledHours and minuteCadence on typed clocks; defaults to false. */
    forceCadence?: boolean;

    parserLanguages?: ReadonlyArray<DateInputParserLanguage>;
    labels?: Partial<QunoDateInputLabels>;
    formatters?: Partial<QunoDateInputFormatters>;
    lexicon?: Partial<DateInputLexicon>;
    classNames?: QunoDateInputClassNames;
    className?: string;
    placeholder?: string;
    onInput?: FormEventHandler<HTMLInputElement>;
    onChange?: (args: DateTimeSelectionChange) => void;
  };

export type { DateRange, IsoDate, WeekStart };
