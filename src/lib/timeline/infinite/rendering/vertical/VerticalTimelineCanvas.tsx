/**
 * Vertical viewport render loop.
 * virtual date items + shared day props -> scroll canvas -> windowed date sections
 */
import type { PointerEventHandler, RefObject } from "react";
import type { CalendarViewComponentProps } from "#quno-internal/timeline/core/types";
import { VerticalTimelineDay } from "./VerticalTimelineDay";
import type { VerticalTimelineDayProps } from "./types";
import type { VirtualDateRenderItem } from "../../scroll/window/renderItems";

export type VerticalDayRenderProps = Omit<
  VerticalTimelineDayProps,
  "dayIndex" | "dateKey" | "top" | "dayHeight" | "boardMinWidth"
>;

type VerticalTimelineCanvasProps = {
  ariaLabel: string;
  className?: string;
  style?: CalendarViewComponentProps["style"];
  containerRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  canStartDraft: boolean;
  onScroll: () => void;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  totalHeight: number;
  labelWidth: number;
  maxVisibleDayMinWidth: number;
  renderItems: VirtualDateRenderItem[];
  dateKeyForIndex: (index: number) => string;
  dayHeight: number;
  dayMinWidth: (dateKey: string) => number;
  day: VerticalDayRenderProps;
};

export function VerticalTimelineCanvas({
  ariaLabel,
  className,
  style,
  containerRef,
  isDragging,
  canStartDraft,
  onScroll,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  totalHeight,
  labelWidth,
  maxVisibleDayMinWidth,
  renderItems,
  dateKeyForIndex,
  dayHeight,
  dayMinWidth,
  day
}: VerticalTimelineCanvasProps) {
  const shellClassName = ["quno-calendar-shell", "icv-shell", className].filter(Boolean).join(" ");
  return (
    <section
      aria-label={ariaLabel}
      className={shellClassName}
      data-testid="quno-calendar-timeline"
      data-view="infinite-vertical"
      style={style}
    >
      <div
        className={[
          "quno-calendar-viewport",
          "icv-viewport",
          isDragging ? "is-dragging" : "",
          canStartDraft ? "is-create-enabled" : ""
        ]
          .filter(Boolean)
          .join(" ")}
        ref={containerRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className="quno-calendar-virtual-space icv-virtual-space"
          style={{ height: totalHeight, width: "100%", minWidth: labelWidth + maxVisibleDayMinWidth }}
        >
          {renderItems.map((item) => {
            const dateKey = dateKeyForIndex(item.index);
            return (
              <VerticalTimelineDay
                {...day}
                dayIndex={item.index}
                dateKey={dateKey}
                top={item.start}
                dayHeight={dayHeight}
                boardMinWidth={dayMinWidth(dateKey)}
                key={item.key}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
