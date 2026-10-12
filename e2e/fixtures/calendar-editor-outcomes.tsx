import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  QunoInfiniteCalendar,
  type ActiveEventDraft,
  type CalendarEvent,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import type { IsoDate } from "@quno/calendar";
import "@quno/calendar/infinite-calendar/styles.css";

const calendars = Array.from({ length: 135 }, (_, index) => ({ id: `row-${index}`, name: `Row ${index}` }));
const ids = calendars.map(({ id }) => id);
const settings = { excludedWeekdays: [], rowHeight: 58, dayHeaderHeight: 42 };
const loadEvents = async () => [];
const event: CalendarEvent = {
  id: "draft",
  title: "Draft",
  calendarId: "row-134",
  calendarIds: ["row-134"],
  start: "2026-10-22T09:00:00",
  end: "2026-10-22T09:30:00"
};

function restoreDate(handle: QunoInfiniteCalendarHandle | null, date: IsoDate) {
  requestAnimationFrame(() => {
    handle?.scrollToDate({ date });
    handle?.restoreViewportAnchor({
      anchor: { target: { dateKey: date }, snapshot: { top: 0, left: 0 } },
      afterRecenter: true,
      allowNavigationFallback: true,
      cancelOnManualScroll: true
    });
  });
}

function Fixture() {
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const opening = useRef<IsoDate>("2026-10-15");
  const [selected, setSelected] = useState(ids);
  const [draft, setDraft] = useState<ActiveEventDraft | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<IsoDate | null>(null);
  const mode = new URLSearchParams(location.search).get("mode") === "edit" ? "edit" : "create";
  const close = (saved: boolean) => {
    const date = saved ? (ref.current?.getVisibleDateKeys()[0] ?? opening.current) : opening.current;
    setRestoreTarget(date);
    if (saved) {
      ref.current?.commitVisibleEvent({ event: { ...event, id: "saved" }, appearing: true });
    }
    setDraft(null);
    setSelected(ids);
    restoreDate(ref.current, date);
  };
  return (
    <>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-15" })}>October 15</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-22" })}>October 22</button>
      <button onClick={() => ref.current?.scrollToDate({ date: "2026-10-29" })}>October 29</button>
      <button
        onClick={() => {
          opening.current = ref.current?.getVisibleDateKeys()[0] ?? opening.current;
          setDraft({ mode, event });
          setSelected(["row-134"]);
        }}
      >
        Open editor
      </button>
      {draft && (
        <>
          <button onClick={() => close(false)}>Cancel</button>
          <button onClick={() => close(true)}>Save</button>
        </>
      )}
      <output data-testid="restore-date">{restoreTarget}</output>
      <QunoInfiniteCalendar
        ref={ref}
        calendars={calendars}
        selectedCalendarIds={selected}
        initialDateKey="2026-10-15"
        settings={settings}
        loadEvents={loadEvents}
        activeDraft={draft}
        style={{ height: 600, width: 1000 }}
        renderEvent={({ event: current, style }) => <div style={style}>{current.title}</div>}
      />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
