import {
  compareDates,
  differenceInDays,
  normalizeRange,
  type DateRange,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import type { DateInputResolveOptions, ResolvedDateCandidate } from "./dateInputTypes";

const contains = (date: IsoDate, range: DateRange): boolean =>
  compareDates(date, range.start) >= 0 && compareDates(date, range.end) <= 0;

const compareCandidates = (
  left: ResolvedDateCandidate,
  right: ResolvedDateCandidate,
  options: DateInputResolveOptions
): number => {
  const leftInside = contains(left.date, options.expectedRange);
  const rightInside = contains(right.date, options.expectedRange);
  if (leftInside !== rightInside) return leftInside ? -1 : 1;
  if (left.localePenalty !== right.localePenalty) return left.localePenalty - right.localePenalty;
  const leftDistance = Math.abs(differenceInDays(left.date, options.referenceDate));
  const rightDistance = Math.abs(differenceInDays(right.date, options.referenceDate));
  return leftDistance - rightDistance || compareDates(left.date, right.date);
};

export const pickBestDate = (
  candidates: ResolvedDateCandidate[],
  options: DateInputResolveOptions
): ResolvedDateCandidate | null =>
  candidates.reduce<ResolvedDateCandidate | null>(
    (best, candidate) => (!best || compareCandidates(candidate, best, options) < 0 ? candidate : best),
    null
  );

const rangeInside = (value: DateRange, expected: DateRange): boolean =>
  contains(value.start, expected) && contains(value.end, expected);

export const pickBestDateRange = (
  starts: ResolvedDateCandidate[],
  ends: ResolvedDateCandidate[],
  options: DateInputResolveOptions
): DateRange | null => {
  let best: { value: DateRange; penalty: number } | null = null;
  for (const start of starts)
    for (const end of ends) {
      const candidate = {
        value: normalizeRange(start.date, end.date),
        penalty: start.localePenalty + end.localePenalty
      };
      if (!best || compareRangeCandidates(candidate, best, options) < 0) best = candidate;
    }
  return best?.value ?? null;
};

const compareRangeCandidates = (
  left: { value: DateRange; penalty: number },
  right: { value: DateRange; penalty: number },
  options: DateInputResolveOptions
): number => {
  const leftInside = rangeInside(left.value, options.expectedRange);
  const rightInside = rangeInside(right.value, options.expectedRange);
  if (leftInside !== rightInside) return leftInside ? -1 : 1;
  if (left.penalty !== right.penalty) return left.penalty - right.penalty;
  const leftDistance = Math.min(
    Math.abs(differenceInDays(left.value.start, options.referenceDate)),
    Math.abs(differenceInDays(left.value.end, options.referenceDate))
  );
  const rightDistance = Math.min(
    Math.abs(differenceInDays(right.value.start, options.referenceDate)),
    Math.abs(differenceInDays(right.value.end, options.referenceDate))
  );
  return (
    leftDistance - rightDistance ||
    compareDates(left.value.start, right.value.start) ||
    compareDates(left.value.end, right.value.end)
  );
};
