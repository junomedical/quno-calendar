export type Point = { x: number; y: number };
export function pause(signal: AbortSignal, duration: number) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, duration);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export type Easing = "linear" | "ease-in-out";
export const ease = (progress: number, easing: Easing) =>
  easing === "linear" ? progress : progress * progress * (3 - 2 * progress);
export function animate(signal: AbortSignal, duration: number, frame: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    let start: number | undefined;
    let request = 0;
    const abort = () => {
      cancelAnimationFrame(request);
      reject(signal.reason);
    };
    const tick = (time: number) => {
      start ??= time;
      const progress = duration <= 0 ? 1 : Math.min(1, (time - start) / duration);
      try {
        frame(progress);
        if (signal.aborted) return;
        if (progress < 1) request = requestAnimationFrame(tick);
        else {
          signal.removeEventListener("abort", abort);
          resolve();
        }
      } catch (error) {
        signal.removeEventListener("abort", abort);
        reject(error);
      }
    };
    signal.addEventListener("abort", abort, { once: true });
    request = requestAnimationFrame(tick);
  });
}
export function pointer(target: EventTarget, type: string, point: Point, held = false) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 741,
      pointerType: "mouse",
      isPrimary: true,
      clientX: point.x,
      clientY: point.y,
      button: type === "pointermove" ? -1 : 0,
      buttons: held ? 1 : 0
    })
  );
}
export function center(element: Element): Point {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
