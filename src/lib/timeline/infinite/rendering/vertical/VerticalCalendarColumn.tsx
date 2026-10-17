/**
 * Resource column coordinator.
 * prepared cell -> grid chrome -> availability -> committed events -> transients
 */
import { memo, useCallback, useMemo } from "react";
import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import {
  layoutPreparedEventsForColumn,
  type EventColumnLayoutItem
} from "#quno-internal/timeline/infinite/events/layout/layout";
import {
  AvailabilityLayer,
  CommittedLayer,
  TransientLayer
} from "#quno-internal/timeline/infinite/rendering/shared/EventLayers";
import type { VerticalCalendarColumnProps } from "./types";
import { CalendarHourBands } from "#quno-internal/timeline/infinite/rendering/shared/CalendarHourBands";
import {
  positionColumnLayoutItems,
  verticalEventBox,
  VERTICAL_COLUMN_GAP_PX,
  VERTICAL_TIMELINE_GUTTER_PX
} from "./verticalGeometry";

function useEventProjections(settings: VerticalCalendarColumnProps["settings"]) {
  const event = useCallback(
    (calendarEvent: CalendarEvent) => {
      const box = verticalEventBox({ event: calendarEvent, settings });
      return {
        left: 0,
        top: box.top,
        width: "100%",
        hoverMaxWidth: "100%",
        height: box.height
      };
    },
    [settings]
  );
  const committed = useCallback(
    ({ item, hovered }: { item: EventColumnLayoutItem; hovered: boolean }) => {
      const width = hovered ? "100%" : `calc(${item.widthPercent}% - ${VERTICAL_COLUMN_GAP_PX * 2}px)`;
      return {
        left: hovered ? "0%" : `calc(${item.leftPercent}% + ${VERTICAL_COLUMN_GAP_PX}px)`,
        top: item.top,
        width,
        hoverMaxWidth: width,
        height: hovered ? Math.max(item.height, settings.verticalEventHoverMinHeight) : item.height
      };
    },
    [settings.verticalEventHoverMinHeight]
  );
  const availability = useCallback(
    ({ item }: { item: EventColumnLayoutItem }) => ({
      left: `${item.leftPercent}%`,
      top: item.top,
      width: `${item.widthPercent}%`,
      hoverMaxWidth: `${item.widthPercent}%`,
      height: item.height
    }),
    []
  );
  return { event, committed, availability };
}

export const VerticalCalendarColumn = memo(function VerticalCalendarColumn({
  calendar,
  dateKey,
  rowEvents,
  preparedCell,
  isHidden = false,
  calendarCellProps,
  calendarHourPresentations,
  settings,
  boardHeight,
  gridCellHeight,
  interactionMode,
  hoveredEvent,
  dragEventId,
  appearingEventIds,
  focusedEventTarget,
  eventInteractionEnabled,
  dragPreviewEvent,
  draftEvent,
  draftEventStatus,
  draftEventIsDraggable,
  draftEventIsExiting,
  draftEventReleaseDurationMs,
  renderEvent,
  geometryRegistration,
  gridColumn,
  isAlternate,
  onHoverMove,
  onHoverLeave,
  onEventPointerDown
}: VerticalCalendarColumnProps) {
  const layoutItems = useMemo(
    () =>
      positionColumnLayoutItems({
        items: layoutPreparedEventsForColumn({ preparedCell: preparedCell.events, settings })
      }),
    [preparedCell, settings]
  );
  const availabilityItems = useMemo(
    () =>
      positionColumnLayoutItems({
        items: layoutPreparedEventsForColumn({ preparedCell: preparedCell.availability, settings })
      }),
    [preparedCell, settings]
  );
  const project = useEventProjections(settings);
  const setResourceElement = useCallback<import("react").RefCallback<HTMLDivElement>>(
    (element: HTMLDivElement | null) =>
      geometryRegistration.registerResourceElement({ dateKey, calendarId: calendar.id, element }),
    [calendar.id, dateKey, geometryRegistration]
  );

  return (
    <div
      className={["icv-calendar-column-grid", isAlternate ? "is-alternate" : "", calendarCellProps?.className]
        .filter(Boolean)
        .join(" ")}
      data-testid="calendar-column"
      data-slot="calendar-cell"
      data-date={dateKey}
      data-calendar-id={calendar.id}
      data-retained-hidden={isHidden ? "true" : undefined}
      data-event-count={rowEvents.length}
      title={calendarCellProps?.title}
      ref={setResourceElement}
      aria-hidden={isHidden || undefined}
      onMouseLeave={onHoverLeave}
      onPointerMove={(pointerEvent) =>
        onHoverMove({ event: pointerEvent, layoutItems, renderedCalendarId: calendar.id })
      }
      style={{
        ...calendarCellProps?.style,
        gridColumn,
        minHeight: boardHeight,
        visibility: isHidden ? "hidden" : undefined,
        pointerEvents: isHidden ? "none" : undefined,
        backgroundImage:
          "linear-gradient(to bottom, var(--quno-calendar-cell-border, var(--_ic-default-cell-border)) 1px, transparent 1px)",
        backgroundRepeat: "repeat",
        backgroundSize: `100% ${gridCellHeight}px`,
        backgroundPosition: `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    >
      <CalendarHourBands hours={calendarHourPresentations} orientation="vertical" settings={settings} />
      <AvailabilityLayer
        items={availabilityItems}
        calendarId={calendar.id}
        interactionMode={interactionMode}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        eventInteractionEnabled={eventInteractionEnabled}
        renderEvent={renderEvent}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={project.availability}
        shellClassName="icv-event-shell"
      />
      <CommittedLayer
        items={layoutItems}
        calendarId={calendar.id}
        interactionMode={interactionMode}
        hoveredEvent={hoveredEvent}
        dragEventId={dragEventId}
        appearingEventIds={appearingEventIds}
        focusedEventTarget={focusedEventTarget}
        eventInteractionEnabled={eventInteractionEnabled}
        renderEvent={renderEvent}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={project.committed}
        shellClassName="icv-event-shell"
      />
      <TransientLayer
        dateKey={dateKey}
        calendarId={calendar.id}
        draftEvent={draftEvent}
        draftEventStatus={draftEventStatus}
        draftEventIsDraggable={draftEventIsDraggable}
        draftEventIsExiting={draftEventIsExiting}
        draftEventReleaseDurationMs={draftEventReleaseDurationMs}
        dragPreviewEvent={dragPreviewEvent}
        eventInteractionEnabled={eventInteractionEnabled}
        renderEvent={renderEvent}
        geometryRegistration={geometryRegistration}
        onEventPointerDown={onEventPointerDown}
        project={({ event }) => project.event(event)}
        shellClassName="icv-event-shell"
      />
    </div>
  );
});
