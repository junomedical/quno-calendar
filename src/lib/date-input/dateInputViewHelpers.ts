import type { DateRange } from "#quno-internal/shared/dateRangeModel";
import { parseDateInput } from "./dateInputParser";

export const equalDateRanges = (left: DateRange | null, right: DateRange | null): boolean =>
  left === right || Boolean(left && right && left.start === right.start && left.end === right.end);

export const inputClass = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(" ");

export const recognitionOf = (result: ReturnType<typeof parseDateInput>) => {
  if (result.status === "empty") return undefined;
  return result.status === "success" || result.status === "partial-range" ? "recognized" : "unrecognized";
};
