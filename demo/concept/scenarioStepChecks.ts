import type { PlaybackStep } from "./scenarioTypes";
import {
  between,
  boolean,
  date,
  nonempty,
  number,
  object,
  oneOf,
  requireValue,
  text,
  type Check
} from "./scenarioChecks";

const motion = { durationMs: between(0, 60000), easing: oneOf("linear", "ease-in-out") };
const steps: Record<PlaybackStep["action"], Check> = {
  wait: object({ action: oneOf("wait"), ms: between(0, 60000) }),
  find: object({ action: oneOf("find"), target: nonempty }),
  hover: object({ action: oneOf("hover"), target: nonempty }),
  aim: object({ action: oneOf("aim"), target: nonempty, caption: nonempty }),
  click: object({ action: oneOf("click"), target: nonempty, caption: nonempty }),
  cue: object({ action: oneOf("cue"), caption: nonempty, gesture: oneOf("move", "hover", "scroll", "key") }),
  type: object({ action: oneOf("type"), target: nonempty, text }),
  key: object({ action: oneOf("key"), target: nonempty, key: nonempty }, { caret: between(0, 1000, true) }),
  scroll: object({ action: oneOf("scroll"), target: nonempty, amount: number, ...motion }, { caption: nonempty }),
  "scroll-year": object({ action: oneOf("scroll-year"), target: nonempty, year: between(1, 9999, true), ...motion }),
  "scroll-loop": object({
    action: oneOf("scroll-loop"),
    target: nonempty,
    amount: between(800, 4000),
    pauseMs: between(0, 2000),
    ...motion
  }),
  "scroll-to": object({
    action: oneOf("scroll-to"),
    target: nonempty,
    destination: nonempty,
    caption: nonempty,
    ...motion
  }),
  "scroll-day": object({
    action: oneOf("scroll-day"),
    target: nonempty,
    cell: nonempty,
    horizontalAmount: number,
    verticalOffset: number,
    ...motion
  }),
  slider: object({ action: oneOf("slider"), target: nonempty, value: number, caption: nonempty, ...motion }),
  wheel: object({
    action: oneOf("wheel"),
    target: nonempty,
    caption: nonempty,
    cue: nonempty,
    deltaY: number,
    shiftKey: boolean,
    count: between(1, 100, true),
    intervalMs: between(0, 60000)
  }),
  "drag-dates": object({ action: oneOf("drag-dates"), from: date, to: date }),
  "draw-event": object({
    action: oneOf("draw-event"),
    reference: nonempty,
    grid: nonempty,
    viewport: nonempty,
    startOffset: number,
    endOffset: number
  }),
  "move-event": object({
    action: oneOf("move-event"),
    reference: nonempty,
    grid: nonempty,
    viewport: nonempty,
    timeOffset: number
  })
};
export const step: Check = (value, path) => {
  const action = (value as { action?: unknown } | null)?.action;
  requireValue(
    typeof action === "string" && Object.prototype.hasOwnProperty.call(steps, action),
    `${path}.action`,
    "supported action"
  );
  steps[action as PlaybackStep["action"]](value, path);
};
