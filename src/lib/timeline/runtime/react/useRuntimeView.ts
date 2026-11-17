import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ForwardedRef } from "react";
import { type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarInternalViewProps, CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { mergeQunoInfiniteCalendarSettings } from "#quno-internal/timeline/infinite/views/shared/mergeQunoInfiniteCalendarSettings";
import { useRetainedCalendarRows } from "#quno-internal/timeline/infinite/events/metrics/useRetainedCalendarRows";
import { useTimelineInteractions } from "#quno-internal/timeline/infinite/interactions/useTimelineInteractions";
import { useHorizontalEventHover } from "#quno-internal/timeline/infinite/rendering/horizontal/useHorizontalEventHover";
import { useVerticalColumnHover } from "#quno-internal/timeline/infinite/rendering/vertical/useVerticalColumnHover";
import { Preparation, projectBuckets } from "#quno-internal/timeline/runtime/data/Preparation";
import type { Orientation } from "#quno-internal/timeline/runtime/model/types";
import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
import { transientPins } from "#quno-internal/timeline/runtime/model/transientPins";
import { defaultEventPrefetchPolicy } from "#quno-internal/timeline/data/eventPrefetch";
import { useViewportPrefetch } from "./useViewportPrefetch";
import { useEngine } from "./useEngine";
import { useRuntimeData } from "./useRuntimeData";
import { useRuntimeHandle } from "./useRuntimeHandle";
import { useRuntimeHit } from "./useRuntimeHit";
import { useRuntimeZoom } from "./useRuntimeZoom";
import { zonedDateKey, zonedMinute } from "#quno-internal/timeline/time/timeZone";

export function useRuntimeView({
  props,
  orientation,
  forwardedRef
}: {
  props: CalendarInternalViewProps;
  orientation: Orientation;
  forwardedRef: ForwardedRef<CalendarViewHandle>;
}) {
  const now = props.now ?? new Date();
  const timeZone = props.settings?.timeZone;
  const today = zonedDateKey({ date: now, timeZone });
  const initial = useRef(props.initialDateKey ?? today).current;
  const nowMinute = zonedMinute({ date: now, timeZone });
  const [visibleDates, setVisibleDates] = useState<readonly IsoDate[]>([initial]);
  const [prefetchedDates, setPrefetchedDates] = useState<readonly IsoDate[]>([]);
  const updatePrefetchedDates = useCallback(
    ({ dates }: { dates: readonly IsoDate[] }) => setPrefetchedDates(dates),
    []
  );
  const [renderDates, setRenderDates] = useState<readonly IsoDate[]>([initial]);
  const settingsKey = JSON.stringify(props.settings ?? {});
  const settings = useMemo(() => mergeQunoInfiniteCalendarSettings(JSON.parse(settingsKey)), [settingsKey]);
  const selectedKey = JSON.stringify(props.selectedCalendarIds);
  const selectedCalendars = useMemo(() => {
    const ids = new Set(JSON.parse(selectedKey) as string[]);
    return props.calendars.filter((calendar) => ids.has(calendar.id));
  }, [props.calendars, selectedKey]);
  const { renderedCalendars, hiddenCalendarIds } = useRetainedCalendarRows({
    selectedCalendars,
    activeDraft: props.activeDraft
  });
  const data = useRuntimeData({ props, visibleDates, anchorDate: initial, prefetchedDates });
  const [preparation] = useState(() => new Preparation());
  const projected = useMemo(
    () =>
      projectBuckets({
        buckets: data.buckets,
        dates: renderDates,
        calendarIds: JSON.parse(selectedKey) as string[],
        projectEvents: props.projectEvents,
        timeZone
      }),
    [data.buckets, props.projectEvents, renderDates, selectedKey, timeZone]
  );
  const metrics = useMemo(
    () =>
      preparation.prepare({
        buckets: projected,
        calendars: renderedCalendars,
        settings,
        activeDraft: props.activeDraft
      }),
    [preparation, projected, renderedCalendars, settings, props.activeDraft]
  );
  const layout = useMemo(
    () => ({
      orientation,
      settings,
      calendars: renderedCalendars,
      anchorDate: initial,
      metrics,
      draft: props.activeDraft?.event,
      nowMinute
    }),
    [initial, metrics, orientation, renderedCalendars, settings, props.activeDraft?.event, nowMinute]
  );
  const runtime = useEngine({ layout });
  const { engine, snapshot, containerRef } = runtime;
  useViewportPrefetch({
    engine,
    calendarIds: props.loadCalendarIds ?? props.selectedCalendarIds,
    policy: props.eventPrefetchPolicy ?? defaultEventPrefetchPolicy,
    onChange: updatePrefetchedDates
  });
  useRuntimeZoom({ engine, adapter: runtime.adapter, containerRef, onZoomChange: props.onZoomChange });
  const visibleKey = JSON.stringify(snapshot.window.visibleDateKeys);
  const renderKey = JSON.stringify(snapshot.window.dateIndexes.map((index) => snapshot.geometry.dates[index].dateKey));
  useEffect(() => setVisibleDates(JSON.parse(visibleKey) as IsoDate[]), [visibleKey]);
  useEffect(() => setRenderDates(JSON.parse(renderKey) as IsoDate[]), [renderKey]);
  const effectiveSettings = useMemo(
    () => ({ ...snapshot.geometry.settings, zoom: snapshot.geometry.scale }),
    [snapshot.geometry.settings, snapshot.geometry.scale]
  );
  const hit = useRuntimeHit({ engine, containerRef });
  const interactions = useTimelineInteractions({
    ...props,
    settings: effectiveSettings,
    interactionMode: props.interactionMode ?? "events",
    getHit: hit,
    isTimelinePoint: (point) => hit(point) !== null,
    applyMoveToLoadedEvents: data.move,
    applyCreatedEventToLoadedEvents: data.create
  });
  const handle = useRuntimeHandle({
    today,
    nowTime: `${String(Math.floor(nowMinute / 60)).padStart(2, "0")}:${String(nowMinute % 60).padStart(2, "0")}`,
    engine,
    containerRef,
    forwardedRef,
    actions: {
      commitVisibleEvent: data.commit,
      removeVisibleEvent: data.remove,
      releaseActiveDraft: interactions.releaseActiveDraft
    }
  });
  useLayoutEffect(() => {
    const now = performance.now();
    if (interactions.isInteractionActive) {
      const state = engine.read();
      const anchor = captureLayoutAnchor({ geometry: state.geometry, viewport: state.viewport });
      if (anchor) engine.position({ anchor, kind: "gesture", now, duration: Infinity });
    } else if (engine.ownership.active({ now })?.kind === "gesture") engine.cancel({ now });
  }, [engine, interactions.isInteractionActive]);
  const draft = interactions.renderedDraftEvent;
  const preview = interactions.dragPreviewEvent;
  useLayoutEffect(() => {
    const state = engine.read();
    const pins = transientPins({
      geometry: state.geometry,
      visibleDates: state.window.visibleDateKeys,
      draft,
      preview
    });
    engine.setPins({ ...pins, now: performance.now() });
  }, [draft, engine, preview]);
  const hoverArgs = {
    disabled: interactions.isInteractionActive || props.interactionMode === "availability",
    setHoveredEvent: interactions.setHoveredEvent
  };
  const horizontalHover = useHorizontalEventHover(hoverArgs);
  const verticalHover = useVerticalColumnHover(hoverArgs);
  return {
    ...runtime,
    data,
    interactions,
    handle,
    effectiveSettings,
    renderedCalendars,
    hiddenCalendarIds,
    horizontalHover,
    verticalHover
  };
}
