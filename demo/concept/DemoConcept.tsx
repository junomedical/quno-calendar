import type { CalendarView } from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { ConceptCanvas } from "./ConceptCanvas";
import { ConceptHeader } from "./ConceptHeader";
import { ConceptTour } from "./ConceptTour";
import { catalog, previews, scenarioDocument } from "./scenarioCatalog";
import { usePlayback, type Session } from "./usePlayback";
import { useDemoPresentation } from "./useDemoPresentation";
import { useSystemTheme } from "./useSystemTheme";
import "./concept.css";
import "./playground.css";
import "./navigation.css";
import "./calendarPresentation.css";
import "./fullscreenTour.css";
import "./guideDrawer.css";
import "./conceptTheme.css";
export function DemoConcept() {
  const theme = useSystemTheme();
  const [session, setSession] = useState<Session>(() => ({
    product: scenarioDocument.startProduct,
    scene: previews[scenarioDocument.startProduct][0],
    revision: 0,
    mode: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "idle" : "scene"
  }));
  const [preferredView, setPreferredView] = useState<CalendarView>("infinite-horizontal");
  const canvas = useRef<HTMLDivElement>(null);
  const stop = useCallback(
    () => setSession((current) => (current.mode === "idle" ? current : { ...current, mode: "idle" })),
    []
  );
  const presentation = useDemoPresentation(stop);
  const { fullscreen } = presentation;
  const locked = false;
  const activate = useCallback(
    (scene: string, mode: Session["mode"]) => {
      setSession((value) => ({ ...value, scene, mode: locked ? "idle" : mode, revision: value.revision + 1 }));
    },
    [locked]
  );
  const finish = stop;
  const feedback = usePlayback(canvas, session, finish, stop, !locked);
  const current = catalog[session.product].find((item) => item.id === session.scene)!;
  const select = (scene: string, mode: Session["mode"] = "scene") => {
    stop();
    activate(scene, mode);
  };
  const actions = {
    playing: session.mode !== "idle",
    stop
  };
  return (
    <main
      className={`concept ${fullscreen ? "concept--fullscreen" : ""} concept--guided`}
      data-product={session.product}
      data-theme={theme}
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
              mode: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "idle" : "scene"
            }));
          }}
        />
      )}
      <ConceptTour
        key={session.product}
        product={session.product}
        scenario={current}
        actions={actions}
        select={(scene) =>
          select(scene, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "idle" : "scene")
        }
        close={presentation.close}
        fullscreen={fullscreen}
        mobile={presentation.mobile}
        open={presentation.open}
        openButton={presentation.openButton}
        closeButton={presentation.closeButton}
        feedback={feedback}
      >
        <ConceptCanvas {...{ session, canvas, preferredView, setPreferredView, locked }} />
      </ConceptTour>
    </main>
  );
}
