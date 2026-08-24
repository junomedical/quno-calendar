import {
  fromIsoDate,
  addDays,
  compareDates,
  normalizeRange,
  toIsoDate,
  type DateRange,
  type IsoDate
} from "#quno-internal/shared/dateRangeModel";
import { parseDateInput, tokenizeDateInput } from "./dateInputParser";
import type { DateInputParseOptions, DateInputToken } from "./dateInputTypes";

type DatePart = "day" | "month" | "year";
export type DateInputSpinMemory = { key: string; offset: number };

type SpinResult = DateInputSpinMemory & { text: string; caret: number };

const unitOrder = ["day", "week", "month", "year"] as const;
const units: Record<string, (typeof unitOrder)[number]> = {
  day: "day",
  days: "day",
  week: "week",
  weeks: "week",
  month: "month",
  months: "month",
  year: "year",
  years: "year"
};

const tokenAt = (tokens: DateInputToken[], cursor: number): DateInputToken | undefined =>
  tokens
    .filter((token) => token.start <= cursor && cursor <= token.end)
    .find((token) => token.type !== "date-separator" && cursor < token.end) ??
  tokens
    .filter((token) => token.start <= cursor && cursor <= token.end)
    .find((token) => token.type !== "date-separator");

const replace = (text: string, token: DateInputToken, value: string, key: string, offset: number): SpinResult => ({
  text: `${text.slice(0, token.start)}${value}${text.slice(token.end)}`,
  caret: token.start + Math.min(offset, value.length),
  key,
  offset
});

const spinDuration = (
  text: string,
  token: DateInputToken,
  cursor: number,
  direction: number,
  tokens: DateInputToken[],
  memory?: DateInputSpinMemory
): SpinResult | null => {
  const unit = tokens.find((item) => item.type === "word" && units[item.value]);
  if (!unit) return null;
  if (token.type === "number") {
    const key = "duration:number";
    const offset = memory?.key === key ? memory.offset : cursor - token.start;
    return replace(text, token, String(Math.max(1, Number(token.value) + direction)), key, offset);
  }
  if (token !== unit) return null;
  const current = units[unit.value];
  const index = unitOrder.indexOf(current);
  const next = unitOrder[Math.max(0, Math.min(unitOrder.length - 1, index + direction))];
  const count = Number(tokens.find((item) => item.type === "number")?.value ?? 2);
  const key = "duration:unit";
  const offset = memory?.key === key ? memory.offset : cursor - token.start;
  return replace(text, unit, count === 1 ? next : `${next}s`, key, offset);
};

const partFor = (token: DateInputToken | undefined, date: IsoDate): DatePart => {
  if (!token || token.type === "date-separator") return "day";
  if (token.type === "word") return "month";
  const value = Number(token.value);
  if (token.value.length === 4 && value === Number(date.slice(0, 4))) return "year";
  if (value === Number(date.slice(5, 7)) && value !== Number(date.slice(8, 10))) return "month";
  return "day";
};

const shift = (date: IsoDate, part: DatePart, direction: number): IsoDate => {
  if (part === "day") return addDays(date, direction);
  const value = fromIsoDate(date);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  if (part === "month") value.setUTCMonth(value.getUTCMonth() + direction);
  else value.setUTCFullYear(value.getUTCFullYear() + direction);
  const last = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, last));
  return toIsoDate(value);
};

const targetFor = (
  tokens: DateInputToken[],
  date: IsoDate,
  part: DatePart,
  endpoint: "start" | "end"
): DateInputToken | undefined => {
  const divider = tokens.find((token) => token.type === "range-separator");
  const endpointTokens = divider
    ? tokens.filter((token) => (endpoint === "start" ? token.end <= divider.start : token.start >= divider.end))
    : tokens;
  const value =
    part === "year"
      ? date.slice(0, 4)
      : String(Number(date.slice(part === "month" ? 5 : 8, part === "month" ? 7 : 10)));
  const token =
    part === "month"
      ? (endpointTokens.find((item) => item.type === "word") ?? endpointTokens.find((item) => item.value === value))
      : endpointTokens.find((item) => item.value === value);
  return token;
};

export const spinDateInput = (
  text: string,
  cursor: number,
  direction: -1 | 1,
  options: DateInputParseOptions,
  format: (value: DateRange, preserveRange?: boolean) => string,
  memory?: DateInputSpinMemory
): SpinResult | null => {
  const parsed = parseDateInput(text, options);
  if (parsed.status !== "success") return null;
  const tokens = tokenizeDateInput(text);
  const current = tokenAt(tokens, cursor);
  const duration = current && spinDuration(text, current, cursor, direction, tokens, memory);
  if (duration) return duration;
  const divider = tokens.find((token) => token.type === "range-separator");
  const endpoint = divider && current && current.start >= divider.end ? "end" : "start";
  const original = parsed.value[endpoint];
  const part = partFor(current, original);
  const date = shift(original, part, direction);
  const start = endpoint === "start" ? date : parsed.value.start;
  const end = endpoint === "end" ? date : parsed.value.end;
  const value = divider
    ? normalizeRange(start, end)
    : parsed.value.start === parsed.value.end
      ? { start: date, end: date }
      : normalizeRange(start, end);
  const next = format(value, Boolean(divider && start === end));
  const crossed =
    endpoint === "start" ? compareDates(date, parsed.value.end) > 0 : compareDates(date, parsed.value.start) < 0;
  const targetEndpoint = crossed ? (endpoint === "start" ? "end" : "start") : endpoint;
  const previousKey = `${endpoint}:${part}`;
  const key = `${targetEndpoint}:${part}`;
  const offset = memory?.key === previousKey && current ? memory.offset : current ? cursor - current.start : 0;
  const target = targetFor(tokenizeDateInput(next), date, part, targetEndpoint);
  return {
    text: next,
    caret: (target?.start ?? next.length) + Math.min(offset, target?.value.length ?? 0),
    key,
    offset
  };
};
