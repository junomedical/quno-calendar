import type { DateRange } from "#quno-internal/shared/dateRangeModel";
import { parseDateInput } from "#quno-internal/date-parser/dateInputParser";

export const equalDateRanges = ({ left, right }: { left: DateRange | null; right: DateRange | null }): boolean =>
  left === right || Boolean(left && right && left.start === right.start && left.end === right.end);

export const recognitionOf = (result: ReturnType<typeof parseDateInput>) => {
  if (result.status === "empty") return undefined;
  return result.status === "success" || result.status === "partial-range" ? "recognized" : "unrecognized";
};
