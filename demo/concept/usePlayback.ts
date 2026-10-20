import { useEffect, useState, type RefObject } from "react";
import { reveal } from "./playbackScroll";
import { PlaybackActor } from "./PlaybackActor";
import { getScenario, type ProductId } from "./scenarioCatalog";
import { isMobileDrawerPresentation } from "./playbackTakeover";
export type PlaybackActions = { playing: boolean; stop: () => void };
export type Session = { product: ProductId; scene: string; revision: number; mode: "preview" | "scene" | "idle" };
export function usePlayback(
  root: RefObject<HTMLDivElement>,
  session: Session,
  finish: () => void,
  stop: () => void,
  enabled = true
) {
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (!enabled || session.mode === "idle" || !root.current) return;
    const canvas = root.current;
    const scene = getScenario(session.product, session.scene);
    if (scene.chapterOnly && canvas.closest<HTMLElement>(".concept-tour-content")?.dataset.introduction === "true") {
      setFeedback("");
      stop();
      return;
    }
    const controller = new AbortController();
    canvas.dataset.playbackCycle = "0";
    const actor = new PlaybackActor(canvas, canvas.querySelector<HTMLElement>(".concept-cursor")!, controller.signal);
    const takeover = (event: Event) => {
      if (event.isTrusted && !actor.internal && !isMobileDrawerPresentation(event)) {
        controller.abort();
        stop();
      }
    };
    const hidden = () => {
      if (document.hidden) {
        controller.abort();
        stop();
      }
    };
    const events = ["pointerdown", "wheel", "keydown", "focusin"];
    events.forEach((name) => document.addEventListener(name, takeover, true));
    document.addEventListener("visibilitychange", hidden);
    const run = async () => {
      try {
        setFeedback("");
        const hero = canvas.closest<HTMLElement>(".concept-hero");
        if (hero) await reveal(controller.signal, hero);
        await actor.find('[data-ready="true"]');
        const { playSteps } = await import("./playbackSteps");
        let cycle = 0;
        do {
          await playSteps(actor, scene.steps);
          controller.signal.throwIfAborted();
          canvas.dataset.playbackCycle = String(++cycle);
          await actor.wait(1200);
          if (scene.loop !== "continue") {
            actor.clear();
            canvas
              .querySelector(".concept-calendar-workspace, .concept-product-stage")
              ?.dispatchEvent(new Event("concept-loop"));
            await actor.wait(250);
          }
        } while (!controller.signal.aborted);
        actor.clear();
        finish();
      } catch (error) {
        if (!controller.signal.aborted) {
          setFeedback("This demonstration paused. Try it yourself or replay the scene.");
          console.error(error);
          stop();
        }
      }
    };
    void run();
    return () => {
      controller.abort();
      actor.clear();
      events.forEach((name) => document.removeEventListener(name, takeover, true));
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [root, session, finish, stop, enabled]);
  return feedback;
}
