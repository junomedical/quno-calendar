import { scrollBy } from "./playbackScroll";
import { center, type Point } from "./playbackMotion";
import type { PlaybackActor } from "./PlaybackActor";
import type { PlaybackStep } from "./scenarioTypes";
export const isVertical = (actor: PlaybackActor) =>
  actor.root.querySelector("[data-view]")?.getAttribute("data-view") === "infinite-vertical";
export async function creationTarget(
  actor: PlaybackActor,
  step: Extract<PlaybackStep, { action: "draw-event" }>
): Promise<{ start: Point; end: Point; grid: HTMLElement }> {
  const viewport = await actor.find(step.viewport);
  const event = await actor.find(step.reference);
  const grid = await actor.find(step.grid);
  const vertical = isVertical(actor);
  let rect = event.getBoundingClientRect();
  const bounds = viewport.getBoundingClientRect();
  const x = vertical ? 0 : Math.max(0, rect.right + rect.width * step.endOffset - bounds.right + 20);
  const y = vertical ? Math.max(0, rect.bottom + rect.height * step.endOffset - bounds.bottom + 20) : 0;
  if (x || y) await scrollBy(actor.signal, viewport, x, y, 360);
  await actor.wait(150);
  rect = event.getBoundingClientRect();
  const row = grid.getBoundingClientRect();
  return vertical
    ? {
        grid,
        start: { x: center(event).x, y: rect.bottom + rect.height * step.startOffset },
        end: { x: center(event).x, y: rect.bottom + rect.height * step.endOffset }
      }
    : {
        grid,
        start: { x: rect.right + rect.width * step.startOffset, y: row.top + row.height / 2 },
        end: { x: rect.right + rect.width * step.endOffset, y: row.top + row.height / 2 }
      };
}
export async function moveTarget(actor: PlaybackActor, step: Extract<PlaybackStep, { action: "move-event" }>) {
  const event = await actor.find(step.reference);
  const grid = await actor.find(step.grid);
  const viewport = (await actor.find(step.viewport)).getBoundingClientRect();
  const start = center(event);
  const target = center(grid);
  return {
    event,
    start,
    end: isVertical(actor)
      ? { x: Math.min(viewport.right - 12, target.x), y: start.y + step.timeOffset }
      : { x: start.x + step.timeOffset, y: target.y }
  };
}
