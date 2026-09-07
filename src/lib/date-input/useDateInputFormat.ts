import { useCallback } from "react";
import type { DateRange } from "#quno-internal/shared/dateRangeModel";
import type { QunoDateInputFormatters } from "./dateInputTypes";
import { DEFAULT_DATE_INPUT_FORMATTER } from "./dateInputFormat";

export function useDateInputFormat({
  formatters,
  locale
}: {
  formatters?: Partial<QunoDateInputFormatters>;
  locale: string;
}) {
  return useCallback(
    ({ value: range, preserveRange = false }: { value: DateRange; preserveRange?: boolean }): string => {
      const value = (formatters?.range ?? DEFAULT_DATE_INPUT_FORMATTER)({ value: range, locale });
      return preserveRange && range.start === range.end ? `${value} – ${value}` : value;
    },
    [formatters, locale]
  );
}
