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
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { CalendarId } from "#quno-internal/timeline/core/types";
import { resolveVisibleDateSnapshot } from "#quno-internal/timeline/infinite/scroll/position/visibleSnapshot";
import {
  captureHorizontalDataLayoutAnchor,
  resolveHorizontalDataLayoutOffset,
  type HorizontalDayMetric
} from "./horizontalDataLayoutAnchor";

type DayMetrics = ReadonlyMap<string, HorizontalDayMetric>;
type DayVirtualizer = Pick<
  Virtualizer<HTMLDivElement, Element>,
  "getOffsetForIndex" | "getVirtualItemForOffset" | "getVirtualItems" | "measure" | "resizeItem" | "scrollToOffset"
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
  virtualItemCount: number;
  virtualizer: DayVirtualizer;
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
  virtualItemCount,
  virtualizer
}: HorizontalDayMeasurementArgs) {
  const previousMetricsRef = useRef(dayMetricsByDate);
  const previousLayoutSignatureRef = useRef(layoutSignature);
  const previousCalendarIdsRef = useRef(calendarIds);

  useLayoutEffect(() => {
    const previousMetrics = previousMetricsRef.current;
    const structuralLayoutChanged = previousLayoutSignatureRef.current !== layoutSignature;
    const viewport = containerRef.current;
    const snapshot =
      viewport && preserveVisibleResource && !structuralLayoutChanged
        ? resolveVisibleDateSnapshot({
            scrollTop: viewport.scrollTop,
            getItemForOffset: ({ offset }) => virtualizer.getVirtualItemForOffset(offset),
            virtualItems: virtualizer.getVirtualItems(),
            dateKeyForIndex
          })
        : null;
    const previousGeometry = { calendarIds: previousCalendarIdsRef.current, dayHeaderHeight, baseRowHeight };
    const nextGeometry = { calendarIds, dayHeaderHeight, baseRowHeight };
    const anchor = snapshot
      ? captureHorizontalDataLayoutAnchor({
          dateKey: snapshot.dateKey,
          offsetWithinDate: snapshot.offsetWithinDate,
          metric: previousMetrics.get(snapshot.dateKey),
          geometry: previousGeometry
        })
      : null;

    resizeAffectedDays({
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
  }, [
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
  if (affectedDateKeys.size === 0) {
    virtualizer.measure();
    return;
  }
  for (const dateKey of affectedDateKeys) {
    const index = dateKeyToIndex({ dateKey });
    if (index >= 0 && index < virtualItemCount) {
      virtualizer.resizeItem(index, nextMetrics.get(dateKey)?.height ?? baseDayHeight);
    }
  }
}
