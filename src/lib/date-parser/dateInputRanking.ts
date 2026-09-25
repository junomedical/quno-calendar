import {
  compareDates,
  differenceInDays,
  normalizeRange,
  type DateRange,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import type { DateInputResolveOptions, ResolvedDateCandidate } from "./dateInputTypes";

const contains = ({ date, range }: { date: IsoDate; range: DateRange }): boolean =>
  compareDates({ left: date, right: range.start }) >= 0 && compareDates({ left: date, right: range.end }) <= 0;

const compareCandidates = ({
  left,
  right,
  options
}: {
  left: ResolvedDateCandidate;
  right: ResolvedDateCandidate;
  options: DateInputResolveOptions;
}): number => {
  const leftInside = contains({ date: left.date, range: options.expectedRange });
  const rightInside = contains({ date: right.date, range: options.expectedRange });
  if (leftInside !== rightInside) return leftInside ? -1 : 1;
  if (left.localePenalty !== right.localePenalty) return left.localePenalty - right.localePenalty;
  const leftDistance = Math.abs(differenceInDays({ left: left.date, right: options.referenceDate }));
  const rightDistance = Math.abs(differenceInDays({ left: right.date, right: options.referenceDate }));
  return leftDistance - rightDistance || compareDates({ left: left.date, right: right.date });
};

export const pickBestDate = ({
  candidates,
  options
}: {
  candidates: ResolvedDateCandidate[];
  options: DateInputResolveOptions;
}): ResolvedDateCandidate | null =>
  candidates.reduce<ResolvedDateCandidate | null>(
    (best, candidate) => (!best || compareCandidates({ left: candidate, right: best, options }) < 0 ? candidate : best),
    null
  );

const rangeInside = ({ value, expected }: { value: DateRange; expected: DateRange }): boolean =>
  contains({ date: value.start, range: expected }) && contains({ date: value.end, range: expected });

export const pickBestDateRange = ({
  starts,
  ends,
  options
}: {
  starts: ResolvedDateCandidate[];
  ends: ResolvedDateCandidate[];
  options: DateInputResolveOptions;
}): DateRange | null => {
  let best: { value: DateRange; penalty: number } | null = null;
  for (const start of starts)
    for (const end of ends) {
      const candidate = {
        value: normalizeRange({ first: start.date, second: end.date }),
        penalty: start.localePenalty + end.localePenalty
      };
      if (!best || compareRangeCandidates({ left: candidate, right: best, options }) < 0) best = candidate;
    }
  return best?.value ?? null;
};

const compareRangeCandidates = ({
  left,
  right,
  options
}: {
  left: { value: DateRange; penalty: number };
  right: { value: DateRange; penalty: number };
  options: DateInputResolveOptions;
}): number => {
  const leftInside = rangeInside({ value: left.value, expected: options.expectedRange });
  const rightInside = rangeInside({ value: right.value, expected: options.expectedRange });
  if (leftInside !== rightInside) return leftInside ? -1 : 1;
  if (left.penalty !== right.penalty) return left.penalty - right.penalty;
  const leftDistance = Math.min(
    Math.abs(differenceInDays({ left: left.value.start, right: options.referenceDate })),
    Math.abs(differenceInDays({ left: left.value.end, right: options.referenceDate }))
  );
  const rightDistance = Math.min(
    Math.abs(differenceInDays({ left: right.value.start, right: options.referenceDate })),
    Math.abs(differenceInDays({ left: right.value.end, right: options.referenceDate }))
  );
  return (
    leftDistance - rightDistance ||
    compareDates({ left: left.value.start, right: right.value.start }) ||
    compareDates({ left: left.value.end, right: right.value.end })
  );
};
