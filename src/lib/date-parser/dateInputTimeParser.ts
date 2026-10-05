import { addDays, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { parseDateTokens } from "./dateInputDateParser";
import type { DateEndpointContext } from "./dateInputEndpoint";
import { pickBestDate, pickBestDateEndpoints } from "./dateInputRanking";
import { resolveTimeEndpoint, trimTimeWhitespace, type TimeEndpoint } from "./dateInputTimeEndpoint";
import type { DateInputParseResult, DateInputResolveOptions } from "./dateInputTypes";

const endpointPair = ({
  first,
  second,
  options
}: {
  first: TimeEndpoint;
  second: TimeEndpoint;
  options: DateInputResolveOptions;
}): { start: IsoDate; end: IsoDate } => {
  if (first.candidates.length && second.candidates.length) {
    const pair = pickBestDateEndpoints({ starts: first.candidates, ends: second.candidates, options })!;
    return { start: pair.start.date, end: pair.end.date };
  }
  const candidates = first.candidates.length ? first.candidates : second.candidates;
  const date = pickBestDate({ candidates, options })?.date ?? options.referenceDate;
  return { start: date, end: date };
};

export const parseTimeInput = ({ tokens, options, vocabulary }: DateEndpointContext): DateInputParseResult => {
  const dateResult = parseDateTokens({ tokens, options, vocabulary });
  if (!tokens.some((token) => token.type === "time") && dateResult.status !== "invalid") return dateResult;
  const divider = tokens.findIndex((token) => token.type === "range-separator");
  if (divider !== -1 && tokens.slice(divider + 1).some((token) => token.type === "range-separator"))
    return { status: "invalid" };
  const first = resolveTimeEndpoint({
    tokens: divider === -1 ? tokens : tokens.slice(0, divider),
    options,
    vocabulary
  });
  if (!first) return { status: "invalid" };
  const rest = divider === -1 ? tokens : tokens.slice(divider + 1);
  const partial = divider !== -1 && !trimTimeWhitespace({ tokens: rest }).length;
  const second = partial
    ? { ...first, time: null }
    : divider === -1
      ? first
      : resolveTimeEndpoint({ tokens: rest, options, vocabulary });
  if (!second) return { status: "invalid" };
  const pair = endpointPair({ first, second, options });
  if (!second.candidates.length && first.time && second.time && second.time < first.time) {
    pair.end = addDays({ date: pair.end, amount: 1 });
  }
  const swap =
    pair.start > pair.end || (pair.start === pair.end && first.time && second.time && first.time > second.time);
  return {
    status: partial ? "partial-range" : "success",
    value: swap ? { start: pair.end, end: pair.start } : pair,
    times: swap ? { start: second.time, end: first.time } : { start: first.time, end: second.time }
  };
};
