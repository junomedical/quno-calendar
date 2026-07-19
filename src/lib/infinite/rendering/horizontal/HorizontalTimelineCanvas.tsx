/**
 * Domain: Rendering.
 * Responsibility: Renders the scroll container, sticky time scale, and virtual date items.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import type { PointerEventHandler, RefObject, UIEventHandler } from "react";
import type { CalendarViewComponentProps } from "../../../core/types";
import { InfiniteTimeScaleHeader } from "../shared/TimeScaleHeader";
import { InfiniteTimelineDay } from "./HorizontalTimelineDay";
import type { HorizontalTimelineDayProps } from "./types";
import { TIMELINE_LEFT_GUTTER_PX, buildTimeTicks } from "../../../time/timelineTicks";

/**
 * Horizontal render loop.
 *
 * virtual items -> day keys/heights -> windowed day components
 * effective time scale ----------> one sticky header
 */
type HorizontalTimelineCanvasProps = {
  ariaLabel: string;
  className?: string;
  style?: CalendarViewComponentProps["style"];
  containerRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  onScroll: UIEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  virtualHeight: number;
  timeTicks: ReturnType<typeof buildTimeTicks>;
  showNowLine: boolean;
  nowMinute: number;
  renderItems: HorizontalTimelineDayProps["item"][];
  dateKeyForIndex: (index: number) => string;
  getDayHeight: (dateKey: string) => number;
  dayProps: Omit<HorizontalTimelineDayProps, "item" | "dateKey" | "dayHeight">;
};

export function HorizontalTimelineCanvas({
  ariaLabel,
  className,
  style,
  containerRef,
  isDragging,
  onScroll,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  virtualHeight,
  timeTicks,
  showNowLine,
  nowMinute,
  renderItems,
  dateKeyForIndex,
  getDayHeight,
  dayProps
}: HorizontalTimelineCanvasProps) {
  const shellClassName = ["ic-shell", className].filter(Boolean).join(" ");

  return (
    <section aria-label={ariaLabel} className={shellClassName} data-testid="infinite-calendar" style={style}>
      <div
        className={isDragging ? "ic-viewport is-dragging" : "ic-viewport"}
        ref={containerRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className="ic-virtual-space"
          style={{
            height: virtualHeight,
            width: "100%",
            minWidth: dayProps.settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + dayProps.width
          }}
        >
          <InfiniteTimeScaleHeader
            settings={dayProps.settings}
            width={dayProps.width}
            timeTicks={timeTicks}
            showNowLine={showNowLine}
            nowMinute={nowMinute}
          />
          {renderItems.map((item) => {
            const dateKey = dateKeyForIndex(item.index);
            return (
              <InfiniteTimelineDay
                {...dayProps}
                key={item.key}
                item={item}
                dateKey={dateKey}
                dayHeight={getDayHeight(dateKey)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
