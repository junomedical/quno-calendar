import type { CalendarEvent, TimelineSettings } from "./types";
import { minuteToX, minutesSinceStartOfDay, timelineEndMinute, timelineStartMinute } from "./time";

export type EventLayoutItem = {
  event: CalendarEvent;
  left: number;
  width: number;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

type EventInterval = {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
};

export function rowHeightForOverlapDepth(baseRowHeight: number, laneCount: number): number {
  return baseRowHeight + Math.max(0, laneCount - 3) * 24;
}

export function laneCountForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return Math.max(1, ...layoutEventsForRow(events.filter((event) => event.kind !== "availability"), settings).map((item) => item.laneCount));
}

export function rowHeightForEvents(
  events: CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom" | "rowHeight">
): number {
  return rowHeightForOverlapDepth(settings.rowHeight, laneCountForEvents(events, settings));
}

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

function findAvailableLane(laneEnds: number[], startMinute: number): number {
  for (let lane = 0; lane < laneEnds.length; lane += 1) {
    if (laneEnds[lane] <= startMinute) {
      return lane;
    }
  }
  return laneEnds.length;
}

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
      const laneHeight = Math.max(4, (settings.rowHeight - 12) / laneInfo.laneCount);
      return {
        event: interval.event,
        left: minuteToX(interval.startMinute, settings),
        width: Math.max(12, minuteToX(interval.endMinute, settings) - minuteToX(interval.startMinute, settings)),
        top: 6 + laneInfo.lane * laneHeight,
        height: Math.max(4, laneHeight - 2),
        lane: laneInfo.lane,
        laneCount: laneInfo.laneCount,
        isOverlapping: laneInfo.laneCount > 1
      };
    });
  });
}
