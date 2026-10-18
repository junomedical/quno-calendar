import type { CalendarView } from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { Minimize2 } from "lucide-react";
import { ConceptScreens } from "./ConceptScreens";
import { ConceptHeader } from "./ConceptHeader";
import { PlaybackControls } from "./PlaybackControls";
import { ScenarioRail } from "./ScenarioRail";
import { catalog, previews, products, scenarioDocument } from "./scenarioCatalog";
import { usePlayback, type Session } from "./usePlayback";
import { useScenarioScroll } from "./useScenarioScroll";
import { useDemoPresentation } from "./useDemoPresentation";
import "./concept.css";
import "./playground.css";
import "./navigation.css";
export function DemoConcept() {
  const [session, setSession] = useState<Session>(() => ({
    product: scenarioDocument.startProduct,
    scene: previews[scenarioDocument.startProduct][0],
    revision: 0,
    mode: window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 850px)").matches ? "idle" : "scene"
  }));
  const [preferredView, setPreferredView] = useState<CalendarView>("infinite-horizontal");
  const canvas = useRef<HTMLDivElement>(null);
  const stop = useCallback(
    () => setSession((current) => (current.mode === "idle" ? current : { ...current, mode: "idle" })),
    []
  );
  const presentation = useDemoPresentation(stop);
  const { mobile, fullscreen } = presentation;
  const locked = mobile && !fullscreen;
  const activate = useCallback(
    (scene: string, mode: Session["mode"]) => {
      setSession((value) => ({ ...value, scene, mode: locked ? "idle" : mode, revision: value.revision + 1 }));
    },
    [locked]
  );
  const navigation = useScenarioScroll(session.product, session.scene, fullscreen, activate);
  const { navigate } = navigation;
  const finish = useCallback(() => {
    const scenes = previews[session.product];
    const next = scenes[scenes.indexOf(session.scene) + 1];
    if (session.mode === "preview" && next) navigate(next, "preview");
    else stop();
  }, [session.product, session.scene, session.mode, navigate, stop]);
  const feedback = usePlayback(canvas, session, finish, stop, !locked);
  const product = products.find((item) => item.id === session.product)!;
  const current = catalog[session.product].find((item) => item.id === session.scene)!;
  const select = (scene: string, mode: Session["mode"] = "scene") => {
    stop();
    navigation.navigate(scene, mode);
  };
  const actions = {
    playing: session.mode !== "idle",
    stop,
    replay: () => select(session.scene),
    reset: () => activate(session.scene, "idle"),
    preview: () => select(previews[session.product][0], "preview")
  };
  return (
    <main
      className={`concept ${fullscreen ? "concept--fullscreen" : ""}`}
      data-playing={actions.playing}
      data-scene={session.scene}
    >
      {!fullscreen && (
        <ConceptHeader
          product={session.product}
          change={(id) => {
            stop();
            setSession((value) => ({
              product: id,
              scene: catalog[id][0].id,
              revision: value.revision + 1,
              mode: "idle"
            }));
          }}
        />
      )}
      <div
        className="concept-pages"
        ref={navigation.pages}
        onScroll={navigation.onScroll}
        onWheelCapture={navigation.interrupt}
        onTouchStartCapture={navigation.interrupt}
      >
        <ConceptScreens
          {...{ session, product, canvas, preferredView, setPreferredView, fullscreen, locked, actions, feedback }}
          open={presentation.open}
          button={presentation.openButton}
        />
      </div>
      {fullscreen ? (
        <div className="concept-fullscreen-dock">
          <span className="concept-statusbar" aria-live="polite">
            {feedback || current.label}
          </span>
          <PlaybackControls {...actions} />
          <button ref={presentation.closeButton} onClick={presentation.close}>
            <Minimize2 size={15} />
            Exit full screen
          </button>
        </div>
      ) : (
        <ScenarioRail product={session.product} scene={session.scene} select={select} />
      )}
    </main>
  );
}
