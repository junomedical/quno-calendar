import type { RefObject } from "react";
import type { QunoInfiniteCalendarHandle, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import type { useViewportAnchoring } from "#quno-internal/timeline/infinite/anchors/parent/useViewportAnchoring";
import { minuteToX, parseClockToMinutes } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

type RowNavigationArgs = { containerRef: RefObject<HTMLDivElement | null>; settings: QunoInfiniteCalendarSettings } & {
  request: Parameters<QunoInfiniteCalendarHandle["scrollToDateTime"]>[0];
  anchoring: ReturnType<typeof useViewportAnchoring>;
  scrollToDateTimeBase: QunoInfiniteCalendarHandle["scrollToDateTime"];
  scrollToTime: (args: { time: string }) => void;
};

export function scrollToRow({
  request,
  containerRef,
  settings,
  anchoring,
  scrollToDateTimeBase,
  scrollToTime
}: RowNavigationArgs) {
  const { date: dateKey, time, calendarId, align } = request;
  const { getResourceElement, restoreViewportAnchor } = anchoring;
  const viewport = containerRef.current;
  if (!calendarId || !viewport || !/^\d{2}:\d{2}$/.test(time)) {
    scrollToDateTimeBase({ date: dateKey, time });
    return;
  }

  const row = getResourceElement({ dateKey, calendarId });
  if (row?.dataset.retainedHidden === "true") {
    scrollToDateTimeBase({ date: dateKey, time });
    return;
  }

  const viewportBox = viewport.getBoundingClientRect();
  const rowBox = row?.getBoundingClientRect();
  scrollToTime({ time });
  if (
    align !== "center" &&
    rowBox &&
    rowBox.top >= viewportBox.top + settings.dayHeaderHeight &&
    rowBox.bottom <= viewportBox.bottom - 8
  ) {
    return;
  }

  const target = { dateKey, time, calendarId };
  const rowHeight = rowBox?.height ?? settings.rowHeight;
  const top = Math.max(settings.dayHeaderHeight, (viewport.clientHeight + settings.dayHeaderHeight - rowHeight) / 2);
  const left =
    settings.labelWidth +
    TIMELINE_LEFT_GUTTER_PX +
    minuteToX({ minute: parseClockToMinutes({ clock: time }), geometry: settings }) -
    viewport.scrollLeft;
  const resolveAnchorSnapshot =
    align === "center"
      ? () => {
          const height =
            getResourceElement({ dateKey, calendarId })?.getBoundingClientRect().height ?? settings.rowHeight;
          return {
            left,
            top: Math.max(settings.dayHeaderHeight, (viewport.clientHeight + settings.dayHeaderHeight - height) / 2)
          };
        }
      : undefined;
  restoreViewportAnchor({
    resolveAnchorSnapshot,
    anchor: { target, snapshot: { top, left } },
    afterRecenter: true,
    cancelOnManualScroll: true
  });
}
