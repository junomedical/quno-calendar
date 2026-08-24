import type { PointerEventHandler, RefObject, UIEventHandler } from "react";
import type { CalendarViewComponentProps } from "#quno-internal/timeline/core/types";
import { InfiniteTimeScaleHeader } from "../shared/TimeScaleHeader";
import { InfiniteTimelineDay } from "./HorizontalTimelineDay";
import type { HorizontalTimelineDayProps } from "./types";
import { TIMELINE_LEFT_GUTTER_PX, buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";

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
  canStartDraft: boolean;
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
  canStartDraft,
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
  const shellClassName = ["quno-calendar-shell", className].filter(Boolean).join(" ");

  return (
    <section
      aria-label={ariaLabel}
      className={shellClassName}
      data-testid="quno-calendar-timeline"
      data-view="infinite-horizontal"
      style={style}
    >
      <div
        className={["quno-calendar-viewport", isDragging ? "is-dragging" : "", canStartDraft ? "is-create-enabled" : ""]
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
          className="quno-calendar-virtual-space"
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
