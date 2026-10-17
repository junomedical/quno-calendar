import { useEventPointerHandler } from "./dayPresentation";
import { useMemo } from "react";
import type { CalendarInternalViewProps } from "#quno-internal/timeline/core/internalTypes";
import { calendarHourPresentations } from "#quno-internal/timeline/core/calendarCellPresentation";
import { buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { InfiniteTimeScaleHeader } from "#quno-internal/timeline/infinite/rendering/shared/TimeScaleHeader";
import type { HorizontalTimelineDayProps } from "#quno-internal/timeline/infinite/rendering/horizontal/types";
import type { VerticalTimelineDayProps } from "#quno-internal/timeline/infinite/rendering/vertical/types";
import { HorizontalDay } from "./HorizontalDay";
import { VerticalDay } from "./VerticalDay";
import type { useRuntimeView } from "./useRuntimeView";
import "#quno-internal/timeline/infinite/rendering/styles/calendar.css";

export function RuntimeCanvas({
  props,
  runtime
}: {
  props: CalendarInternalViewProps;
  runtime: ReturnType<typeof useRuntimeView>;
}) {
  const { snapshot, interactions, effectiveSettings: settings } = runtime;
  const { geometry } = snapshot;
  const selectedCalendars = useMemo(() => [...geometry.calendars], [geometry.calendars]);
  const onEventPointerDown = useEventPointerHandler({ handler: interactions.handleEventPointerDown });
  const horizontal = geometry.orientation === "horizontal";
  const view = horizontal ? "infinite-horizontal" : "infinite-vertical";
  const now = props.now ?? new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinute >= settings.startHour * 60 && nowMinute <= settings.endHour * 60;
  const ticks = useMemo(() => buildTimeTicks(settings), [settings]);
  const hours = useMemo(
    () => calendarHourPresentations({ settings, view, getHourProps: props.getHourProps }),
    [props.getHourProps, settings, view]
  );
  const common = {
    locale: props.locale,
    formatters: props.formatters,
    settings,
    selectedCalendars,
    hiddenCalendarIds: runtime.hiddenCalendarIds,
    todayKey: toDateKey({ date: now }),
    getDayCellProps: props.getDayCellProps,
    getDayProps: props.getDayProps,
    calendarHourPresentations: hours,
    showNowLine,
    nowMinute,
    interactionMode: props.interactionMode ?? ("events" as const),
    hoveredEvent: interactions.hoveredEvent,
    dragEventId: interactions.dragState?.event.id,
    appearingEventIds: runtime.data.appearingEventIds,
    focusedEventTarget: props.focusedEventTarget,
    eventInteractionEnabled: interactions.canInteractWithPersistedEvents,
    dragPreviewEvent: interactions.dragPreviewEvent,
    draftEvent: interactions.renderedDraftEvent,
    draftEventStatus: interactions.renderedDraftStatus,
    draftEventIsDraggable: interactions.renderedDraftIsDraggable,
    draftEventIsExiting: interactions.renderedDraftIsExiting,
    draftEventReleaseDurationMs: interactions.renderedDraftReleaseDurationMs,
    renderEvent: props.renderEvent,
    geometryRegistration: runtime.handle.registration,
    onEventPointerDown
  };
  return (
    <section
      aria-label={props.ariaLabel ?? "Calendar"}
      className={["quno-calendar-shell", !horizontal && "icv-shell", props.className].filter(Boolean).join(" ")}
      data-testid="quno-calendar-timeline"
      data-view={view}
      style={props.style}
    >
      <div
        ref={runtime.containerRef}
        className={[
          "quno-calendar-viewport",
          !horizontal && "icv-viewport",
          interactions.dragState && "is-dragging",
          interactions.canStartDraft && "is-create-enabled"
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerDown={interactions.handleGridPointerDown}
        onPointerMove={interactions.handlePointerMove}
        onPointerUp={interactions.handlePointerUp}
        onPointerCancel={interactions.handlePointerCancel}
      >
        <div
          className={`quno-calendar-virtual-space${horizontal ? "" : " icv-virtual-space"}`}
          style={{ height: geometry.height, width: "100%", minWidth: geometry.width }}
        >
          {horizontal && (
            <InfiniteTimeScaleHeader
              settings={settings}
              width={geometry.width - geometry.labelWidth - geometry.timeGutter}
              timeTicks={ticks}
              calendarHourPresentations={hours}
              showNowLine={showNowLine}
              nowMinute={nowMinute}
            />
          )}
          {snapshot.window.dateIndexes.map((index) => {
            const day = geometry.dates[index];
            const resources = snapshot.window.resourceIndexes.get(day.dateKey) ?? [];
            const getResource = ({ calendarId }: { dateKey: string; calendarId: string }) =>
              day.resources.find((resource) => resource.calendarId === calendarId)!;
            if (horizontal) {
              const dayProps: HorizontalTimelineDayProps = {
                ...common,
                item: { key: day.dateKey, index, start: day.bounds.y },
                dateKey: day.dateKey,
                dayHeight: day.bounds.height,
                width: geometry.width - geometry.labelWidth - geometry.timeGutter,
                eventsForRow: (args) =>
                  getResource(args).events as ReturnType<HorizontalTimelineDayProps["eventsForRow"]>,
                preparedCellForRow: (args) => getResource(args).layers,
                onHoverMove: runtime.horizontalHover.updateHoverFromRow,
                onHoverLeave: runtime.horizontalHover.clearHoveredEvent
              };
              return <HorizontalDay {...dayProps} key={day.dateKey} geometry={day} resourceIndexes={resources} />;
            }
            const dayProps: VerticalTimelineDayProps = {
              ...common,
              dayIndex: index,
              dateKey: day.dateKey,
              top: day.bounds.y,
              dayHeight: day.bounds.height,
              boardHeight: day.bounds.height - settings.dayHeaderHeight,
              boardMinWidth: day.resources.reduce((width, resource) => width + resource.width, 0),
              virtualBoardMinWidth: geometry.width - geometry.labelWidth,
              labelWidth: geometry.labelWidth,
              timeTicks: ticks,
              eventsForColumn: (args) =>
                getResource(args).events as ReturnType<VerticalTimelineDayProps["eventsForColumn"]>,
              preparedCellForColumn: (args) => getResource(args).layers,
              columnWidthForDateCalendar: (args) => getResource(args).width,
              onHoverMove: runtime.verticalHover.updateHoverFromColumn,
              onHoverLeave: runtime.verticalHover.clearHoveredEvent
            };
            return <VerticalDay {...dayProps} key={day.dateKey} geometry={day} resourceIndexes={resources} />;
          })}
        </div>
      </div>
    </section>
  );
}
