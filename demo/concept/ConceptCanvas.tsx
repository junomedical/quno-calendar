import type { CalendarView } from "@quno/calendar/infinite-calendar";
import type { RefObject } from "react";
import { ConceptCalendar } from "./ConceptCalendar";
import { ConceptProducts } from "./ConceptProducts";
import { PlaybackCursor } from "./PlaybackCursor";
import type { Session } from "./usePlayback";
export function ConceptCanvas({
  session,
  canvas,
  preferredView,
  setPreferredView,
  locked
}: {
  session: Session;
  canvas: RefObject<HTMLDivElement>;
  preferredView: CalendarView;
  setPreferredView: (view: CalendarView) => void;
  locked: boolean;
}) {
  return (
    <div className="concept-canvas" ref={canvas} {...(locked ? { inert: "" } : {})} aria-hidden={locked || undefined}>
      {session.product === "infinite-calendar" ? (
        <div className="concept-stage">
          <ConceptCalendar
            scenario={session.scene}
            revision={session.revision}
            initialView={preferredView}
            onViewChange={setPreferredView}
          />
        </div>
      ) : (
        <div className="concept-stage" key={`${session.product}:${session.scene}:${session.revision}`}>
          <ConceptProducts product={session.product} scenario={session.scene} />
        </div>
      )}
      <PlaybackCursor />
    </div>
  );
}
