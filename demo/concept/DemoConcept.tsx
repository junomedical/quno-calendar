import type { CalendarView } from "@quno/calendar/infinite-calendar";
import { useCallback, useRef, useState } from "react";
import { ConceptCanvas } from "./ConceptCanvas";
import { ConceptHeader } from "./ConceptHeader";
import { ConceptTour } from "./ConceptTour";
import { catalog } from "./scenarioCatalog";
import { usePlayback } from "./usePlayback";
import { useDemoPresentation } from "./useDemoPresentation";
import { useConceptNavigation } from "./useConceptNavigation";
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
  const { session, setSession, intro, select, change } = useConceptNavigation();
  const [preferredView, setPreferredView] = useState<CalendarView>("infinite-horizontal");
  const canvas = useRef<HTMLDivElement>(null);
  const stop = useCallback(
    () => setSession((current) => (current.mode === "idle" ? current : { ...current, mode: "idle" })),
    [setSession]
  );
  const presentation = useDemoPresentation(stop);
  const { fullscreen } = presentation;
  const locked = false;
  const feedback = usePlayback(canvas, session, stop, stop, !locked);
  const current = catalog[session.product].find((item) => item.id === session.scene)!;
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
      {!fullscreen && <ConceptHeader product={session.product} change={change} />}
      <ConceptTour
        key={session.product}
        product={session.product}
        scenario={current}
        actions={actions}
        intro={intro}
        select={select}
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
