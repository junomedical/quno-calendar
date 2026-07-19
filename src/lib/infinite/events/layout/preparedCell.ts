/**
 * Domain: Events.
 * Responsibility: Produces the deterministic overlap model shared by sizing and rendering.
 * Preserves: non-blocking rendering, request-generation safety, and deterministic layout.
 * Does not own: scroll writes and DOM projection.
 * Failure/cancellation: obsolete, aborted, or failed requests cannot replace a newer committed snapshot.
 *
 * @see docs/domains/events.md#source-map
 */
/**
 * Responsibility: prepare one orientation-neutral date/resource event cell.
 *
 * Flow: clipped intervals -> overlap groups -> lowest reusable lanes -> one
 * stable prepared model consumed by metrics, projections, hover, and hit tests.
 *
 * Preserves: deterministic lane order and availability exclusion from metric
 * depth while retaining availability items for rendering. Does not own pixel
 * projection, row/column growth policy, or React state.
 *
 * @see docs/architecture.md#prepared-cell-pipeline
 */
import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { eventIntervals, type EventInterval } from "./eventIntervals";
import { MinHeap } from "./minHeap";

/** Lane assignment and clipped time range shared by both visual projections. */
export type PreparedEventCellItem = {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
};

/**
 * Orientation-neutral layout for one date/calendar cell.
 *
 * `metricLaneCount` excludes availability records so background availability
 * never grows a row or column. `items` remains complete for API compatibility.
 */
export type PreparedEventCell = {
  items: PreparedEventCellItem[];
  laneCount: number;
  metricLaneCount: number;
};

type ActiveLane = {
  endMinute: number;
  lane: number;
};

function splitOverlapGroups(intervals: EventInterval[]): EventInterval[][] {
  const groups: EventInterval[][] = [];
  let group: EventInterval[] = [];
  let groupEnd = -Infinity;

  for (const interval of intervals) {
    if (group.length > 0 && interval.startMinute >= groupEnd) {
      groups.push(group);
      group = [interval];
      groupEnd = interval.endMinute;
      continue;
    }

    group.push(interval);
    groupEnd = Math.max(groupEnd, interval.endMinute);
  }

  if (group.length > 0) {
    groups.push(group);
  }

  return groups;
}

function releaseFinishedLanes(
  activeLanes: MinHeap<ActiveLane>,
  availableLanes: MinHeap<number>,
  startMinute: number
): void {
  while (activeLanes.peek() && activeLanes.peek()!.endMinute <= startMinute) {
    availableLanes.push(activeLanes.pop()!.lane);
  }
}

/** Assigns the lowest reusable lane in O(n log n), matching the legacy order. */
function prepareOverlapGroup(group: EventInterval[]): PreparedEventCellItem[] {
  const activeLanes = new MinHeap<ActiveLane>(
    (left, right) => left.endMinute - right.endMinute || left.lane - right.lane
  );
  const availableLanes = new MinHeap<number>((left, right) => left - right);
  const assignedLanes: number[] = [];
  let laneCount = 0;

  for (const interval of group) {
    releaseFinishedLanes(activeLanes, availableLanes, interval.startMinute);
    const availableLane = availableLanes.pop();
    const lane = availableLane ?? laneCount;
    if (availableLane === undefined) {
      laneCount += 1;
    }

    assignedLanes.push(lane);
    activeLanes.push({ endMinute: interval.endMinute, lane });
  }

  return group.map((interval, index) => ({
    event: interval.event,
    startMinute: interval.startMinute,
    endMinute: interval.endMinute,
    lane: assignedLanes[index],
    laneCount: Math.max(1, laneCount),
    isOverlapping: laneCount > 1
  }));
}

function maximumMetricLaneCount(intervals: EventInterval[]): number {
  const activeEnds = new MinHeap<number>((left, right) => left - right);
  let laneCount = 1;

  for (const interval of intervals) {
    if (interval.event.kind === "availability") {
      continue;
    }

    while (activeEnds.peek() !== undefined && activeEnds.peek()! <= interval.startMinute) {
      activeEnds.pop();
    }
    activeEnds.push(interval.endMinute);
    laneCount = Math.max(laneCount, activeEnds.size);
  }

  return laneCount;
}

/** Prepares one cell once for sizing, horizontal layout, and vertical layout. */
export function prepareEventCell(
  events: readonly CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour">
): PreparedEventCell {
  const intervals = eventIntervals(events, settings);
  const items = splitOverlapGroups(intervals).flatMap(prepareOverlapGroup);

  return {
    items,
    laneCount: items.reduce((maximum, item) => Math.max(maximum, item.laneCount), 1),
    metricLaneCount: maximumMetricLaneCount(intervals)
  };
}
