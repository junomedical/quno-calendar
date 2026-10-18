import { animate, center, pause, pointer, type Point, type Easing } from "./playbackMotion";
import { reveal, scrollBy } from "./playbackScroll";
import { PlaybackHover } from "./PlaybackHover";
export class PlaybackActor {
  position: Point = { x: 0, y: 0 };
  internal = false;
  private hoverPointer: PlaybackHover;
  constructor(
    public root: HTMLElement,
    public cursor: HTMLElement,
    public signal: AbortSignal
  ) {
    this.hoverPointer = new PlaybackHover(root);
    signal.addEventListener("abort", () => this.clear(), { once: true });
  }
  wait(ms = 400) {
    return pause(this.signal, ms);
  }
  async find(selector: string): Promise<HTMLElement> {
    for (let i = 0; i < 100; i++) {
      this.signal.throwIfAborted();
      const node = this.root.querySelector<HTMLElement>(selector);
      if (node && node.getBoundingClientRect().width > 0) return node;
      await this.wait(50);
    }
    throw new Error(`The demonstration target is unavailable: ${selector}`);
  }
  cue(text: string, gesture = "move") {
    this.cursor.dataset.gesture = gesture;
    this.cursor.querySelector("span")!.textContent = text;
    this.cursor.hidden = false;
  }
  place(point: Point) {
    this.position = point;
    const rect = this.root.getBoundingClientRect();
    this.cursor.style.left = `${point.x - rect.left - 3}px`;
    this.cursor.style.top = `${point.y - rect.top - 3}px`;
    this.cursor.dataset.edge = point.x > rect.right - 170 ? "left" : "right";
  }
  async move(point: Point, caption: string, held = false, target?: HTMLElement, hover = false) {
    this.cue(caption, held ? "drag" : "move");
    const start = this.position.x ? this.position : { x: point.x + 30, y: point.y + 40 };
    await animate(this.signal, 450, (progress) => {
      const eased = progress * progress * (3 - 2 * progress);
      const next = { x: start.x + (point.x - start.x) * eased, y: start.y + (point.y - start.y) * eased };
      this.place(next);
      if (held && target) pointer(target, "pointermove", next, true);
      else if (hover) this.hoverPointer.move(next);
    });
  }
  async aim(selector: string, caption: string) {
    const target = await this.find(selector);
    await reveal(this.signal, target);
    await this.wait(100);
    await this.move(center(target), caption);
    await this.wait(200);
    return target;
  }
  async click(selector: string, caption: string) {
    const target = await this.aim(selector, caption);
    this.cue(caption, "press");
    target.dataset.demoPressed = "true";
    try {
      pointer(target, "pointerdown", this.position, true);
      await this.wait(180);
      this.signal.throwIfAborted();
      pointer(target, "pointerup", this.position);
      target.click();
      this.cue(caption, "release");
    } finally {
      delete target.dataset.demoPressed;
    }
    await this.wait(500);
  }
  async hover(selector: string) {
    const target = await this.find(selector);
    await reveal(this.signal, target);
    await this.wait(100);
    await this.move(center(target), "Hover to reveal appointments", false, undefined, true);
    this.cue("Appointment details", "hover");
    await this.wait(1100);
  }
  async type(selector: string, text: string) {
    const input = (await this.aim(selector, "Type a value")) as HTMLInputElement;
    this.cue("Click the field", "press");
    await this.wait(180);
    this.internal = true;
    try {
      input.focus({ preventScroll: true });
    } finally {
      this.internal = false;
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    for (let i = 1; i <= text.length; i++) {
      await this.wait(65);
      this.cue(`Type · ${text.slice(0, i)}`, "type");
      setter.call(input, text.slice(0, i));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  async key(selector: string, key: string, caret?: number) {
    const input = (await this.find(selector)) as HTMLInputElement;
    this.internal = true;
    try {
      input.focus({ preventScroll: true });
      if (caret !== undefined) input.setSelectionRange(caret, caret);
    } finally {
      this.internal = false;
    }
    this.cue(key === "ArrowUp" ? "↑ · change the day" : key, "key");
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    await this.wait(650);
    input.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  }
  async scroll(
    selector: string,
    amount: number,
    caption = "Scroll to the next day",
    durationMs = 1500,
    easing: Easing = "ease-in-out"
  ) {
    const target = await this.find(selector);
    const rect = target.getBoundingClientRect();
    await this.move({ x: rect.left + rect.width * 0.72, y: rect.top + Math.min(160, rect.height / 2) }, caption);
    this.cue(caption, "scroll");
    await scrollBy(this.signal, target, 0, amount, durationMs, easing);
    await this.wait(900);
  }
  async drag(source: Point, destination: Point, target: HTMLElement) {
    await this.move(source, "Press and hold");
    this.cue("Press and hold", "press");
    // Synthetic pointers have no browser capture. Scope the shim to this demonstration's targets.
    const nodes = [
      target,
      ...this.root.querySelectorAll<HTMLElement>(".quno-calendar-viewport, [data-slot=day], [data-event-id]")
    ];
    const descriptors = nodes.map(
      (node) => [node, Object.getOwnPropertyDescriptor(node, "setPointerCapture")] as const
    );
    for (const node of nodes) Object.defineProperty(node, "setPointerCapture", { configurable: true, value: () => {} });
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      for (const [node, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(node, "setPointerCapture", descriptor);
        else Reflect.deleteProperty(node, "setPointerCapture");
      }
    };
    const cancel = () => {
      pointer(target, "pointercancel", this.position);
      restore();
    };
    this.signal.addEventListener("abort", cancel, { once: true });
    try {
      pointer(target, "pointerdown", source, true);
      await this.wait(250);
      await this.move(destination, "Drag · keep holding", true, target);
      await this.wait(350);
      pointer(target, "pointerup", destination);
      this.cue("Release", "release");
      await this.wait(700);
    } finally {
      this.signal.removeEventListener("abort", cancel);
      restore();
    }
  }
  clear() {
    this.cursor.hidden = true;
    this.hoverPointer.clear();
  }
}
