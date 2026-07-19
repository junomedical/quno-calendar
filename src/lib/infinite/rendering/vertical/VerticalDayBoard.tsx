/**
 * Domain: Rendering.
 * Responsibility: Places visible calendar columns at their full-layout offsets.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
/**
 * Vertical day board.
 * visible resource indexes -> now indicator + independent resource columns
 */
import { VerticalCalendarColumn } from "./VerticalCalendarColumn";
import type { VerticalTimelineDayProps } from "./types";
import { verticalMinuteToY } from "./verticalGeometry";

type VerticalDayBoardProps = {
  day: VerticalTimelineDayProps;
  cadenceHeight: number;
  gridTemplateColumns: string;
  renderedColumnIndexes: number[];
};

/** Date board: global time indicator -> visible resource columns -> event layers. */
export function VerticalDayBoard({
  day,
  cadenceHeight,
  gridTemplateColumns,
  renderedColumnIndexes
}: VerticalDayBoardProps) {
  return (
    <div
      className="icv-day-board"
      data-testid="vertical-day-board"
      style={{
        left: day.labelWidth,
        top: day.settings.dayHeaderHeight,
        height: day.boardHeight,
        width: `calc(100% - ${day.labelWidth}px)`,
        minWidth: day.boardMinWidth,
        gridTemplateColumns
      }}
    >
      {day.dateKey === day.todayKey && day.showNowLine ? (
        <div
          className="icv-now-line"
          data-testid="current-time-line"
          style={{ top: verticalMinuteToY(day.nowMinute, day.settings) }}
        />
      ) : null}
      {renderedColumnIndexes.map((resourceIndex) => {
        const calendar = day.selectedCalendars[resourceIndex];
        const isHidden = day.hiddenCalendarIds.has(calendar.id);
        return (
          <VerticalCalendarColumn
            calendar={calendar}
            dateKey={day.dateKey}
            rowEvents={isHidden ? [] : day.eventsForColumn(day.dateKey, calendar.id)}
            preparedCell={day.preparedCellForColumn(day.dateKey, calendar.id)}
            isHidden={isHidden}
            settings={day.settings}
            boardHeight={day.boardHeight}
            gridCellHeight={cadenceHeight}
            interactionMode={day.interactionMode}
            hoveredEvent={day.hoveredEvent}
            dragEventId={day.dragEventId}
            appearingEventIds={day.appearingEventIds}
            dragPreviewEvent={isHidden ? null : day.dragPreviewEvent}
            draftEvent={isHidden ? null : day.draftEvent}
            draftEventStatus={day.draftEventStatus}
            draftEventIsDraggable={day.draftEventIsDraggable}
            draftEventIsExiting={day.draftEventIsExiting}
            draftEventReleaseDurationMs={day.draftEventReleaseDurationMs}
            eventRenderer={day.eventRenderer}
            geometryRegistration={day.geometryRegistration}
            gridColumn={resourceIndex + 1}
            isAlternate={resourceIndex % 2 === 0}
            onHoverMove={day.onHoverMove}
            onHoverLeave={day.onHoverLeave}
            onEventPointerDown={day.onEventPointerDown}
            key={calendar.id}
          />
        );
      })}
    </div>
  );
}
