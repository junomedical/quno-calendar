import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  QunoInfiniteCalendar,
  type CalendarView,
  type QunoInfiniteCalendarHandle
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
import { calendars, date } from "./calendarFixtures";
import { CalendarEditor } from "./CalendarEditor";
import { useCalendarReadout } from "./useCalendarReadout";
import { useCalendarData } from "./useCalendarData";
import { useCalendarEdits } from "./useCalendarEdits";
import { CalendarControls } from "./CalendarControls";
import { getScenario } from "./scenarioCatalog";
import { useSystemTheme } from "./useSystemTheme";
import { conceptCalendarSettings, useCalendarZoom } from "./useCalendarZoom";
const calendarIds = calendars.map((item) => item.id);
type ConceptCalendarProps = {
  scenario: string;
  revision?: number;
  initialTheme?: "light" | "dark";
  initialView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
};
export function ConceptCalendar({
  scenario,
  revision = 0,
  initialTheme,
  initialView = "infinite-horizontal",
  onViewChange
}: ConceptCalendarProps) {
  const initial = getScenario("infinite-calendar", scenario).initial;
  const ref = useRef<QunoInfiniteCalendarHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const navigationDate = useRef(date);
  const visibleDate = useCalendarReadout(root, ref);
  const [view, setView] = useState<CalendarView>(initial.view === "preferred" ? initialView : initial.view);
  const systemTheme = useSystemTheme();
  const [themePreference, setTheme] = useState(initialTheme ?? initial.theme);
  const theme = themePreference === "system" ? systemTheme : themePreference;
  const [density, setDensity] = useState(initial.density);
  const { zoom, setZoom, minimum, maximum, labelWidth } = useCalendarZoom(root, view, initial.zoom);
  const { loadEvents, projectEvents, setChanges, checkpoint } = useCalendarData(density);
  const { draft, editing, setDraft, save, cancel, reset, renderEvent, ...eventHandlers } = useCalendarEdits(
    ref,
    setChanges,
    initial.focusDraft
  );
  useLayoutEffect(() => {
    const restore = checkpoint();
    const repeat = () => {
      restore();
      setTheme(initialTheme ?? initial.theme);
      setDensity(initial.density);
      setZoom(initial.zoom);
      setView((current) => (initial.view === "preferred" ? current : initial.view));
      reset();
      ref.current?.scrollToDateTime({ date, time: "10:00", calendarId: "person-0" });
    };
    const node = root.current;
    node?.addEventListener("concept-loop", repeat);
    navigationDate.current = date;
    setView((current) => (initial.view === "preferred" ? current : initial.view));
    setTheme(initialTheme ?? initial.theme);
    setDensity(initial.density);
    setZoom(initial.zoom);
    reset();
    return () => node?.removeEventListener("concept-loop", repeat);
  }, [initial, initialTheme, revision, reset, checkpoint, setZoom]);
  const settings = useMemo(() => ({ ...conceptCalendarSettings, labelWidth, zoom }), [labelWidth, zoom]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.scrollToDateTime({ date: navigationDate.current, time: "10:00", calendarId: "person-0" });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, scenario, revision]);
  return (
    <div
      ref={root}
      className="concept-calendar-workspace"
      data-ready="true"
      data-theme={theme}
      data-view={view}
      data-density={density}
      data-zoom={zoom}
      data-visible-date={visibleDate}
    >
      <CalendarControls
        controls={initial.controls}
        zoomRange={{ minimum, maximum }}
        {...{ view, theme, setTheme, density, setDensity, zoom, setZoom }}
        setView={(next) => {
          navigationDate.current = ref.current?.getVisibleDateKeys()[0] ?? date;
          setView(next);
          onViewChange?.(next);
        }}
      />
      <div className="concept-calendar" data-scenario={scenario}>
        <QunoInfiniteCalendar
          ref={ref}
          ariaLabel="Interactive concept calendar"
          calendars={calendars}
          selectedCalendarIds={draft && initial.focusDraft ? [draft.calendarId] : calendarIds}
          loadCalendarIds={calendarIds}
          initialDateKey={date}
          now={new Date(`${date}T10:30:00`)}
          view={view}
          loadEvents={loadEvents}
          projectEvents={projectEvents}
          renderEvent={renderEvent}
          settings={settings}
          onZoomChange={({ zoom: value }) => {
            if (value < minimum || value > maximum) ref.current?.cancelViewportAnchorRestore();
            setZoom(value);
          }}
          activeDraft={
            draft
              ? { mode: editing ? "edit" : "create", event: draft, sourceEventId: editing ? draft.id : undefined }
              : null
          }
          {...eventHandlers}
        />
        {draft && <CalendarEditor draft={draft} editing={editing} update={setDraft} save={save} cancel={cancel} />}
      </div>
    </div>
  );
}
