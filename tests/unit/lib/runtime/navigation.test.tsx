import "#quno-tests/unit/lib/infinite/calendarViewport";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { expect, it } from "vitest";
import { QunoInfiniteCalendar, type QunoInfiniteCalendarHandle } from "@quno/calendar/infinite-calendar";

for (const view of ["infinite-horizontal", "infinite-vertical"] as const) {
  it(`${view} places requested time beneath chrome and Today uses the supplied clock`, () => {
    const ref = createRef<QunoInfiniteCalendarHandle>();
    render(
      <QunoInfiniteCalendar
        ref={ref}
        view={view}
        calendars={[{ id: "one", name: "One" }]}
        selectedCalendarIds={["one"]}
        initialDateKey="2026-07-04"
        now={new Date("2026-07-04T09:30:00")}
        settings={{ startHour: 8, endHour: 18, zoom: 2, excludedWeekdays: [] }}
        loadEvents={async () => []}
        renderEvent={({ event }) => <span>{event.title}</span>}
      />
    );
    const viewport = screen
      .getByTestId("quno-calendar-timeline")
      .querySelector<HTMLElement>(".quno-calendar-viewport")!;
    const offset = (date: string) =>
      view === "infinite-horizontal"
        ? viewport.scrollLeft
        : viewport.scrollTop -
          Number.parseFloat(viewport.querySelector<HTMLElement>(`.quno-calendar-day[data-date="${date}"]`)!.style.top);
    act(() => ref.current!.scrollToDateTime({ date: "2026-07-05", time: "11:00" }));
    expect(offset("2026-07-05")).toBe(8 + 180 * 2 - 48 + (view === "infinite-vertical" ? 42 : 0));
    act(() => ref.current!.scrollToToday());
    expect(offset("2026-07-04")).toBe(8 + 90 * 2 - 48 + (view === "infinite-vertical" ? 42 : 0));
  });
}
