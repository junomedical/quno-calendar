import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type LoadEvents,
  type ActiveEventDraft,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = Array.from({ length: 135 }, (_, index) => ({ id: `row-${index}`, name: `Row ${index}` }));
const allIds = calendars.map(({ id }) => id);
const viewportOnly = () => ({ beforeDays: 0, afterDays: 0 });
const adjacent = () => ({ beforeDays: 1, afterDays: 1 });
const usePrefetch = new URLSearchParams(window.location.search).has("prefetch");
const dense = new URLSearchParams(window.location.search).has("dense");

function Fixture() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const [selected, setSelected] = useState(allIds);
  const [draft, setDraft] = useState<ActiveEventDraft | null>(null);
  const [requests, setRequests] = useState<
    Array<{
      startDate: string;
      endDate: string;
      visible: string[];
      ids: number;
      startedAt: number;
      completedAt?: number;
    }>
  >([]);
  const [aborted, setAborted] = useState(0);
  const loadEvents = useRef<LoadEvents>(async ({ startDate, endDate, calendarIds, signal }) => {
    const startedAt = performance.now();
    setRequests((previous) => [
      ...previous,
      { startDate, endDate, visible: ref.current?.getVisibleDateKeys() ?? [], ids: calendarIds.length, startedAt }
    ]);
    signal?.addEventListener("abort", () => setAborted((value) => value + 1), { once: true });
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const completedAt = performance.now();
    setRequests((previous) =>
      previous.map((entry) => (entry.startedAt === startedAt ? { ...entry, completedAt } : entry))
    );
    if (dense)
      return calendars.flatMap(({ id }, index) =>
        Array.from({ length: (index % 3) + 1 }, (_, lane) => ({
          id: `${startDate}:${id}:${lane}`,
          calendarId: id,
          title: "Available",
          start: `${startDate}T09:00:00`,
          end: `${startDate}T10:00:00`
        }))
      );
    return [
      {
        id: startDate,
        calendarId: "row-134",
        title: "Available",
        start: `${startDate}T09:00:00`,
        end: `${startDate}T10:00:00`
      }
    ];
  }).current;
  return (
    <>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-15" })}>October 15</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-22" })}>October 22</button>
      <button
        onClick={() =>
          ref.current?.scrollToDateTime({ date: "2026-10-15", time: "09:00", calendarId: "row-134", align: "center" })
        }
      >
        Bottom row
      </button>
      <button
        onClick={() => {
          ref.current?.cancelViewportAnchorRestore();
          setSelected(["row-134"]);
        }}
      >
        Compact
      </button>
      <button
        onClick={() => {
          setDraft({
            mode: "create",
            event: {
              id: "draft",
              calendarId: "row-134",
              title: "Draft",
              start: "2026-10-15T09:00:00",
              end: "2026-10-15T09:30:00"
            }
          });
          setSelected(["row-134"]);
        }}
      >
        Create
      </button>
      <button onClick={() => setSelected(allIds)}>All rows</button>
      <button onClick={() => setSelected(allIds.slice(0, 115))}>Staff rows</button>
      <button onClick={() => setSelected(allIds.slice(115))}>Room rows</button>
      <button onClick={() => setSelected([])}>No rows</button>
      <output data-testid="request-count">{requests.length}</output>
      <output data-testid="abort-count">{aborted}</output>
      <QunoInfiniteCalendar
        ref={ref}
        calendars={calendars}
        selectedCalendarIds={selected}
        loadCalendarIds={allIds}
        activeDraft={draft}
        eventPrefetchPolicy={usePrefetch ? adjacent : viewportOnly}
        loadEvents={loadEvents}
        initialDateKey="2026-10-15"
        settings={{ excludedWeekdays: [], rowHeight: 58, dayHeaderHeight: 42 }}
        style={{ height: 600, width: 1000 }}
        renderEvent={({ event, style }) => <div style={style}>{event.title}</div>}
      />
      <output data-testid="requests">{JSON.stringify(requests)}</output>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
