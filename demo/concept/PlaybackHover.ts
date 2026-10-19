import { pointer, type Point } from "./playbackMotion";
import { onPlaybackSurface } from "./playbackSurface";
/** Route an unpressed pointer through the painted surface, including expanded overlap cards. */
export class PlaybackHover {
  private target: Element | null = null;
  private day: HTMLElement | null = null;
  constructor(private readonly root: HTMLElement) {}
  move(point: Point) {
    const hit = onPlaybackSurface(this.root, () => document.elementFromPoint(point.x, point.y));
    const next = hit && this.root.contains(hit) ? hit : null;
    const previousCell = this.target?.closest('[data-slot="calendar-cell"]');
    const nextCell = next?.closest('[data-slot="calendar-cell"]');
    if (previousCell && previousCell !== nextCell) this.leave(previousCell, next);
    this.updateDay(next?.closest<HTMLElement>('[data-slot="day"]') ?? null);
    this.target = next;
    if (next) pointer(next, "pointermove", point);
  }
  clear() {
    this.updateDay(null);
    const cell = this.target?.closest('[data-slot="calendar-cell"]');
    if (cell) this.leave(cell, document.body);
    this.target = null;
  }
  private leave(cell: Element, relatedTarget: Element | null) {
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget }));
  }
  private updateDay(next: HTMLElement | null) {
    if (next === this.day) return;
    const previous = this.day;
    previous?.removeAttribute("data-demo-hover");
    previous?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: next }));
    this.day = next;
    if (next) {
      next.dataset.demoHover = "true";
      next.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: previous }));
    }
  }
}
