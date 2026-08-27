import { useCallback } from "react";
import {
  calendarCellPresentation,
  calendarDayPresentation,
  mergeCalendarPresentation
} from "#quno-internal/timeline/core/calendarCellPresentation";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import { HorizontalDayHeader } from "./HorizontalDayHeader";
import type { HorizontalTimelineDayProps } from "./types";
import { useHorizontalDayResourceWindow } from "./useHorizontalDayResourceWindow";
import { InfiniteTimelineRow } from "./HorizontalTimelineRow";

const EMPTY_ROW_EVENTS: ReturnType<HorizontalTimelineDayProps["eventsForRow"]> = [];

/**
 * Horizontal date coordinator.
 *
 * viewport -> visible resource indexes -> rows
 * date/settings -----------------------> sticky day chrome
 *
 * Event-layer details stay inside the row modules; this component only maps
 * virtual date geometry to the resource rows that should be mounted.
 */
export function InfiniteTimelineDay(props: HorizontalTimelineDayProps) {
  const {
    item,
    dateKey,
    dayHeight,
    settings,
    width,
    selectedCalendars,
    hiddenCalendarIds,
    todayKey,
    geometryRegistration,
    viewportMetricsStore,
    measureElement,
    getRowHeight
  } = props;
  const { renderedRowIndexes, rowExtents } = useHorizontalDayResourceWindow({
    dateKey,
    dayStart: item.start,
    dayHeaderHeight: settings.dayHeaderHeight,
    selectedCalendars,
    draftEvent: props.draftEvent,
    dragPreviewEvent: props.dragPreviewEvent,
    activeRestoreTarget: props.activeRestoreTarget,
    viewportMetricsStore,
    forceAllResources: props.forceAllResources,
    getRowHeight
  });
  const calendarDayProps = calendarDayPresentation({
    dateKey,
    todayKey,
    view: "infinite-horizontal",
    getCalendarDayProps: props.getCalendarDayProps
  });
  const setDayElement = useCallback(
    (element: HTMLDivElement | null) => {
      measureElement(element);
      geometryRegistration.registerDayElement(dateKey, element);
    },
    [dateKey, geometryRegistration, measureElement]
  );

  return (
    <div
      className={["quno-calendar-day", calendarDayProps?.className].filter(Boolean).join(" ")}
      data-slot="calendar-day"
      data-testid="calendar-day"
      data-date={dateKey}
      data-index={item.index}
      ref={setDayElement}
      title={calendarDayProps?.title}
      style={{
        ...calendarDayProps?.style,
        top: item.start,
        height: dayHeight,
        width: "100%",
        minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
      }}
    >
      {renderedRowIndexes.map((resourceIndex) => {
        const calendar = selectedCalendars[resourceIndex];
        const extent = rowExtents[resourceIndex];
        const isHidden = hiddenCalendarIds.has(calendar.id);
        const calendarCellProps = mergeCalendarPresentation(
          calendarDayProps,
          calendarCellPresentation({
            calendar,
            dateKey,
            todayKey,
            view: "infinite-horizontal",
            getCalendarCellProps: props.getCalendarCellProps
          })
        );

        return (
          <InfiniteTimelineRow
            key={calendar.id}
            calendar={calendar}
            dateKey={dateKey}
            top={extent.start}
            rowHeight={extent.size}
            rowEvents={isHidden ? EMPTY_ROW_EVENTS : props.eventsForRow(dateKey, calendar.id)}
            preparedCell={props.preparedCellForRow(dateKey, calendar.id)}
            isHidden={isHidden}
            calendarCellProps={calendarCellProps}
            calendarHourPresentations={props.calendarHourPresentations}
            settings={settings}
            width={width}
            showNowLine={props.showNowLine}
            nowLineClassName={dateKey === todayKey ? "is-current" : "is-reference"}
            nowMinute={props.nowMinute}
            interactionMode={props.interactionMode}
            hoveredEvent={props.hoveredEvent}
            dragEventId={props.dragEventId}
            appearingEventIds={props.appearingEventIds}
            focusedEventTarget={props.focusedEventTarget}
            eventInteractionEnabled={props.eventInteractionEnabled}
            dragPreviewEvent={isHidden ? null : props.dragPreviewEvent}
            draftEvent={isHidden ? null : props.draftEvent}
            draftEventStatus={props.draftEventStatus}
            draftEventIsDraggable={props.draftEventIsDraggable}
            draftEventIsExiting={props.draftEventIsExiting}
            draftEventReleaseDurationMs={props.draftEventReleaseDurationMs}
            eventRenderer={props.eventRenderer}
            geometryRegistration={geometryRegistration}
            onHoverMove={props.onHoverMove}
            onHoverLeave={props.onHoverLeave}
            onEventPointerDown={props.onEventPointerDown}
          />
        );
      })}
      <HorizontalDayHeader
        dateKey={dateKey}
        settings={settings}
        timelineWidth={width}
        todayKey={todayKey}
        showNowLine={props.showNowLine}
        nowMinute={props.nowMinute}
        calendarDayProps={calendarDayProps}
      />
    </div>
  );
}
