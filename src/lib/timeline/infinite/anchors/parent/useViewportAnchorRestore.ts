import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type {
  QunoInfiniteCalendarHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget
} from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistry } from "./viewportGeometryRegistry";
import { ViewportAnchorRestoreSession } from "./viewportAnchorRestoreSession";

type RestoreOptions = Parameters<QunoInfiniteCalendarHandle["restoreViewportAnchor"]>[0] & {
  resolveAnchorSnapshot?: () => CalendarViewportAnchor["snapshot"];
};
type RestoreRequest = {
  anchor: CalendarViewportAnchor;
  target: CalendarViewportAnchorTarget;
  options: CalendarViewportAnchorRestoreOptions;
  resolveAnchorSnapshot?: RestoreOptions["resolveAnchorSnapshot"];
};
type RestoreArgs = {
  containerRef: RefObject<HTMLElement | null>;
  registry: ViewportGeometryRegistry;
  resolveSnapshot: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor["snapshot"] | null;
  scrollToDateTime: QunoInfiniteCalendarHandle["scrollToDateTime"];
  scrollToDate?: QunoInfiniteCalendarHandle["scrollToDate"];
};

/** Starts each restore after parent props and registered geometry commit. See docs/infinite-calendar/domains/anchors.md. */
export function useViewportAnchorRestore(args: RestoreArgs) {
  const restoreTokenRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pendingRestoreRef = useRef<RestoreRequest | null>(null);
  const [activeRestoreTarget, setActiveRestoreTarget] = useState<CalendarViewportAnchorTarget | null>(null);

  const cancelViewportAnchorRestore = useCallback(() => {
    restoreTokenRef.current += 1;
    pendingRestoreRef.current = null;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setActiveRestoreTarget(null);
  }, []);
  useEffect(() => () => cancelViewportAnchorRestore(), [cancelViewportAnchorRestore]);

  const restoreViewportAnchor = useCallback<(options: RestoreOptions) => void>(
    ({ anchor, resolveAnchorSnapshot, ...options }) => {
      if (!anchor) {
        return;
      }
      cancelViewportAnchorRestore();
      const target = options.target ?? anchor.target;
      pendingRestoreRef.current = { anchor, target, options, resolveAnchorSnapshot };
      setActiveRestoreTarget({ ...target });
    },
    [cancelViewportAnchorRestore]
  );

  useLayoutEffect(() => {
    const request = pendingRestoreRef.current;
    if (!request) {
      return;
    }
    pendingRestoreRef.current = null;
    const viewport = args.containerRef.current;
    if (!viewport) {
      return;
    }
    const token = restoreTokenRef.current;
    const session = new ViewportAnchorRestoreSession({
      ...request,
      viewport,
      registry: args.registry,
      resolveSnapshot: args.resolveSnapshot,
      scrollToDateTime: args.scrollToDateTime,
      scrollToDate: args.scrollToDate,
      isCurrent: () => restoreTokenRef.current === token,
      cancel: cancelViewportAnchorRestore
    });
    cleanupRef.current = session.start();
  }, [
    activeRestoreTarget,
    args.containerRef,
    args.registry,
    args.resolveSnapshot,
    args.scrollToDateTime,
    args.scrollToDate,
    cancelViewportAnchorRestore
  ]);

  return { activeRestoreTarget, restoreViewportAnchor, cancelViewportAnchorRestore };
}
