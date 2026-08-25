import type { CalendarId } from "#quno-internal/timeline/core/types";

export function calendarIdsCover(available: ReadonlySet<CalendarId>, required: ReadonlySet<CalendarId>): boolean {
  for (const calendarId of required) {
    if (!available.has(calendarId)) return false;
  }
  return true;
}

/** Tracks which calendar selection each accepted date bucket can satisfy. */
export class DateCalendarCoverage {
  private readonly calendarIdsByDate = new Map<string, Set<CalendarId>>();

  clear(): void {
    this.calendarIdsByDate.clear();
  }

  covers(dateKey: string, calendarIds: ReadonlySet<CalendarId>): boolean {
    const coveredCalendarIds = this.calendarIdsByDate.get(dateKey);
    return Boolean(coveredCalendarIds && calendarIdsCover(coveredCalendarIds, calendarIds));
  }

  replace(dateKeys: Iterable<string>, calendarIds: ReadonlySet<CalendarId>): void {
    for (const dateKey of dateKeys) {
      this.calendarIdsByDate.set(dateKey, new Set(calendarIds));
    }
  }

  delete(dateKeys: Iterable<string>): void {
    for (const dateKey of dateKeys) this.calendarIdsByDate.delete(dateKey);
  }
}
