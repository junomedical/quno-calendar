/**
 * Domain: Anchors.
 * Responsibility: Exposes capture/restore operations and geometry registration to a view.
 * Preserves: the current semantic calendar location across geometry changes.
 * Does not own: browser DOM focus and gesture recognition.
 * Failure/cancellation: unresolved targets retry, fall back, or yield according to anchor priority.
 *
 * @see docs/domains/anchors.md#source-map
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { minuteToX, minuteToY, parseClockToMinutes } from "../../../time/time";
import type {
  CalendarNavigationHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget,
  TimelineSettings
} from "../../../core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
import type { ViewportGeometryRegistration } from "./viewportAnchorTypes";
import { relativeSnapshot, ViewportGeometryRegistry } from "./viewportGeometryRegistry";
import { ViewportAnchorRestoreSession } from "./viewportAnchorRestoreSession";

type AnchoringArgs = {
  containerRef: RefObject<HTMLElement | null>;
  settings: TimelineSettings;
  orientation: "horizontal" | "vertical";
  scrollToDateTime: CalendarNavigationHandle["scrollToDateTime"];
  verticalTimelineGutterPx?: number;
};

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

  useEffect(() => {
    registry.invalidate();
  }, [args.orientation, args.settings, registry]);
  useEffect(
    () => () => {
      cancelViewportAnchorRestore();
      registry.clear();
    },
    [cancelViewportAnchorRestore, registry]
  );

  const resolveSnapshot = useCallback(
    (target: CalendarViewportAnchorTarget) => {
      const viewport = args.containerRef.current;
      if (!viewport) return null;
      const viewportBox = viewport.getBoundingClientRect();
      const event = registry.event(target, viewportBox);
      if (event) return relativeSnapshot(event, viewportBox);
      if (!target.dateKey || !target.calendarId) return null;
      const resource = registry.resource(target.dateKey, target.calendarId);
      if (!resource) return null;
      const resourceBox = resource.getBoundingClientRect();
      const minute = target.time && /^\d{2}:\d{2}$/.test(target.time) ? parseClockToMinutes(target.time) : null;
      if (args.orientation === "horizontal") {
        return {
          top: resourceBox.top - viewportBox.top,
          left:
            resourceBox.left -
            viewportBox.left +
            args.settings.labelWidth +
            TIMELINE_LEFT_GUTTER_PX +
            (minute === null ? 0 : minuteToX(minute, args.settings))
        };
      }
      return {
        top:
          resourceBox.top -
          viewportBox.top +
          (args.verticalTimelineGutterPx ?? 0) +
          (minute === null ? 0 : minuteToY(minute, args.settings)),
        left: resourceBox.left - viewportBox.left
      };
    },
    [args.containerRef, args.orientation, args.settings, args.verticalTimelineGutterPx, registry]
  );

  const captureViewportAnchor = useCallback(
    (target: CalendarViewportAnchorTarget): CalendarViewportAnchor | null => {
      const snapshot = resolveSnapshot(target);
      return snapshot ? { snapshot, target } : null;
    },
    [resolveSnapshot]
  );

  const restoreViewportAnchor = useCallback(
    (anchor: CalendarViewportAnchor | null, options: CalendarViewportAnchorRestoreOptions = {}) => {
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
      registerDayElement: (dateKey, element) => registry.registerDay(dateKey, element),
      registerResourceElement: (dateKey, calendarId, element) =>
        registry.registerResource(dateKey, calendarId, element),
      registerEventElement: (eventId, calendarId, element, previousElement) =>
        registry.registerEvent(eventId, calendarId, element, previousElement)
    }),
    [registry]
  );

  return {
    activeRestoreTarget,
    captureViewportAnchor,
    restoreViewportAnchor,
    cancelViewportAnchorRestore,
    registration
  };
}
