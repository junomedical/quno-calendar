/**
 * Responsibility: prepare one orientation-neutral date/resource event cell.
 *
 * Flow: clipped intervals -> overlap groups -> lowest reusable lanes -> one
 * stable prepared model consumed by metrics, projections, hover, and hit tests.
 *
 * Preserves: deterministic lane order within each independently prepared
 * visual layer. Does not own pixel projection, row/column growth policy, or
 * React state.
 *
 * @see docs/infinite-calendar/architecture.md#prepared-cell-pipeline
 */
import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
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
 * `metricLaneCount` is the maximum overlap depth in this cell.
 */
export type PreparedEventCell = {
  items: PreparedEventCellItem[];
  laneCount: number;
  metricLaneCount: number;
};

/** Independently prepared foreground and availability lanes for one resource. */
export type PreparedEventLayers = {
  events: PreparedEventCell;
  availability: PreparedEventCell;
  metricLaneCount: number;
};

type ActiveLane = {
  endMinute: number;
  lane: number;
};

function splitOverlapGroups({ intervals }: { intervals: EventInterval[] }): EventInterval[][] {
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

function releaseFinishedLanes({
  activeLanes,
  availableLanes,
  startMinute
}: {
  activeLanes: MinHeap<ActiveLane>;
  availableLanes: MinHeap<number>;
  startMinute: number;
}): void {
  while (activeLanes.peek() && activeLanes.peek()!.endMinute <= startMinute) {
    availableLanes.push({ value: activeLanes.pop()!.lane });
  }
}

/** Assigns the lowest reusable lane in O(n log n), matching the legacy order. */
function prepareOverlapGroup({ group }: { group: EventInterval[] }): PreparedEventCellItem[] {
  const activeLanes = new MinHeap<ActiveLane>({
    compare: ({ left, right }) => left.endMinute - right.endMinute || left.lane - right.lane
  });
  const availableLanes = new MinHeap<number>({ compare: ({ left, right }) => left - right });
  const assignedLanes: number[] = [];
  let laneCount = 0;

  for (const interval of group) {
    releaseFinishedLanes({ activeLanes, availableLanes, startMinute: interval.startMinute });
    const availableLane = availableLanes.pop();
    const lane = availableLane ?? laneCount;
    if (availableLane === undefined) {
      laneCount += 1;
    }

    assignedLanes.push(lane);
    activeLanes.push({ value: { endMinute: interval.endMinute, lane } });
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

function maximumMetricLaneCount({ intervals }: { intervals: EventInterval[] }): number {
  const activeEnds = new MinHeap<number>({ compare: ({ left, right }) => left - right });
  let laneCount = 1;

  for (const interval of intervals) {
    while (activeEnds.peek() !== undefined && activeEnds.peek()! <= interval.startMinute) {
      activeEnds.pop();
    }
    activeEnds.push({ value: interval.endMinute });
    laneCount = Math.max(laneCount, activeEnds.size);
  }

  return laneCount;
}

/** Prepares one cell once for sizing, horizontal layout, and vertical layout. */
export function prepareEventCell({
  events,
  settings
}: {
  events: readonly CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour">;
}): PreparedEventCell {
  const intervals = eventIntervals({ events, settings });
  const items = splitOverlapGroups({ intervals }).flatMap((argument0) => prepareOverlapGroup({ group: argument0 }));

  return {
    items,
    laneCount: items.reduce((maximum, item) => Math.max(maximum, item.laneCount), 1),
    metricLaneCount: maximumMetricLaneCount({ intervals })
  };
}

/** Partitions a resource once and prepares each visual layer independently. */
export function prepareEventLayers({
  events,
  settings
}: {
  events: readonly CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour">;
}): PreparedEventLayers {
  const foreground: CalendarEvent[] = [];
  const availability: CalendarEvent[] = [];
  for (const event of events) {
    (event.kind === "availability" ? availability : foreground).push(event);
  }
  const preparedEvents = prepareEventCell({ events: foreground, settings });
  const preparedAvailability = prepareEventCell({ events: availability, settings });
  return {
    events: preparedEvents,
    availability: preparedAvailability,
    metricLaneCount: Math.max(preparedEvents.metricLaneCount, preparedAvailability.metricLaneCount)
  };
}
