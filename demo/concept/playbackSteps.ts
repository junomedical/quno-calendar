import type { PlaybackActor } from "./PlaybackActor";
import type { PlaybackStep } from "./scenarioTypes";
import { reveal } from "./playbackScroll";
import { playSlider } from "./playbackSlider";
import { center } from "./playbackMotion";
import { creationTarget, isVertical, moveTarget } from "./calendarTargets";

async function wheel(actor: PlaybackActor, step: Extract<PlaybackStep, { action: "wheel" }>) {
  const target = await actor.aim(step.target, step.caption);
  actor.cue(step.cue, "scroll");
  try {
    for (let i = 0; i < step.count; i++) {
      actor.signal.throwIfAborted();
      target.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          shiftKey: step.shiftKey,
          deltaY: step.deltaY,
          clientX: actor.position.x,
          clientY: actor.position.y
        })
      );
      await actor.wait(step.intervalMs);
    }
  } finally {
    if (step.shiftKey) window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", bubbles: true }));
  }
}
async function dragDates(actor: PlaybackActor, step: Extract<PlaybackStep, { action: "drag-dates" }>) {
  const source = await actor.find(`[data-slot="day"][data-date="${step.from}"]`);
  const destination = await actor.find(`[data-slot="day"][data-date="${step.to}"]`);
  await reveal(actor.signal, source);
  await reveal(actor.signal, destination);
  await actor.wait(150);
  await actor.drag(center(source), center(destination), source);
}
async function runStep(actor: PlaybackActor, step: PlaybackStep) {
  switch (step.action) {
    case "wait":
      return actor.wait(step.ms);
    case "find":
      await actor.find(step.target);
      return;
    case "aim":
      await actor.aim(step.target, step.caption);
      return;
    case "click":
      return actor.click(step.target, step.caption);
    case "hover":
      return actor.hover(step.target);
    case "cue":
      actor.cue(step.caption, step.gesture);
      return;
    case "type":
      return actor.type(step.target, step.text);
    case "key":
      return actor.key(step.target, step.key, step.caret);
    case "scroll":
      return actor.scroll(step.target, step.amount, step.caption, step.durationMs, step.easing);
    case "scroll-to": {
      const target = await actor.find(step.destination);
      const scroller = await actor.find(step.target);
      return actor.scroll(
        step.target,
        center(target).y - center(scroller).y,
        step.caption,
        step.durationMs,
        step.easing
      );
    }
    case "scroll-day": {
      const amount = isVertical(actor)
        ? (await actor.find(step.cell)).getBoundingClientRect().height + step.verticalOffset
        : step.horizontalAmount;
      return actor.scroll(step.target, amount, undefined, step.durationMs, step.easing);
    }
    case "slider":
      return playSlider(actor, step);
    case "wheel":
      return wheel(actor, step);
    case "drag-dates":
      return dragDates(actor, step);
    case "draw-event": {
      const { start, end, grid } = await creationTarget(actor, step);
      return actor.drag(start, end, grid);
    }
    case "move-event": {
      const { event, start, end } = await moveTarget(actor, step);
      return actor.drag(start, end, event);
    }
    default: {
      const unsupported: never = step;
      throw new Error(`Unsupported demonstration action: ${JSON.stringify(unsupported)}`);
    }
  }
}
export async function playSteps(actor: PlaybackActor, steps: readonly PlaybackStep[]) {
  for (const step of steps) {
    actor.signal.throwIfAborted();
    await runStep(actor, step);
  }
}
