/**
 * Continues a Pointer Events interaction when a pointer leaves calendar DOM.
 * Captured events already bubble through the React viewport and are ignored
 * here; window-targeted events cover lost capture and synthetic integrations.
 */
import { useEffect } from "react";

type GlobalPointerContinuationArgs = {
  active: boolean;
  onMove: (event: PointerEvent) => void;
  onFinish: () => void | Promise<void>;
  onCancel: () => void;
};

export function useGlobalPointerContinuation({ active, onMove, onFinish, onCancel }: GlobalPointerContinuationArgs) {
  useEffect(() => {
    if (!active) return;
    const isHandledByCalendar = (event: PointerEvent) =>
      event.target instanceof Element && Boolean(event.target.closest(".quno-calendar-viewport"));
    const handleMove = (event: PointerEvent) => {
      if (!isHandledByCalendar(event)) onMove(event);
    };
    const handleFinish = (event: PointerEvent) => {
      if (!isHandledByCalendar(event)) void onFinish();
    };
    const handleCancel = (event: PointerEvent) => {
      if (!isHandledByCalendar(event)) onCancel();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleFinish);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleFinish);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onCancel, onFinish, onMove]);
}
