import { clockToken } from "./dateInputClock";
import { endpointCandidates, type DateEndpointContext } from "./dateInputEndpoint";
import type { DateInputToken, ResolvedDateCandidate } from "./dateInputTypes";

export type TimeEndpoint = { candidates: ResolvedDateCandidate[]; time: string | null };

const whitespace = (token: DateInputToken): boolean => token.type === "date-separator" && /^\s+$/u.test(token.value);
const connector = (token: DateInputToken): boolean => token.type === "word" && /^(at|um)$/.test(token.value);

export const trimTimeWhitespace = ({ tokens }: { tokens: DateInputToken[] }): DateInputToken[] => {
  let start = 0,
    end = tokens.length;
  while (start < end && whitespace(tokens[start])) start++;
  while (end > start && whitespace(tokens[end - 1])) end--;
  return tokens.slice(start, end);
};

const withoutClock = ({ tokens, index }: { tokens: DateInputToken[]; index: number }): DateInputToken[] | null => {
  if (tokens.length === 1) return [];
  if (index === 0) return withoutClock({ tokens: [...tokens].reverse(), index: tokens.length - 1 })?.reverse() ?? null;
  if (!whitespace(tokens[index - 1])) return null;
  let date = trimTimeWhitespace({ tokens: tokens.slice(0, -1) });
  if (date.length && connector(date[date.length - 1])) {
    if (date.length < 3 || !whitespace(date[date.length - 2])) return null;
    date = trimTimeWhitespace({ tokens: date.slice(0, -1) });
  }
  return date;
};

export const resolveTimeEndpoint = (context: DateEndpointContext): TimeEndpoint | null => {
  const tokens = trimTimeWhitespace({ tokens: context.tokens });
  const candidates = endpointCandidates({ ...context, tokens });
  if (candidates.length) return { candidates, time: null };
  const indexes = [tokens.length - 1, 0];
  for (const index of indexes) {
    const token = tokens[index];
    if (!token || (token.type !== "time" && token.type !== "number")) continue;
    const time = token.type === "time" ? token.value : clockToken({ text: token.value, start: 0, bare: true })?.value;
    if (!time) continue;
    const date = withoutClock({ tokens, index });
    if (!date) continue;
    const candidates = date.length ? endpointCandidates({ ...context, tokens: date }) : [];
    if (!date.length || candidates.length) return { candidates, time };
  }
  return null;
};
