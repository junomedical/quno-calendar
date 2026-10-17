/** Pause native/compositor scrolling while zoom commits programmatic anchor positions. */
export class ZoomScrollLock {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private previous: Array<{ name: string; value: string; priority: string }> | null = null;
  private viewport: HTMLElement;

  constructor({ viewport }: { viewport: HTMLElement }) {
    this.viewport = viewport;
  }

  hold() {
    if (!this.previous) {
      this.previous = ["overflow", "overflow-x", "overflow-y"].map((name) => ({
        name,
        value: this.viewport.style.getPropertyValue(name),
        priority: this.viewport.style.getPropertyPriority(name)
      }));
      this.viewport.style.setProperty("overflow", "hidden");
    }
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.release(), 300);
  }

  release() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (!this.previous) return;
    for (const { name } of this.previous) this.viewport.style.removeProperty(name);
    for (const { name, value, priority } of this.previous) {
      if (value) this.viewport.style.setProperty(name, value, priority);
    }
    this.previous = null;
  }
}
