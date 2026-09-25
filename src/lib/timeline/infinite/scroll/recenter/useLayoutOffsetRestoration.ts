/**
 * Responsibility: preserve the top visible date through structural layout
 * changes identified by the caller's layout signature.
 *
 * Flow: signature change -> normalize saved date -> translate/clamp its local
 * offset -> reset measurement -> same-window scroll or pending re-anchor.
 * Preserves non-negative, date-local focus. Does not own late event-driven row
 * metrics, ordinary scroll recenter, or explicit event/slot restoration. The
 * initial signature records a baseline; unchanged signatures perform no write.
 *
 * @see docs/infinite-calendar/flows/virtual-scroll-and-recenter.md#position-snapshots-and-layout-changes
 */
import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import { normalizeAnchorDate } from "#quno-internal/timeline/date/dateVirtualization";
import type { PendingScrollTarget } from "#quno-internal/timeline/infinite/scroll/position/scrollPositionTypes";

export type ResolveOffsetOnLayoutChange = (args: {
  offsetWithinDate: number;
  previousBaseDayHeight: number;
  nextBaseDayHeight: number;
}) => number;

type UseLayoutOffsetRestorationArgs = {
  baseDayHeight: number;
  verticalLayoutSignature: string;
  topDateAlignmentKey: string;
  layoutAnchorDateKey?: string;
  excludedWeekdays: number[];
  currentWindowAnchorDateKey: string;
  topVisibleDateRef: MutableRefObject<string>;
  topVisibleOffsetRef: MutableRefObject<number>;
  pendingScrollTargetRef: MutableRefObject<PendingScrollTarget | null>;
  clearScrollEndTimer: () => void;
  measureVirtualizer: () => void;
  isDateInVirtualViewport: (args: { dateKey: string }) => boolean;
  scrollToVisibleDateOffset: (args: {
    dateKey: string;
    offsetWithinDate: number;
    preferBaseGeometry?: boolean;
    eagerRange?: boolean;
  }) => void;
  setAnchorDateKey: import("react").Dispatch<import("react").SetStateAction<string>>;
  projectRange: () => void;
  eagerRange: boolean;
  resolveOffsetOnLayoutChange?: ResolveOffsetOnLayoutChange;
};

function structuralOffset({
  alignToDateTop,
  offsetWithinDate,
  previousBaseDayHeight,
  nextBaseDayHeight,
  resolveOffset
}: {
  alignToDateTop: boolean;
  offsetWithinDate: number;
  previousBaseDayHeight: number;
  nextBaseDayHeight: number;
  resolveOffset?: ResolveOffsetOnLayoutChange;
}) {
  if (alignToDateTop) return 0;
  if (resolveOffset) return resolveOffset({ offsetWithinDate, previousBaseDayHeight, nextBaseDayHeight });
  return Math.min(offsetWithinDate, Math.max(0, nextBaseDayHeight - 1));
}

function scheduleSettledDateAlignment({
  enabled,
  dateKey,
  offsetWithinDate,
  preferBaseGeometry,
  scrollToVisibleDateOffset
}: {
  enabled: boolean;
  dateKey: string;
  offsetWithinDate: number;
  preferBaseGeometry: boolean;
  scrollToVisibleDateOffset: UseLayoutOffsetRestorationArgs["scrollToVisibleDateOffset"];
}) {
  if (!enabled) return undefined;
  let settledFrame = 0;
  const layoutFrame = window.requestAnimationFrame(() => {
    settledFrame = window.requestAnimationFrame(() => {
      scrollToVisibleDateOffset({ dateKey, offsetWithinDate, preferBaseGeometry });
    });
  });
  return () => {
    window.cancelAnimationFrame(layoutFrame);
    window.cancelAnimationFrame(settledFrame);
  };
}

export function useLayoutOffsetRestoration({
  baseDayHeight,
  verticalLayoutSignature,
  topDateAlignmentKey,
  layoutAnchorDateKey,
  excludedWeekdays,
  currentWindowAnchorDateKey,
  topVisibleDateRef,
  topVisibleOffsetRef,
  pendingScrollTargetRef,
  clearScrollEndTimer,
  measureVirtualizer,
  isDateInVirtualViewport,
  scrollToVisibleDateOffset,
  setAnchorDateKey,
  projectRange,
  eagerRange,
  resolveOffsetOnLayoutChange
}: UseLayoutOffsetRestorationArgs) {
  const previousLayoutSignatureRef = useRef("");
  const previousTopDateAlignmentKeyRef = useRef(topDateAlignmentKey);
  const previousBaseDayHeightRef = useRef(baseDayHeight);
  const previousExcludedWeekdaysKeyRef = useRef(excludedWeekdays.join("|"));
  const previousLayoutAnchorDateKeyRef = useRef(layoutAnchorDateKey);

  useLayoutEffect(() => {
    // The pin schedules reevaluation; signature identity still decides whether to write.
    void layoutAnchorDateKey;
    if (!previousLayoutSignatureRef.current) {
      // Mount establishes comparison state; the virtualizer already owns initialOffset.
      previousLayoutSignatureRef.current = verticalLayoutSignature;
      previousTopDateAlignmentKeyRef.current = topDateAlignmentKey;
      previousBaseDayHeightRef.current = baseDayHeight;
      previousExcludedWeekdaysKeyRef.current = excludedWeekdays.join("|");
      previousLayoutAnchorDateKeyRef.current = layoutAnchorDateKey;
      return;
    }
    if (previousLayoutSignatureRef.current === verticalLayoutSignature) {
      previousBaseDayHeightRef.current = baseDayHeight;
      previousLayoutAnchorDateKeyRef.current = layoutAnchorDateKey;
      return;
    }

    const possibleLayoutAnchorDateKey = layoutAnchorDateKey ?? previousLayoutAnchorDateKeyRef.current;
    const transitionLayoutAnchorDateKey =
      possibleLayoutAnchorDateKey && isDateInVirtualViewport({ dateKey: possibleLayoutAnchorDateKey })
        ? possibleLayoutAnchorDateKey
        : undefined;
    const topDateKey = normalizeAnchorDate({
      dateKey: transitionLayoutAnchorDateKey ?? topVisibleDateRef.current,
      excludedWeekdays
    });
    const excludedWeekdaysKey = excludedWeekdays.join("|");
    const dateSequenceChanged = previousExcludedWeekdaysKeyRef.current !== excludedWeekdaysKey;
    const alignTopVisibleDate =
      previousTopDateAlignmentKeyRef.current !== topDateAlignmentKey && !transitionLayoutAnchorDateKey;
    // Vertical views translate the time-relative portion; horizontal structural
    // changes use a conservative date-local clamp. Async row metrics use another path.
    const offsetWithinDate = Math.max(
      0,
      structuralOffset({
        alignToDateTop: Boolean(transitionLayoutAnchorDateKey) || alignTopVisibleDate,
        offsetWithinDate: topVisibleOffsetRef.current,
        previousBaseDayHeight: previousBaseDayHeightRef.current,
        nextBaseDayHeight: baseDayHeight,
        resolveOffset: resolveOffsetOnLayoutChange
      })
    );
    clearScrollEndTimer();
    previousLayoutSignatureRef.current = verticalLayoutSignature;
    previousTopDateAlignmentKeyRef.current = topDateAlignmentKey;
    previousBaseDayHeightRef.current = baseDayHeight;
    previousExcludedWeekdaysKeyRef.current = excludedWeekdaysKey;
    previousLayoutAnchorDateKeyRef.current = layoutAnchorDateKey;
    measureVirtualizer();
    topVisibleDateRef.current = topDateKey;
    topVisibleOffsetRef.current = offsetWithinDate;

    const scheduleSettledAlignment = () =>
      scheduleSettledDateAlignment({
        enabled: alignTopVisibleDate || dateSequenceChanged,
        dateKey: topDateKey,
        offsetWithinDate: alignTopVisibleDate ? 0 : offsetWithinDate,
        preferBaseGeometry: Boolean(resolveOffsetOnLayoutChange),
        scrollToVisibleDateOffset
      });

    if (topDateKey === currentWindowAnchorDateKey) {
      // Avoid rebuilding an already-correct date model; restore its local point now.
      pendingScrollTargetRef.current = null;
      scrollToVisibleDateOffset({
        dateKey: topDateKey,
        offsetWithinDate,
        preferBaseGeometry: Boolean(resolveOffsetOnLayoutChange) || dateSequenceChanged,
        eagerRange
      });
      if (eagerRange) projectRange();
      return scheduleSettledAlignment();
    }
    // A different window consumes this target in useVirtualWindowNavigation's layout effect.
    pendingScrollTargetRef.current = { dateKey: topDateKey, offsetWithinDate, eagerRange };
    setAnchorDateKey(() => topDateKey);
    return scheduleSettledAlignment();
  }, [
    baseDayHeight,
    clearScrollEndTimer,
    currentWindowAnchorDateKey,
    excludedWeekdays,
    layoutAnchorDateKey,
    measureVirtualizer,
    isDateInVirtualViewport,
    pendingScrollTargetRef,
    projectRange,
    eagerRange,
    resolveOffsetOnLayoutChange,
    scrollToVisibleDateOffset,
    setAnchorDateKey,
    topVisibleDateRef,
    topVisibleOffsetRef,
    topDateAlignmentKey,
    verticalLayoutSignature
  ]);
}
