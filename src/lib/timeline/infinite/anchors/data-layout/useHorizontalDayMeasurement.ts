/**
 * Responsibility: commit horizontal event-driven day sizes without moving the
 * semantic grid slot currently at the viewport's top edge.
 *
 * Flow:
 * previous metrics -> capture date/resource/local-row anchor -> resize dates
 * current metrics  ------------------------------------------> restore anchor
 *
 * Preserves: date header focus for exact navigation, or the visible resource
 * row and its local offset for mid-date scrolling. `scrollLeft` is untouched.
 * Does not own: parent viewport restores, pointer gestures, or zoom anchoring.
 *
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md
 */
import type { Virtualizer } from "@tanstack/react-virtual";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { CalendarId } from "#quno-internal/timeline/core/types";
import {
  resolveVisibleDateSnapshot,
  type VisibleDateSnapshot
} from "#quno-internal/timeline/infinite/scroll/position/visibleSnapshot";
import {
  captureHorizontalDataLayoutAnchor,
  resolveHorizontalDataLayoutOffset,
  type HorizontalDataLayoutAnchor,
  type HorizontalDayMetric
} from "./horizontalDataLayoutAnchor";

type DayMetrics = ReadonlyMap<string, HorizontalDayMetric>;
type DayVirtualizer = Pick<
  Virtualizer<HTMLDivElement, Element>,
  | "calculateRange"
  | "getOffsetForIndex"
  | "getVirtualItemForOffset"
  | "getVirtualItems"
  | "measure"
  | "resizeItem"
  | "scrollOffset"
  | "scrollToOffset"
>;

type HorizontalDayMeasurementArgs = {
  baseDayHeight: number;
  baseRowHeight: number;
  calendarIds: readonly CalendarId[];
  containerRef: RefObject<HTMLDivElement | null>;
  dateKeyForIndex: (args: { index: number }) => string;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  dayHeaderHeight: number;
  dayMetricsByDate: DayMetrics;
  layoutSignature: string;
  preserveVisibleResource: boolean;
  measureBaseDuringDateRestore?: boolean;
  deferBaseMeasurement: boolean;
  virtualItemCount: number;
  virtualizer: DayVirtualizer;
  refreshViewport: () => void;
  readVisibleSnapshot?: () => VisibleDateSnapshot;
};

export function useHorizontalDayMeasurement({
  baseDayHeight,
  baseRowHeight,
  calendarIds,
  containerRef,
  dateKeyForIndex,
  dateKeyToIndex,
  dayHeaderHeight,
  dayMetricsByDate,
  layoutSignature,
  preserveVisibleResource,
  measureBaseDuringDateRestore = false,
  deferBaseMeasurement,
  virtualItemCount,
  virtualizer,
  refreshViewport,
  readVisibleSnapshot
}: HorizontalDayMeasurementArgs) {
  const previousMetricsRef = useRef(dayMetricsByDate);
  const previousLayoutSignatureRef = useRef(layoutSignature);
  const previousCalendarIdsRef = useRef(calendarIds);
  const previousBaseHeightRef = useRef(baseDayHeight);
  const dateRestoreMeasuredRef = useRef(false);
  const pendingAnchorRef = useRef<HorizontalDataLayoutAnchor | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  useLayoutEffect(() => {
    const previousMetrics = previousMetricsRef.current;
    const structuralLayoutChanged = previousLayoutSignatureRef.current !== layoutSignature;
    const viewport = containerRef.current;
    const snapshot =
      viewport && preserveVisibleResource && !structuralLayoutChanged
        ? resolveVisibleDateSnapshot({
            snapshotBeforeResize: previousBaseHeightRef.current !== baseDayHeight ? readVisibleSnapshot?.() : undefined,
            scrollTop: viewport.scrollTop,
            getItemForOffset: ({ offset }) => virtualizer.getVirtualItemForOffset(offset),
            virtualItems: virtualizer.getVirtualItems(),
            dateKeyForIndex
          })
        : null;
    const previousGeometry = { calendarIds: previousCalendarIdsRef.current, dayHeaderHeight, baseRowHeight };
    const nextGeometry = { calendarIds, dayHeaderHeight, baseRowHeight };
    const restoringCommittedAnchor = pendingAnchorRef.current !== null;
    const anchor =
      preserveVisibleResource && !structuralLayoutChanged
        ? (pendingAnchorRef.current ??
          (snapshot
            ? captureHorizontalDataLayoutAnchor({
                dateKey: snapshot.dateKey,
                offsetWithinDate: snapshot.offsetWithinDate,
                metric: previousMetrics.get(snapshot.dateKey),
                geometry: previousGeometry
              })
            : null))
        : null;
    pendingAnchorRef.current = null;

    // Changed estimates do not invalidate TanStack's cached prefix positions.
    // Capture first, clear those estimates, then restore known dense-day sizes.
    if (!measureBaseDuringDateRestore) dateRestoreMeasuredRef.current = false;
    // A draft can return to its original row count with compact prefix sizes
    // still cached. Refresh once after the draft releases for a date restore.
    const baseHeightChanged =
      (previousBaseHeightRef.current !== baseDayHeight ||
        (measureBaseDuringDateRestore && !dateRestoreMeasuredRef.current)) &&
      (preserveVisibleResource || measureBaseDuringDateRestore) &&
      !deferBaseMeasurement;
    if (baseHeightChanged) {
      virtualizer.measure();
      previousBaseHeightRef.current = baseDayHeight;
      dateRestoreMeasuredRef.current = measureBaseDuringDateRestore;
    }
    const metricHeightsChanged = resizeAffectedDays({
      previousMetrics,
      nextMetrics: dayMetricsByDate,
      baseDayHeight,
      dateKeyToIndex,
      virtualItemCount,
      virtualizer
    });
    previousMetricsRef.current = dayMetricsByDate;
    previousLayoutSignatureRef.current = layoutSignature;
    previousCalendarIdsRef.current = calendarIds;
    if ((baseHeightChanged || metricHeightsChanged) && anchor) {
      // Late overlap growth can exceed the old spacer just like a row-count
      // expansion. Keep the original focus through the spacer commit; never
      // infer a new focus from its temporarily clamped absolute scroll offset.
      pendingAnchorRef.current = anchor;
      setLayoutVersion((version) => version + 1);
      return;
    }
    if (!viewport || !anchor) return;

    // `resizeItem` invalidates cached prefix positions; materialize them before
    // asking for the translated date start in this same pre-paint effect.
    virtualizer.getVirtualItems();
    const index = dateKeyToIndex({ dateKey: anchor.dateKey });
    const dateStart = virtualizer.getOffsetForIndex(index, "start")?.[0];
    if (dateStart === undefined) return;
    const nextOffset = resolveHorizontalDataLayoutOffset({
      anchor,
      metric: dayMetricsByDate.get(anchor.dateKey),
      geometry: nextGeometry
    });
    const nextScrollTop = dateStart + nextOffset;
    if (Math.abs(viewport.scrollTop - nextScrollTop) > 0.5) {
      virtualizer.scrollToOffset(nextScrollTop, { align: "start" });
    }
    // Native scroll observation runs later. Publish the intended range now so
    // the queued projection and loader cannot use the previous absolute offset.
    virtualizer.scrollOffset = nextScrollTop;
    virtualizer.calculateRange();
    refreshViewport();
    // This commit rendered before the corrected range was published. Project
    // it once more before paint so the anchored row cannot briefly disappear.
    if (restoringCommittedAnchor) setLayoutVersion((version) => version + 1);
  }, [
    baseDayHeight,
    baseRowHeight,
    calendarIds,
    containerRef,
    dateKeyForIndex,
    dateKeyToIndex,
    dayHeaderHeight,
    dayMetricsByDate,
    deferBaseMeasurement,
    layoutSignature,
    layoutVersion,
    preserveVisibleResource,
    measureBaseDuringDateRestore,
    refreshViewport,
    readVisibleSnapshot,
    virtualItemCount,
    virtualizer
  ]);
}

function resizeAffectedDays({
  previousMetrics,
  nextMetrics,
  baseDayHeight,
  dateKeyToIndex,
  virtualItemCount,
  virtualizer
}: {
  previousMetrics: DayMetrics;
  nextMetrics: DayMetrics;
  baseDayHeight: number;
  dateKeyToIndex: (args: { dateKey: string }) => number;
  virtualItemCount: number;
  virtualizer: DayVirtualizer;
}) {
  const affectedDateKeys = new Set([...previousMetrics.keys(), ...nextMetrics.keys()]);
  let heightsChanged = false;
  for (const dateKey of affectedDateKeys) {
    const index = dateKeyToIndex({ dateKey });
    if (index >= 0 && index < virtualItemCount) {
      const height = nextMetrics.get(dateKey)?.height ?? baseDayHeight;
      heightsChanged ||= height !== (previousMetrics.get(dateKey)?.height ?? baseDayHeight);
      virtualizer.resizeItem(index, height);
    }
  }
  return heightsChanged;
}
