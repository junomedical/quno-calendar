import type { PlaybackActor } from "./PlaybackActor";
import type { PlaybackStep } from "./scenarioTypes";
export async function scrollYear(actor: PlaybackActor, step: Extract<PlaybackStep, { action: "scroll-year" }>) {
  const target = await actor.find(step.target);
  const group = target.querySelector<HTMLElement>('[data-slot="year-group"]');
  const first = Number(target.dataset.firstYear);
  const last = Number(target.dataset.lastYear);
  if (!group || !Number.isFinite(first) || !Number.isFinite(last) || step.year < first || step.year > last)
    throw new Error(`The demonstration year is outside the mounted navigator: ${step.year}`);
  const offset = (step.year - first) * group.getBoundingClientRect().height;
  await actor.scroll(step.target, offset - target.scrollTop, `Scroll to ${step.year}`, step.durationMs, step.easing);
}
