import { useState } from "react";
import { singleDay, type DateRange } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerControllerOptions } from "./datePickerControllerTypes";

export function useDatePickerSelection({
  value,
  defaultValue,
  selectionMode,
  onChange
}: Pick<DatePickerControllerOptions, "value" | "defaultValue" | "selectionMode" | "onChange">) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const range = controlled ? (value ?? null) : internalValue;
  const selection = range && selectionMode === "single" ? singleDay({ date: range.start }) : range;
  const commit = ({ value: nextValue }: { value: DateRange | null }): void => {
    if (!controlled) setInternalValue(nextValue);
    onChange?.({ value: nextValue });
  };
  return { selection, commit };
}
