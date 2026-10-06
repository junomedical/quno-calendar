import type { DateInputToken } from "./dateInputTypes";

export const clockToken = ({
  text,
  start,
  bare = false
}: {
  text: string;
  start: number;
  bare?: boolean;
}): DateInputToken | null => {
  const match = /^(\d{1,2})(?::(\d{2}))?(?:\s*([ap]m))?(?![\p{L}\p{M}\d:])/iu.exec(text.slice(start));
  if (!match || (!match[2] && !match[3] && !bare)) return null;
  const hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase();
  if ((meridiem ? hour < 1 || hour > 12 : hour > 23) || Number(minute) > 59) return null;
  const hours = meridiem ? (hour % 12) + (meridiem === "pm" ? 12 : 0) : hour;
  const value = `${String(hours).padStart(2, "0")}:${minute}`;
  return { type: "time", value, raw: match[0], start, end: start + match[0].length };
};
