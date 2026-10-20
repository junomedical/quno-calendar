import type { IsoDate } from "@quno/calendar";
import type { CalendarEvent } from "@quno/calendar/infinite-calendar";
import { clock, colors, daytimeTitles } from "./calendarFixtures";

/** A seeded shuffle gives each date a varied schedule without changing it on replay. */
export function densityEvents({ date }: { date: IsoDate }): CalendarEvent[] {
  let seed = Number(date.replace(/-/g, ""));
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const offset = Math.floor(random() * 4);
  return Array.from({ length: 60 }, (_, index) => {
    const resource = index % 4;
    const band = (resource + Math.floor(index / 4) + offset) % 4;
    const minute = 480 + band * 150 + Math.floor(random() * 30) * 5;
    return {
      id: `${date}-density-${index}`,
      calendarId: `person-${resource}`,
      title: daytimeTitles[Math.floor(random() * daytimeTitles.length)],
      start: `${date}T${clock(minute)}`,
      end: `${date}T${clock(minute + 60)}`,
      color: colors[resource]
    };
  });
}
