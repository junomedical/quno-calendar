import type { PlaybackActor } from "./PlaybackActor";
import type { PlaybackStep } from "./scenarioTypes";
import { animate, ease, pointer } from "./playbackMotion";
export async function playSlider(actor: PlaybackActor, step: Extract<PlaybackStep, { action: "slider" }>) {
  const input = (await actor.aim(step.target, step.caption)) as HTMLInputElement;
  const min = Number(input.min);
  const max = Number(input.max);
  const start = Number(input.value);
  const end = Math.max(min, Math.min(max, step.value));
  const position = (value: number) => {
    const rect = input.getBoundingClientRect();
    return { x: rect.left + 8 + ((value - min) / (max - min)) * (rect.width - 16), y: rect.top + rect.height / 2 };
  };
  await actor.move(position(start), step.caption);
  actor.cue("Press and hold · zoom", "press");
  const cancel = () => pointer(input, "pointercancel", actor.position);
  actor.signal.addEventListener("abort", cancel, { once: true });
  try {
    pointer(input, "pointerdown", actor.position, true);
    await actor.wait(180);
    actor.cue(step.caption, "drag");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await animate(actor.signal, step.durationMs, (progress) => {
      const value = start + (end - start) * ease(progress, step.easing);
      actor.place(position(value));
      pointer(input, "pointermove", actor.position, true);
      setter.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    pointer(input, "pointerup", actor.position);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    actor.cue("Release · inspect the detail", "release");
  } finally {
    actor.signal.removeEventListener("abort", cancel);
  }
}
