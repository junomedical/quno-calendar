import type { PointerEvent as ReactPointerEvent } from "react";

const HOLD_DELAY_MS = 350;
const MOVE_TOLERANCE = 8;
type Start = {
  event: ReactPointerEvent<HTMLDivElement>;
  onHold: () => void;
  onTap?: () => void;
  onCancel: () => void;
};

/** Leaves native panning alone until a stationary touch has been held. */
export class TouchHoldGesture {
  private cleanup: (() => void) | null = null;

  begin = ({ event, onHold, onTap, onCancel }: Start) => {
    this.dispose();
    const target = event.currentTarget;
    const { pointerId, clientX, clientY } = event;
    const claim = () => {
      if (!target.isConnected) return false;
      target.setPointerCapture(pointerId);
      onHold();
      return true;
    };
    if (event.pointerType !== "touch") {
      event.preventDefault();
      claim();
      return;
    }
    if (!event.isPrimary) return;
    let active = false;
    let tapMoved = false;
    const cancel = () => {
      this.dispose();
      if (active) onCancel();
    };
    const distance = (point: { clientX: number; clientY: number }) =>
      Math.hypot(point.clientX - clientX, point.clientY - clientY);
    const move = (point: PointerEvent) => {
      if (point.pointerId !== pointerId) return;
      tapMoved ||= distance(point) > 4;
      if (!active && distance(point) > MOVE_TOLERANCE) cancel();
    };
    const finish = (point: PointerEvent) => {
      if (point.pointerId !== pointerId) return;
      this.dispose();
      if (!active && !tapMoved && distance(point) <= 4) onTap?.();
    };
    const pointerCancel = (point: PointerEvent) => {
      if (point.pointerId === pointerId) cancel();
    };
    const additionalPointer = (point: PointerEvent) => {
      if (point.pointerId !== pointerId) cancel();
    };
    const scroll = () => {
      if (!active) cancel();
    };
    const key = (input: KeyboardEvent) => {
      if (input.key === "Escape") cancel();
    };
    const suppress = (input: Event) => {
      if (active && input.cancelable) input.preventDefault();
    };
    const timer = window.setTimeout(() => {
      active = claim();
      if (!active) this.dispose();
    }, HOLD_DELAY_MS);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", finish, true);
    window.addEventListener("pointercancel", pointerCancel, true);
    window.addEventListener("pointerdown", additionalPointer, true);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", key);
    target.addEventListener("touchmove", suppress, { passive: false });
    target.addEventListener("contextmenu", suppress);
    this.cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", pointerCancel, true);
      window.removeEventListener("pointerdown", additionalPointer, true);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", key);
      target.removeEventListener("touchmove", suppress);
      target.removeEventListener("contextmenu", suppress);
    };
  };

  dispose = () => {
    this.cleanup?.();
    this.cleanup = null;
  };
}
