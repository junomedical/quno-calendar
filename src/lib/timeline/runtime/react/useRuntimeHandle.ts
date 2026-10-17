import { useRuntimeCapture } from "./useRuntimeCapture";
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type RefObject
} from "react";
import type { CalendarViewHandle } from "#quno-internal/timeline/core/internalTypes";
import { ViewportGeometryRegistry } from "#quno-internal/timeline/infinite/anchors/parent/viewportGeometryRegistry";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import { type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { navigate } from "#quno-internal/timeline/runtime/viewport/navigation";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";

type Actions = Pick<CalendarViewHandle, "commitVisibleEvent" | "removeVisibleEvent" | "releaseActiveDraft">;
type HandleArgs = {
  engine: CalendarEngine;
  containerRef: RefObject<HTMLDivElement | null>;
  forwardedRef: ForwardedRef<CalendarViewHandle>;
  actions: Actions;
  today: IsoDate;
  nowTime: string;
};

export function useRuntimeHandle({ engine, containerRef, forwardedRef, actions, today, nowTime }: HandleArgs) {
  const [registry] = useState(() => new ViewportGeometryRegistry());
  const pending = useRef<(() => void) | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const queue = useCallback(({ command }: { command: () => void }) => {
    pending.current = command;
    setRequestVersion((value) => value + 1);
  }, []);
  const registration: ViewportGeometryRegistration = useMemo(
    () => ({
      registerDayElement: (args) => registry.registerDay(args),
      registerResourceElement: (args) => registry.registerResource(args),
      registerEventElement: (args) => registry.registerEvent(args)
    }),
    [registry]
  );
  const { capture, resolveTarget } = useRuntimeCapture({ engine, containerRef, registry });
  const cancel = useCallback(() => {
    pending.current = null;
    engine.cancel({ now: performance.now() });
  }, [engine]);
  useLayoutEffect(() => {
    const command = pending.current;
    pending.current = null;
    command?.();
  }, [requestVersion]);
  useImperativeHandle(
    forwardedRef,
    () => ({
      ...actions,
      getVisibleDateKeys: () => [...engine.read().window.visibleDateKeys],
      captureViewportAnchor: capture,
      cancelViewportAnchorRestore: cancel,
      isEventFullyVisible: (target) => {
        const element = containerRef.current;
        if (!element) return false;
        const box = element.getBoundingClientRect();
        const geometry = engine.read().geometry;
        return registry.eventFullyVisible({
          target,
          viewportBox: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            left: box.left + geometry.labelWidth,
            top: box.top + geometry.settings.dayHeaderHeight,
            right: box.right,
            bottom: box.bottom
          } as DOMRect
        });
      },
      scrollToDate: ({ date }) => {
        cancel();
        navigate({ engine, date });
      },
      scrollToToday: () => {
        cancel();
        navigate({ engine, date: today, time: nowTime });
      },
      scrollToDateTime: (args) =>
        queue({
          command: () => {
            engine.cancel({ now: performance.now() });
            navigate({ engine, ...args });
          }
        }),
      restoreViewportAnchor: ({ anchor, ...options }) => {
        if (!anchor) return;
        queue({
          command: () => {
            const target = resolveTarget(options.target ?? anchor.target);
            if (
              !target ||
              (options.allowNavigationFallback === false && !engine.read().geometry.dateIndex.has(target.dateKey))
            )
              return;
            engine.position({
              kind: "restore",
              anchor: {
                target,
                screen: { x: anchor.snapshot.left, y: anchor.snapshot.top },
                axes: !target.calendarId && !target.eventId && target.minute === undefined ? "y" : "both"
              },
              now: performance.now(),
              duration: options.afterRecenter ? 2800 : 160,
              cancelOnManual: options.cancelOnManualScroll ?? false
            });
          }
        });
      }
    }),
    [actions, cancel, capture, containerRef, engine, queue, registry, resolveTarget, today, nowTime]
  );
  return { registration, registry };
}
