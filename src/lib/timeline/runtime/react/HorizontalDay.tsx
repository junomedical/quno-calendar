import { sameDayPresentation } from "./dayPresentation";
import { memo, useCallback } from "react";
import {
  calendarCellPresentation,
  calendarDayPresentation,
  mergeCalendarPresentation
} from "#quno-internal/timeline/core/calendarCellPresentation";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import { HorizontalDayHeader } from "#quno-internal/timeline/infinite/rendering/horizontal/HorizontalDayHeader";
import type { HorizontalTimelineDayProps } from "#quno-internal/timeline/infinite/rendering/horizontal/types";
import type { DayGeometry } from "#quno-internal/timeline/runtime/model/types";
import { InfiniteTimelineRow } from "#quno-internal/timeline/infinite/rendering/horizontal/HorizontalTimelineRow";

const EMPTY_ROW_EVENTS: ReturnType<HorizontalTimelineDayProps["eventsForRow"]> = [];

function useDayRegistration({
  dateKey,
  geometryRegistration
}: Pick<HorizontalTimelineDayProps, "dateKey" | "geometryRegistration">) {
  return useCallback<import("react").RefCallback<HTMLDivElement>>(
    (element: HTMLDivElement | null) => {
      geometryRegistration.registerDayElement({ dateKey, element });
    },
    [dateKey, geometryRegistration]
  );
}

/**
 * Horizontal date coordinator.
 *
 * viewport -> visible resource indexes -> rows
 * date/settings -----------------------> sticky day chrome
 *
 * Event-layer details stay inside the row modules; this component only maps
 * virtual date geometry to the resource rows that should be mounted.
 */
export const HorizontalDay = memo(function HorizontalDay(
  props: HorizontalTimelineDayProps & { geometry: DayGeometry; resourceIndexes: readonly number[] }
) {
  const {
    item,
    dateKey,
    dayHeight,
    settings,
    width,
    selectedCalendars,
    hiddenCalendarIds,
    todayKey,
    geometryRegistration
  } = props;
  const renderedRowIndexes = props.resourceIndexes;
  const rowExtents = props.geometry.resourceExtents;
  const calendarDayProps = calendarDayPresentation({
    dateKey,
    todayKey,
    view: "infinite-horizontal",
    getDayProps: props.getDayProps
  });
  const setDayElement = useDayRegistration({ dateKey, geometryRegistration });

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
        const calendarCellProps = mergeCalendarPresentation({
          dayProps: calendarDayProps,
          cellProps: calendarCellPresentation({
            calendar,
            dateKey,
            todayKey,
            view: "infinite-horizontal",
            getDayCellProps: props.getDayCellProps
          })
        });

        return (
          <InfiniteTimelineRow
            key={calendar.id}
            calendar={calendar}
            dateKey={dateKey}
            top={extent.start}
            rowHeight={extent.size}
            rowEvents={isHidden ? EMPTY_ROW_EVENTS : props.eventsForRow({ dateKey, calendarId: calendar.id })}
            preparedCell={props.preparedCellForRow({ dateKey, calendarId: calendar.id })}
            isHidden={isHidden}
            isAlternate={resourceIndex % 2 === 0}
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
            renderEvent={props.renderEvent}
            geometryRegistration={geometryRegistration}
            onHoverMove={props.onHoverMove}
            onHoverLeave={props.onHoverLeave}
            onEventPointerDown={props.onEventPointerDown}
          />
        );
      })}
      <HorizontalDayHeader
        locale={props.locale}
        formatters={props.formatters}
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
}, sameDayPresentation);
