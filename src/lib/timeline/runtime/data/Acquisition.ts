import { addDays, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarEvent, LoadEvents } from "#quno-internal/timeline/core/types";
import { EventRepository } from "./EventRepository";
import { contiguousRanges, coversResources, type RangeRequest } from "./requests";

export type RequestClock = {
  delay: (args: { milliseconds: number; signal: AbortSignal }) => Promise<boolean>;
};

/** Request generations and coverage are independent of React and geometry revisions. */
export class Acquisition {
  readonly repository = new EventRepository();
  private generation = 0;
  private sequence = 0;
  private requests = new Map<number, RangeRequest>();
  private coverage = new Map<IsoDate, readonly string[]>();
  private dates: readonly IsoDate[] = [];
  private calendarIds: readonly string[] = [];

  invalidate() {
    this.generation++;
    this.cancelAll();
    this.coverage.clear();
  }

  plan({ dates, calendarIds }: { dates: readonly IsoDate[]; calendarIds: readonly string[] }): readonly RangeRequest[] {
    this.dates = dates;
    this.calendarIds = calendarIds;
    this.repository.touch({ dates });
    const usefulDates = new Set(
      dates.flatMap((date) => [date, addDays({ date, amount: -1 }), addDays({ date, amount: 1 })])
    );
    for (const request of this.requests.values())
      if (
        !calendarIds.length ||
        !coversResources({ available: request.calendarIds, required: calendarIds }) ||
        !request.dates.some((date) => usefulDates.has(date))
      )
        this.cancel({ request });
    if (!calendarIds.length) return [];
    const missing = dates.filter(
      (date) =>
        !coversResources({ available: this.coverage.get(date) ?? [], required: calendarIds }) &&
        ![...this.requests.values()].some(
          (request) =>
            request.dates.includes(date) && coversResources({ available: request.calendarIds, required: calendarIds })
        )
    );
    return contiguousRanges({ dates: missing }).map((range) => {
      const request = {
        id: ++this.sequence,
        generation: this.generation,
        dates: range,
        calendarIds: [...calendarIds],
        controller: new AbortController()
      };
      this.requests.set(request.id, request);
      return request;
    });
  }

  accept({ request, events }: { request: RangeRequest; events: readonly CalendarEvent[] }): boolean {
    if (!this.isCurrent({ request })) return false;
    this.repository.replace({ dates: request.dates, events });
    for (const date of request.dates) this.coverage.set(date, request.calendarIds);
    this.repository.touch({ dates: this.dates });
    for (const date of this.repository.trim({ protectedDates: new Set(this.dates) })) this.coverage.delete(date);
    this.requests.delete(request.id);
    return true;
  }

  async execute({
    request,
    loadEvents,
    clock
  }: {
    request: RangeRequest;
    loadEvents: LoadEvents;
    clock: RequestClock;
  }): Promise<boolean> {
    const signal = request.controller.signal;
    for (const milliseconds of [0, 250, 1000]) {
      if (!this.isCurrent({ request })) return false;
      if (milliseconds && !(await clock.delay({ milliseconds, signal }))) return false;
      if (!this.isCurrent({ request })) return false;
      try {
        const events = await loadEvents({
          startDate: request.dates[0],
          endDate: request.dates[request.dates.length - 1],
          calendarIds: [...request.calendarIds],
          signal
        });
        return this.accept({ request, events });
      } catch {
        if (signal.aborted) return false;
      }
    }
    this.requests.delete(request.id);
    return false;
  }

  dispose() {
    this.generation++;
    this.cancelAll();
  }

  private isCurrent({ request }: { request: RangeRequest }): boolean {
    return (
      this.requests.get(request.id) === request &&
      !request.controller.signal.aborted &&
      request.generation === this.generation &&
      coversResources({ available: request.calendarIds, required: this.calendarIds })
    );
  }

  private cancel({ request }: { request: RangeRequest }) {
    request.controller.abort();
    this.requests.delete(request.id);
  }

  private cancelAll() {
    for (const request of this.requests.values()) this.cancel({ request });
  }
}
