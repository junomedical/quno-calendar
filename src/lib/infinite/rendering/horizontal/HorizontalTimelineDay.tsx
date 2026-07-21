import { useCallback } from "react";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
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
    showNowLine,
    nowMinute,
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
    getRowHeight
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
      className="ic-day"
      data-testid="calendar-day"
      data-date={dateKey}
      data-index={item.index}
      ref={setDayElement}
      style={{
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
            settings={settings}
            width={width}
            showNowLine={showNowLine}
            nowLineClassName={dateKey === todayKey ? "is-current" : "is-reference"}
            nowMinute={nowMinute}
            interactionMode={props.interactionMode}
            hoveredEvent={props.hoveredEvent}
            dragEventId={props.dragEventId}
            appearingEventIds={props.appearingEventIds}
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
        showNowLine={showNowLine}
        nowMinute={nowMinute}
      />
    </div>
  );
}
