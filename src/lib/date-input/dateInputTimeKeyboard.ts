import { clockTimeIsEnabled, type TimeSelectionOptions } from "#quno-internal/shared/clockTime";
import type { DateInputToken } from "#quno-internal/date-parser/dateInputTypes";

export function spinClockInput({
  text,
  tokens,
  cursor,
  direction,
  enabledHours,
  minuteCadence = 15
}: {
  text: string;
  tokens: DateInputToken[];
  cursor: number;
  direction: -1 | 1;
} & Pick<TimeSelectionOptions, "enabledHours" | "minuteCadence">) {
  const token = tokens.find((token) => token.type === "time" && token.start <= cursor && cursor <= token.end);
  if (!token) return null;
  const minutePart = token.raw.includes(":") && cursor > token.start + token.raw.indexOf(":");
  const unit = minutePart ? minuteCadence : 60;
  const original = Number(token.value.slice(0, 2)) * 60 + Number(token.value.slice(3));
  const base = minutePart
    ? (direction === 1 ? Math.floor(original / unit) : Math.ceil(original / unit)) * unit
    : original;
  let clock = token.value;
  for (let step = 1; step <= 1440 / unit; step++) {
    const total = (base + direction * step * unit + 1440) % 1440;
    const candidate = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    if (clockTimeIsEnabled({ time: candidate, enabledHours, minuteCadence })) {
      clock = candidate;
      break;
    }
  }
  return {
    text: `${text.slice(0, token.start)}${clock}${text.slice(token.end)}`,
    caret: token.start + (minutePart ? 4 : 1),
    key: "clock",
    offset: minutePart ? 4 : 1
  };
}
