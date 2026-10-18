import type { CalendarView } from "@quno/calendar/infinite-calendar";
import type { RefObject } from "react";
import { ConceptIntro } from "./ConceptIntro";
import { ConceptCalendar } from "./ConceptCalendar";
import { ConceptProducts } from "./ConceptProducts";
import { PlaybackCursor } from "./PlaybackCursor";
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
      {" "}
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
          >
            {active ? (
              <>
                <div
                  className="concept-canvas"
                  ref={canvas}
                  {...(locked ? { inert: "" } : {})}
                  aria-hidden={locked || undefined}
                >
                  <div className="concept-stage" key={`${session.product}:${session.scene}:${session.revision}`}>
                    {session.product === "infinite-calendar" ? (
                      <ConceptCalendar
                        scenario={session.scene}
                        initialView={preferredView}
                        onViewChange={setPreferredView}
                      />
                    ) : (
                      <ConceptProducts product={session.product} scenario={session.scene} />
                    )}
                  </div>
                  <PlaybackCursor />
                </div>
                {!fullscreen && (
                  <ConceptIntro
                    product={product}
                    scenario={scenario}
                    actions={actions}
                    open={open}
                    button={button}
                    locked={locked}
                    feedback={feedback}
                  />
                )}
              </>
            ) : (
              <div className="concept-screen-placeholder">
                <span className="concept-eyebrow">QUNO / {product.label}</span>
                <h2>{scenario.label}</h2>
                <p>{scenario.paragraphs[0]}</p>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
