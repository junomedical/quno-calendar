import { lazy, Suspense } from "react";
import { DatePickerStory } from "./date-picker/DatePickerStory";
import "./guide.css";

const CompositionExample = lazy(async () => {
  const module = await import("./CompositionExample");
  return { default: module.CompositionExample };
});
const TimelineGuide = lazy(async () => {
  const module = await import("./timeline/IntegrationWalkthrough");
  return { default: module.IntegrationWalkthrough };
});

const tasks = [
  ["#date-selection", "01", "Select and type dates"],
  ["#timeline-guide", "02", "View schedules horizontally and vertically"],
  ["#load-events", "03", "Load and render events"],
  ["#event-editing", "04", "Create, move, and edit schedule content"],
  ["#navigation", "05", "Navigate, zoom, and focus"],
  ["#compose", "06", "Compose the date picker with the timeline"],
  ["#localization", "07", "Localize, theme, and customize"],
  ["#integration", "08", "Integrate React, Preact, SSR, and builds"]
] as const;

export function QunoGuide() {
  return (
    <main className="quno-guide">
      <header className="quno-guide__hero">
        <p>Quno Calendar · Field guide</p>
        <h1>Dates and schedules, documented as one system.</h1>
        <p>Use a component independently, or compose them through their public APIs.</p>
        <nav aria-label="Guide contents">
          {tasks.map(([href, number, title]) => (
            <a href={href} key={href}>
              <small>{number}</small>
              <strong>{title}</strong>
            </a>
          ))}
        </nav>
      </header>

      <section id="date-selection">
        <DatePickerStory embedded />
      </section>

      <Suspense fallback={<p className="quno-guide__loading">Loading the composition exhibit…</p>}>
        <CompositionExample />
      </Suspense>

      <section id="timeline-guide">
        <Suspense fallback={<p className="quno-guide__loading">Loading timeline exhibits…</p>}>
          <TimelineGuide embedded />
        </Suspense>
      </section>

      <section className="guide-section" id="integration">
        <p className="guide-section__number">08</p>
        <h2>Integrate React, Preact, SSR, and production builds</h2>
        <p>
          <strong>Try it:</strong> import one JavaScript subpath without CSS, then add only its optional stylesheet.
        </p>
        <pre>
          <code>{`import { QunoDatePicker } from '@quno/calendar/date-picker';\nimport '@quno/calendar/date-picker/styles.css';`}</code>
        </pre>
        <p>
          See <strong>docs/usage.md</strong> for React, Preact aliases, SSR, and build recipes.
        </p>
      </section>
    </main>
  );
}
