import type { CalendarView } from "@quno/calendar/infinite-calendar";
import type { RefObject } from "react";
import { ConceptIntro } from "./ConceptIntro";
import { ConceptCanvas } from "./ConceptCanvas";
import { catalog } from "./scenarioCatalog";
import type { Product } from "./scenarioTypes";
import type { Session } from "./usePlayback";
import type { PlaybackActions } from "./PlaybackControls";
export function ConceptScreens({
  session,
  product,
  canvas,
  preferredView,
  setPreferredView,
  fullscreen,
  locked,
  actions,
  open,
  button,
  feedback
}: {
  session: Session;
  product: Product;
  canvas: RefObject<HTMLDivElement>;
  preferredView: CalendarView;
  setPreferredView: (view: CalendarView) => void;
  fullscreen: boolean;
  locked: boolean;
  actions: PlaybackActions;
  open: () => void;
  button: RefObject<HTMLButtonElement>;
  feedback: string;
}) {
  return (
    <>
      {catalog[session.product].map((scenario) => {
        const active = scenario.id === session.scene;
        return (
          <section
            key={`${session.product}:${scenario.id}`}
            className={`concept-screen ${active ? "concept-hero" : ""}`}
            data-scene-id={scenario.id}
            data-active={active}
            aria-label={`${scenario.label} demo`}
            aria-hidden={!active || undefined}
            {...(!active ? { inert: "" } : {})}
          >
            {active && session.product !== "infinite-calendar" && (
              <ConceptCanvas {...{ session, canvas, preferredView, setPreferredView, locked }} />
            )}
            {!fullscreen && (
              <ConceptIntro
                product={product}
                scenario={scenario}
                actions={{ ...actions, playing: active && actions.playing }}
                open={open}
                button={active ? button : undefined}
                locked={locked}
                feedback={active ? feedback : ""}
              />
            )}
          </section>
        );
      })}
    </>
  );
}
