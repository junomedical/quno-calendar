import { pointer, type Point } from "./playbackMotion";
/** Route an unpressed pointer through the painted surface, including expanded overlap cards. */
export class PlaybackHover {
  private target: Element | null = null;
  constructor(private readonly root: HTMLElement) {}
  move(point: Point) {
    const hit = document.elementFromPoint(point.x, point.y);
    const next = hit && this.root.contains(hit) ? hit : null;
    const previousCell = this.target?.closest('[data-slot="calendar-cell"]');
    const nextCell = next?.closest('[data-slot="calendar-cell"]');
    if (previousCell && previousCell !== nextCell) this.leave(previousCell, next);
    this.target = next;
    if (next) pointer(next, "pointermove", point);
  }
  clear() {
    const cell = this.target?.closest('[data-slot="calendar-cell"]');
    if (cell) this.leave(cell, document.body);
    this.target = null;
  }
  private leave(cell: Element, relatedTarget: Element | null) {
    cell.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget }));
  }
}
