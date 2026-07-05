import type { CalendarEvent, TimelineSettings } from "../core/types";
import { minuteToX, minutesSinceStartOfDay, timelineEndMinute, timelineStartMinute } from "../time/time";

/** Positioned event geometry for one rendered calendar row. */
export type EventLayoutItem = {
  event: CalendarEvent;
  left: number;
  width: number;
  top: number;
  height: number;
  laneHeight: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

type EventInterval = {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
};

/** Grows only the dense row as overlap lanes require more vertical space. */
export function rowHeightForOverlapDepth(baseRowHeight: number, laneCount: number): number {
  if (laneCount <= 1) {
    return baseRowHeight;
  }

  const steppedHeight = laneCount === 2 ? 60 : laneCount === 3 ? 75 : 80 + Math.max(0, laneCount - 4) * 20;
  const minimumRestingShellHeight = 20;
  const laneHoverSlack = 4;
  return Math.max(baseRowHeight, steppedHeight, laneCount * (minimumRestingShellHeight + laneHoverSlack));
}

/** Computes the maximum lane count needed to render non-availability events. */
export function laneCountForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return Math.max(1, ...layoutEventsForRow(events.filter((event) => event.kind !== "availability"), settings).map((item) => item.laneCount));
}

/** Computes a row height from event overlap depth. */
export function rowHeightForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return rowHeightForOverlapDepth(settings.rowHeight, laneCountForEvents(events, settings));
}

/** Splits sorted intervals into connected overlap chains. */
function groupOverlaps(intervals: EventInterval[]): EventInterval[][] {
  const sorted = [...intervals].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const groups: EventInterval[][] = [];
  let currentGroup: EventInterval[] = [];
  let currentGroupEnd = -Infinity;

  for (const interval of sorted) {
    if (currentGroup.length === 0 || interval.startMinute < currentGroupEnd) {
      currentGroup.push(interval);
      currentGroupEnd = Math.max(currentGroupEnd, interval.endMinute);
      continue;
    }

    groups.push(currentGroup);
    currentGroup = [interval];
    currentGroupEnd = interval.endMinute;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/** Finds the first reusable mini-lane whose previous interval already ended. */
function findAvailableLane(laneEnds: number[], startMinute: number): number {
  for (let lane = 0; lane < laneEnds.length; lane += 1) {
    if (laneEnds[lane] <= startMinute) {
      return lane;
    }
  }
  return laneEnds.length;
}

/** Assigns compact mini-lanes inside one connected overlap chain. */
function assignLanes(group: EventInterval[]): Map<string, { lane: number; laneCount: number }> {
  const sorted = [...group].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();

  for (const interval of sorted) {
    const lane = findAvailableLane(laneEnds, interval.startMinute);
    if (lane === laneEnds.length) {
      laneEnds.push(interval.endMinute);
    } else {
      laneEnds[lane] = interval.endMinute;
    }
    lanes.set(interval.event.id, lane);
  }

  const laneCount = Math.max(1, laneEnds.length);
  return new Map(sorted.map((interval) => [interval.event.id, { lane: lanes.get(interval.event.id) ?? 0, laneCount }]));
}

/** Converts row events into positioned shells with compact overlap lanes. */
export function layoutEventsForRow(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): EventLayoutItem[] {
  const timelineStart = timelineStartMinute(settings);
  const timelineEnd = timelineEndMinute(settings);
  const intervals = events
    .map((event) => ({
      event,
      startMinute: Math.max(timelineStart, minutesSinceStartOfDay(event.start)),
      endMinute: Math.min(timelineEnd, minutesSinceStartOfDay(event.end))
    }))
    .filter((interval) => interval.endMinute > timelineStart && interval.startMinute < timelineEnd);

  return groupOverlaps(intervals).flatMap((group) => {
    const laneMap = assignLanes(group);
    return group.map((interval) => {
      const laneInfo = laneMap.get(interval.event.id) ?? { lane: 0, laneCount: 1 };
      const laneHeight = Math.max(1, settings.rowHeight / laneInfo.laneCount);
      const laneInset = Math.min(2, Math.max(0, (laneHeight - 1) / 2));
      return {
        event: interval.event,
        left: minuteToX(interval.startMinute, settings),
        width: Math.max(12, minuteToX(interval.endMinute, settings) - minuteToX(interval.startMinute, settings)),
        top: laneInfo.lane * laneHeight + laneInset,
        height: Math.max(1, laneHeight - laneInset * 2),
        laneHeight,
        lane: laneInfo.lane,
        laneCount: laneInfo.laneCount,
        isOverlapping: laneInfo.laneCount > 1
      };
    });
  });
}
