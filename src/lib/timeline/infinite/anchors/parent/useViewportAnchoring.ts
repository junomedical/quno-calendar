import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { minuteToX, minuteToY, parseClockToMinutes } from "#quno-internal/timeline/time/time";
import type {
  QunoInfiniteCalendarHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { ViewportGeometryRegistration } from "./viewportAnchorTypes";
import { relativeSnapshot, ViewportGeometryRegistry } from "./viewportGeometryRegistry";
import { ViewportAnchorRestoreSession } from "./viewportAnchorRestoreSession";

type AnchoringArgs = {
  containerRef: RefObject<HTMLElement | null>;
  settings: QunoInfiniteCalendarSettings;
  orientation: "horizontal" | "vertical";
  scrollToDateTime: QunoInfiniteCalendarHandle["scrollToDateTime"];
  verticalTimelineGutterPx?: number;
  visibilityInsets?: { left?: number; top?: number };
};

function insetViewportBox({
  viewport,
  leftInset = 0,
  topInset = 0
}: {
  viewport: HTMLElement;
  leftInset?: number;
  topInset?: number;
}) {
  const box = viewport.getBoundingClientRect();
  return {
    left: box.left + leftInset,
    top: box.top + topInset,
    right: box.right,
    bottom: box.bottom,
    width: Math.max(0, box.width - leftInset),
    height: Math.max(0, box.height - topInset)
  } as DOMRect;
}

function captureAnchor({
  target,
  resolveSnapshot
}: {
  target: CalendarViewportAnchorTarget;
  resolveSnapshot: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor["snapshot"] | null;
}) {
  const snapshot = resolveSnapshot(target);
  return snapshot ? { snapshot, target } : null;
}

/** Captures and restores event/slot geometry through an instance-owned registry. */
export function useViewportAnchoring(args: AnchoringArgs) {
  const registry = useMemo(() => new ViewportGeometryRegistry(), []);
  const restoreTokenRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [activeRestoreTarget, setActiveRestoreTarget] = useState<CalendarViewportAnchorTarget | null>(null);

  const cancelViewportAnchorRestore = useCallback(() => {
    restoreTokenRef.current += 1;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setActiveRestoreTarget(null);
  }, []);

  useEffect(() => registry.invalidate(), [args.orientation, args.settings, registry]);
  useEffect(
    () => () => {
      cancelViewportAnchorRestore();
    },
    [cancelViewportAnchorRestore]
  );

  const resolveSnapshot = useCallback(
    (target: CalendarViewportAnchorTarget) => {
      const viewport = args.containerRef.current;
      if (!viewport) return null;
      const viewportBox = viewport.getBoundingClientRect();
      const event = registry.event({ target, viewportBox });
      if (event) return relativeSnapshot({ element: event, viewportBox });
      if (!target.dateKey || !target.calendarId) return null;
      const resource = registry.resource({ dateKey: target.dateKey, calendarId: target.calendarId });
      if (!resource) return null;
      const resourceBox = resource.getBoundingClientRect();
      const minute =
        target.time && /^\d{2}:\d{2}$/.test(target.time) ? parseClockToMinutes({ clock: target.time }) : null;
      if (args.orientation === "horizontal") {
        return {
          top: resourceBox.top - viewportBox.top,
          left:
            resourceBox.left -
            viewportBox.left +
            args.settings.labelWidth +
            TIMELINE_LEFT_GUTTER_PX +
            (minute === null ? 0 : minuteToX({ minute, geometry: args.settings }))
        };
      }
      return {
        top:
          resourceBox.top -
          viewportBox.top +
          (args.verticalTimelineGutterPx ?? 0) +
          (minute === null ? 0 : minuteToY({ minute, geometry: args.settings })),
        left: resourceBox.left - viewportBox.left
      };
    },
    [args.containerRef, args.orientation, args.settings, args.verticalTimelineGutterPx, registry]
  );

  const captureViewportAnchor = useCallback(
    (target: CalendarViewportAnchorTarget): CalendarViewportAnchor | null => captureAnchor({ target, resolveSnapshot }),
    [resolveSnapshot]
  );

  const isEventFullyVisible = useCallback(
    (target: CalendarViewportAnchorTarget) => {
      const viewport = args.containerRef.current;
      if (!viewport) return false;
      return registry.eventFullyVisible({
        target,
        viewportBox: insetViewportBox({
          viewport,
          leftInset: args.visibilityInsets?.left,
          topInset: args.visibilityInsets?.top
        })
      });
    },
    [args.containerRef, args.visibilityInsets?.left, args.visibilityInsets?.top, registry]
  );

  const restoreViewportAnchor = useCallback(
    ({ anchor, ...options }: { anchor: CalendarViewportAnchor | null } & CalendarViewportAnchorRestoreOptions) => {
      if (!anchor) return;
      cancelViewportAnchorRestore();
      const viewport = args.containerRef.current;
      if (!viewport) return;
      const target = options.target ?? anchor.target;
      setActiveRestoreTarget(target);
      const token = ++restoreTokenRef.current;
      const session = new ViewportAnchorRestoreSession({
        viewport,
        anchor,
        target,
        options,
        registry,
        resolveSnapshot,
        scrollToDateTime: args.scrollToDateTime,
        isCurrent: () => restoreTokenRef.current === token,
        cancel: cancelViewportAnchorRestore
      });
      cleanupRef.current = session.start();
    },
    [args.containerRef, args.scrollToDateTime, cancelViewportAnchorRestore, registry, resolveSnapshot]
  );

  const registration: ViewportGeometryRegistration = useMemo(
    () => ({
      registerDayElement: ({ dateKey, element }) => registry.registerDay({ dateKey, element }),
      registerResourceElement: ({ dateKey, calendarId, element }) =>
        registry.registerResource({ dateKey, calendarId, element }),
      registerEventElement: ({ eventId, calendarId, element, previousElement }) =>
        registry.registerEvent({ eventId, calendarId, element, previousElement })
    }),
    [registry]
  );

  return {
    activeRestoreTarget,
    captureViewportAnchor,
    isEventFullyVisible,
    restoreViewportAnchor,
    cancelViewportAnchorRestore,
    registration
  };
}
