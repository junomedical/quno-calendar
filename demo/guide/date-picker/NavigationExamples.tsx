import { useState } from "react";
import type { JSX } from "react";
import { QunoDatePicker } from "@quno/calendar/date-picker";

const labels = { hint: "" };

export const StableViewExample = (): JSX.Element => (
  <div className="story__fixed-frame">
    <span>Fixed six-week frame</span>
    <QunoDatePicker
      className="story__picker"
      defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
      initialMonth="2026-08-01"
      labels={labels}
    />
  </div>
);

export const QuickJumpExample = (): JSX.Element => (
  <QunoDatePicker
    className="story__picker"
    defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
    initialMonth="2026-08-01"
    labels={labels}
  />
);

export const HiddenRowExample = (): JSX.Element => (
  <QunoDatePicker
    className="story__picker story__picker--violet"
    defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
    initialMonth="2026-08-01"
    labels={labels}
  />
);

export const ShortcutExample = (): JSX.Element => (
  <QunoDatePicker
    className="story__picker story__picker--warm"
    defaultValue={{ start: "2026-07-20", end: "2026-09-12" }}
    initialMonth="2026-08-01"
    labels={labels}
  />
);

export const MotionExample = (): JSX.Element => {
  const [reduced, setReduced] = useState(false);
  return (
    <div className="story__controlled-example">
      <div className="story__controls" aria-label="Motion example mode">
        <button aria-pressed={!reduced} onClick={() => setReduced(false)}>
          Motion
        </button>
        <button aria-pressed={reduced} onClick={() => setReduced(true)}>
          Reduced motion
        </button>
      </div>
      <QunoDatePicker
        className={`story__picker${reduced ? " story__picker--no-motion" : ""}`}
        defaultValue={{ start: "2026-08-10", end: "2026-08-18" }}
        initialMonth="2026-08-01"
        labels={labels}
      />
    </div>
  );
};
