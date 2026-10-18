import { useEffect, useState, type RefObject } from "react";
import { reveal } from "./playbackScroll";
import { PlaybackActor } from "./PlaybackActor";
import { getScenario, type ProductId } from "./scenarioCatalog";
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
    const controller = new AbortController();
    const canvas = root.current;
    const actor = new PlaybackActor(canvas, canvas.querySelector<HTMLElement>(".concept-cursor")!, controller.signal);
    const takeover = (event: Event) => {
      if (event.isTrusted && !actor.internal) {
        controller.abort();
        stop();
      }
    };
    const hoverTakeover = (event: PointerEvent) => {
      if ((event.target as Element).closest(".concept-calendar")) takeover(event);
    };
    const hidden = () => {
      if (document.hidden) {
        controller.abort();
        stop();
      }
    };
    const events = ["pointerdown", "wheel", "keydown", "focusin"];
    events.forEach((name) => document.addEventListener(name, takeover, true));
    canvas.addEventListener("pointermove", hoverTakeover, true);
    document.addEventListener("visibilitychange", hidden);
    const run = async () => {
      try {
        setFeedback("");
        const hero = canvas.closest<HTMLElement>(".concept-hero");
        if (hero) await reveal(controller.signal, hero);
        await actor.find('[data-ready="true"]');
        const { playSteps } = await import("./playbackSteps");
        await playSteps(actor, getScenario(session.product, session.scene).steps);
        controller.signal.throwIfAborted();
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
      canvas.removeEventListener("pointermove", hoverTakeover, true);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [root, session, finish, stop, enabled]);
  return feedback;
}
