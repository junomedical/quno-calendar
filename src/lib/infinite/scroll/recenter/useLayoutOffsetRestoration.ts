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
 * @see docs/flows/virtual-scroll-and-recenter.md#position-snapshots-and-layout-changes
 */
import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import { normalizeAnchorDate } from "../../../date/dateVirtualization";
import type { PendingScrollTarget } from "../position/scrollPositionTypes";

export type ResolveOffsetOnLayoutChange = (
  offsetWithinDate: number,
  previousBaseDayHeight: number,
  nextBaseDayHeight: number
) => number;

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
  scrollToVisibleDateOffset: (dateKey: string, offsetWithinDate: number, preferBaseGeometry?: boolean) => void;
  setAnchorDateKey: (updater: (current: string) => string) => void;
  resolveOffsetOnLayoutChange?: ResolveOffsetOnLayoutChange;
};

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
  scrollToVisibleDateOffset,
  setAnchorDateKey,
  resolveOffsetOnLayoutChange
}: UseLayoutOffsetRestorationArgs) {
  const previousLayoutSignatureRef = useRef("");
  const previousTopDateAlignmentKeyRef = useRef(topDateAlignmentKey);
  const previousBaseDayHeightRef = useRef(baseDayHeight);

  useLayoutEffect(() => {
    // The pin schedules reevaluation; signature identity still decides whether to write.
    void layoutAnchorDateKey;
    if (!previousLayoutSignatureRef.current) {
      // Mount establishes comparison state; the virtualizer already owns initialOffset.
      previousLayoutSignatureRef.current = verticalLayoutSignature;
      previousTopDateAlignmentKeyRef.current = topDateAlignmentKey;
      previousBaseDayHeightRef.current = baseDayHeight;
      return;
    }
    if (previousLayoutSignatureRef.current === verticalLayoutSignature) {
      previousBaseDayHeightRef.current = baseDayHeight;
      return;
    }

    const topDateKey = normalizeAnchorDate(topVisibleDateRef.current, excludedWeekdays);
    const alignTopVisibleDate = previousTopDateAlignmentKeyRef.current !== topDateAlignmentKey;
    // Vertical views translate the time-relative portion; horizontal structural
    // changes use a conservative date-local clamp. Async row metrics use another path.
    const offsetWithinDate = Math.max(
      0,
      alignTopVisibleDate
        ? 0
        : resolveOffsetOnLayoutChange
          ? resolveOffsetOnLayoutChange(topVisibleOffsetRef.current, previousBaseDayHeightRef.current, baseDayHeight)
          : Math.min(topVisibleOffsetRef.current, Math.max(0, baseDayHeight - 1))
    );
    clearScrollEndTimer();
    previousLayoutSignatureRef.current = verticalLayoutSignature;
    previousTopDateAlignmentKeyRef.current = topDateAlignmentKey;
    previousBaseDayHeightRef.current = baseDayHeight;
    measureVirtualizer();
    topVisibleDateRef.current = topDateKey;
    topVisibleOffsetRef.current = offsetWithinDate;

    const scheduleSettledDateAlignment = () => {
      if (!alignTopVisibleDate) return undefined;
      let settledFrame = 0;
      const layoutFrame = window.requestAnimationFrame(() => {
        settledFrame = window.requestAnimationFrame(() => {
          scrollToVisibleDateOffset(topDateKey, 0, Boolean(resolveOffsetOnLayoutChange));
        });
      });
      return () => {
        window.cancelAnimationFrame(layoutFrame);
        window.cancelAnimationFrame(settledFrame);
      };
    };

    if (topDateKey === currentWindowAnchorDateKey) {
      // Avoid rebuilding an already-correct date model; restore its local point now.
      pendingScrollTargetRef.current = null;
      scrollToVisibleDateOffset(topDateKey, offsetWithinDate, Boolean(resolveOffsetOnLayoutChange));
      return scheduleSettledDateAlignment();
    }
    // A different window consumes this target in useVirtualWindowNavigation's layout effect.
    pendingScrollTargetRef.current = { dateKey: topDateKey, offsetWithinDate };
    setAnchorDateKey(() => topDateKey);
    return scheduleSettledDateAlignment();
  }, [
    baseDayHeight,
    clearScrollEndTimer,
    currentWindowAnchorDateKey,
    excludedWeekdays,
    layoutAnchorDateKey,
    measureVirtualizer,
    pendingScrollTargetRef,
    resolveOffsetOnLayoutChange,
    scrollToVisibleDateOffset,
    setAnchorDateKey,
    topVisibleDateRef,
    topVisibleOffsetRef,
    topDateAlignmentKey,
    verticalLayoutSignature
  ]);
}
