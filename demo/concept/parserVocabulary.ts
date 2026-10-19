import type { DateInputLexicon, DateInputToken } from "@quno/calendar/date-parser";
// The displayed vocabulary is also supplied to the public parser as consumer-owned aliases.
export const parserLexicon: DateInputLexicon = {
  monthNames: {
    1: ["january", "jan"],
    2: ["february", "feb"],
    3: ["march", "mar"],
    4: ["april", "apr"],
    5: ["may"],
    6: ["june", "jun"],
    7: ["july", "jul"],
    8: ["august", "aug"],
    9: ["september", "sep", "sept"],
    10: ["october", "oct"],
    11: ["november", "nov"],
    12: ["december", "dec"]
  },
  weekdayNames: {
    0: ["sunday", "sun"],
    1: ["monday", "mon"],
    2: ["tuesday", "tue", "tues"],
    3: ["wednesday", "wed"],
    4: ["thursday", "thu", "thur", "thurs"],
    5: ["friday", "fri"],
    6: ["saturday", "sat"]
  },
  today: ["today"],
  yesterday: ["yesterday"],
  tomorrow: ["tomorrow"],
  last: ["last"],
  previous: ["previous"],
  past: ["past"],
  next: ["next"],
  this: ["this"],
  ago: ["ago"],
  day: ["day"],
  days: ["days"],
  week: ["week"],
  weeks: ["weeks"],
  month: ["month"],
  months: ["months"],
  year: ["year"],
  years: ["years"]
};
const meanings = new Map<string, string>();
for (const [name, aliases] of Object.entries(parserLexicon)) {
  if (name === "monthNames" || name === "weekdayNames") {
    for (const words of Object.values(aliases as Record<string, string[]>))
      for (const word of words) meanings.set(word, name === "monthNames" ? "month name" : "weekday");
  } else {
    const unit = ["day", "days", "week", "weeks", "month", "months", "year", "years"].includes(name);
    const relativeDay = ["today", "yesterday", "tomorrow"].includes(name);
    for (const word of aliases as string[])
      meanings.set(word, unit ? `${name.replace(/s$/, "")} unit` : relativeDay ? "relative day" : "relative");
  }
}
export function tokenMeaning({
  token,
  clocks,
  previous,
  next
}: {
  token: DateInputToken;
  clocks: boolean;
  previous?: DateInputToken;
  next?: DateInputToken;
}) {
  if (token.raw === ":") return { label: "time separator", known: true };
  const number = Number(token.value);
  const count = next?.type === "word" && meanings.get(next.value)?.endsWith(" unit");
  const clockPart = previous?.raw === ":" || next?.raw === ":";
  if (token.type === "number" && number >= 61 && number <= 9999 && !count && !clockPart)
    return { label: "year", known: true };
  if (token.type !== "word")
    return { label: token.type.replace(/-/g, " "), known: token.type === "time" || token.type === "range-separator" };
  const label =
    meanings.get(token.value) ?? (clocks && ["at", "um"].includes(token.value) ? "time connector" : undefined);
  return { label: label ?? "unknown word", known: Boolean(label) };
}
