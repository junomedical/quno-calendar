/** @see ./README.md */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CreationLaneDemo,
  EventCardsDemo,
  HoverRevealDemo,
  InfiniteCalendarDemo,
  LaneComparisonDemo,
  MotionDemo,
  StabilityDemo,
  ZoomCalendarDemo
} from "./ArticleDemos";
import { AvailabilityLayerDemo, EventFocusDemo } from "./ArticleSystemDemos";
import { DragCreateArticleDemo, PrefetchLoadingDemo, ReadOnlyArticleDemo } from "./ArticleRecipeDemos";
import "./integrationWalkthrough.css";

const rendererSnippet = `function EventCard({ event, status, laneCount, style }) {
  return (
    <article className={\`event-card status-\${status}\`} style={style}>
      <strong>{event.title}</strong>
      <span>{event.subtitle}</span>
      {laneCount > 1 ? <small>{laneCount} lanes</small> : null}
    </article>
  );
}`;

const readOnlySnippet = `<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={visibleCalendarIds}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
/>`;

const mutationSnippet = `const onEventCreateRequest = async (range) => {
  const savedEvent = await api.events.create(range);
  setEvents((current) => [...current, savedEvent]);
  return savedEvent;
};

const onEventMoveRequest = async (proposal) => {
  await api.events.move(proposal);
  setEvents((current) => applyMove(current, proposal));
  return true;
};`;

const zoomSnippet = `const [zoom, setZoom] = useState(1.25);

<CalendarRoot
  {...calendarProps}
  settings={{ ...settings, zoom }}
  onZoomChange={setZoom}
/>`;

const loadingSnippet = `const loadEvents = async ({ startDate, endDate, calendarIds, signal }) => {
  return api.events.list({ startDate, endDate, calendarIds, signal });
};

<CalendarRoot
  {...calendarProps}
  selectedCalendarIds={visibleCalendarIds}
  loadEvents={loadEvents}
/>`;

const availabilitySnippet = `const [interactionMode, setInteractionMode] =
  useState<"events" | "availability">("events");

<CalendarRoot
  {...calendarProps}
  interactionMode={interactionMode}
  onEventCreateRequest={(range) =>
    interactionMode === "availability"
      ? createAvailability(range)
      : createAppointment(range)
  }
/>`;

const prefetchSnippet = `const eventPrefetchPolicy = () => ({
  beforeDays: 3,
  afterDays: 8
});

<CalendarRoot
  {...calendarProps}
  loadEvents={loadEvents}
  eventPrefetchPolicy={eventPrefetchPolicy}
/>`;

const visualAnchorSnippet = `const anchor = calendarRef.current?.captureViewportAnchor({
  eventId: draft.event.id,
  calendarId: draft.event.calendarId
});

saveDraft(draft);

calendarRef.current?.restoreViewportAnchor(anchor, {
  target: { eventId: savedEvent.id, calendarId: savedEvent.calendarId },
  afterRecenter: true
});`;

const completeSnippet = `import { useState } from "react";
import {
  CalendarRoot,
  type EventRendererProps,
  type LoadEvents
} from "quno-calendar";
import "quno-calendar/styles.css";

const calendars = [{ id: "provider-a", name: "Provider A" }];

const loadEvents: LoadEvents = async (range) => {
  const response = await fetch("/api/events", {
    method: "POST",
    body: JSON.stringify(range)
  });
  return response.json();
};

function EventCard({ event, status, style }: EventRendererProps) {
  return (
    <article className={\`event-card status-\${status}\`} style={style}>
      <strong>{event.title}</strong>
      <span>{event.subtitle}</span>
    </article>
  );
}

export function Schedule() {
  const [zoom, setZoom] = useState(1.25);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState(["provider-a"]);

  return (
    <div style={{ height: 560 }}>
      <CalendarRoot
        calendars={calendars}
        selectedCalendarIds={visibleCalendarIds}
        loadEvents={loadEvents}
        eventRenderer={EventCard}
        settings={{ startHour: 8, endHour: 18, zoom }}
        onZoomChange={setZoom}
        onCalendarVisibilityRequest={({ calendarIds }) =>
          setVisibleCalendarIds(calendarIds)
        }
      />
    </div>
  );
}`;

const articleContents = [
  ["01", "infinite-view", "An infinite view without an infinite DOM"],
  ["02", "read-only", "Begin with a read-only calendar"],
  ["03", "event-cards", "Events are data; cards are design"],
  ["04", "availability", "Availability is a separate interaction layer"],
  ["05", "drag-create", "Drag and create are parent-owned mutations"],
  ["06", "zoom", "Zoom belongs to the product"],
  ["07", "overlap-lanes", "Overlap lanes appear only when time collides"],
  ["08", "hover-reveal", "Hover can reveal what an expanded card covers"],
  ["09", "preloading", "Preload the dates a user is likely to visit"],
  ["10", "late-loading", "Load late without making the calendar jump"],
  ["11", "creation-lane", "Creation can focus one doctor lane"],
  ["12", "visual-focus", "Visual focus follows the event, not its lane"],
  ["13", "react-integration", "Use it from React"],
  ["14", "motion", "Motion is part of the renderer"]
] as const;

export function IntegrationWalkthrough() {
  return (
    <main className="calendar-article" data-testid="calendar-article">
      <article className="calendar-article__content">
        <header className="calendar-article__hero">
          <p className="calendar-article__eyebrow">Quno Calendar · Field guide</p>
          <h1>A calendar that keeps going, without getting in your way.</h1>
          <p className="calendar-article__dek">
            A scheduling product has to stay fast across years of time, express its own event language, and keep people
            oriented while data changes underneath them. This field guide explains the system boundaries that make those
            outcomes possible.
          </p>
          <div className="calendar-article__meta" aria-label="Article details">
            <span>26 minute read</span>
            <span>Interactive examples</span>
            <span>React integration</span>
          </div>
        </header>

        <nav className="calendar-article__toc" aria-label="Table of contents">
          <p>Contents</p>
          <ol>
            {articleContents.map(([number, id, title]) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span>{number}</span>
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ArticleSection id="infinite-view" number="01" title="An infinite view without an infinite DOM">
          <p>
            A naïve infinite calendar keeps every visited date and event in the page. Memory use grows with every
            scroll, layout work becomes more expensive, and eventually the browser stops responding. Long-range
            navigation is only useful when its cost stays flat.
          </p>
          <p>
            This calendar keeps a fixed date window and mounts only what is near the viewport. After scrolling settles
            for 1.2 seconds, it recenters that window around the visible date while preserving the exact pixel offset
            inside the date. The result is stable memory, predictable layout cost, and a responsive browser whether a
            user travels three days or three years.
          </p>
          <Callout>
            Open the calendar full screen, drag the scrollbar, or keep scrolling through dates. The chip changes from
            “scrolled” to “repositioned” when the bounded window settles. Closing the overlay returns to this exact
            article position; the calendar itself never remounts.
          </Callout>
          <DemoBreakout>
            <InfiniteCalendarDemo />
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="read-only" number="02" title="Begin with a read-only calendar">
          <p>
            Many products need a trustworthy schedule before they need an editor: an audit view, a room display, a
            patient portal, or a search result. A read-only boundary avoids accidental mutation and authorization work
            while retaining the same virtualization, asynchronous loading, zoom, and responsive cards used by the full
            planner.
          </p>
          <p>
            That makes read-only a production capability, not a stripped-down demo. The product supplies calendars,
            visible ids, event data, and a renderer; interaction can be added later without replacing the surface users
            already trust.
          </p>
          <CodeBlock code={readOnlySnippet} title="The smallest useful calendar" />
          <DemoBreakout>
            <LazyArticleDemo label="read-only calendar example">
              <ReadOnlyArticleDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="event-cards" number="03" title="Events are data; cards are design">
          <p>
            A scheduling engine should know where an event belongs without dictating what that event means. If card
            design lives inside the calendar, every new event type, theme, product hierarchy, or animation becomes a
            calendar change.
          </p>
          <p>
            Instead, a separate <code>eventRenderer</code> module receives the event properties, render status, overlap
            information, and shell geometry needed to place the card. The product can theme appointments, distinguish
            locked and available time, fit several collisions into one resource row, reveal detail on hover, and animate
            state changes without teaching the calendar any domain-specific UI.
          </p>
          <p>
            The shell therefore owns only time and placement; the card owns content and expression. That separation
            keeps layout reliable while allowing the same event data to look compact, expanded, newly added, or
            cancelled wherever the product uses it.
          </p>
          <CodeBlock code={rendererSnippet} title="A product-owned event card" />
          <DemoBreakout>
            <LazyArticleDemo label="event card examples">
              <EventCardsDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="availability" number="04" title="Availability is a separate interaction layer">
          <p>
            Available time answers a different question from booked time: where may work happen, not what has already
            been scheduled. Treating both as ordinary cards makes the calendar noisier, consumes overlap space, and
            creates ambiguous editing gestures.
          </p>
          <p>
            Availability is therefore projected as a full-row background layer that never consumes a lane. In normal
            event mode it is pointer-transparent context. In <code>interactionMode="availability"</code>, appointments
            remain visible but stop intercepting gestures, so only the intended layer can be drawn or edited. The
            product gains safer editing without hiding the schedule people need for context.
          </p>
          <CodeBlock code={availabilitySnippet} title="Choose the editable layer" />
          <Callout>
            Switch to “Edit availability,” then draw or move a green interval. The appointment cards deliberately fade
            into context and cannot intercept the availability gesture.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="availability interaction layer example">
              <AvailabilityLayerDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="drag-create" number="05" title="Drag and create are parent-owned mutations">
          <p>
            Scheduling changes are business operations: permissions, working hours, conflicts, billing rules, and
            persistence all belong to the product. A reusable calendar cannot safely guess which move or new range
            should be accepted.
          </p>
          <p>
            Drawing and dragging therefore produce proposals rather than mutating data. The parent validates and stores
            them, then accepts or rejects the result. Accepted changes enter the visible cache immediately for
            responsive feedback; rejected changes leave committed data untouched. Users get fast interaction without
            splitting authority between the calendar and the backend.
          </p>
          <CodeBlock code={mutationSnippet} title="Persist first, then accept the calendar proposal" />
          <DemoBreakout>
            <LazyArticleDemo label="drag and create calendar example">
              <DragCreateArticleDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="zoom" number="06" title="Zoom belongs to the product">
          <p>
            Schedulers alternate between scanning a full day and placing work to the minute. A fixed scale forces one of
            those jobs to be uncomfortable, while calendar-owned zoom makes it difficult to persist preferences or
            coordinate product controls.
          </p>
          <p>
            Zoom is controlled through <code>settings.zoom</code> and <code>onZoomChange</code>, so toolbars, keyboard
            commands, and saved preferences share one source of truth. External controls preserve the visible grid
            center; Shift + wheel or Shift + two-finger trackpad keeps the nearest rendered time node under the pointer.
            People can change precision without losing the time they were examining.
          </p>
          <CodeBlock code={zoomSnippet} title="One source of truth for zoom" />
          <DemoBreakout>
            <LazyArticleDemo label="controlled zoom example">
              <ZoomCalendarDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="overlap-lanes" number="07" title="Overlap lanes appear only when time collides">
          <p>
            Reserving permanent space for every possible collision wastes the quiet parts of a schedule. Keeping every
            row fixed instead hides conflicts or crushes cards exactly when the information matters most.
          </p>
          <p>
            Overlap lanes exist only where event times collide. One or two lanes keep the compact base resource row;
            dense horizontal rows grow locally, and vertical columns widen only after their configured capacity. The
            schedule remains easy to scan while every real conflict still receives visible space.
          </p>
          <DemoBreakout>
            <LazyArticleDemo label="overlap lane comparison">
              <LaneComparisonDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="hover-reveal" number="08" title="Hover can reveal what an expanded card covers">
          <p>
            Dense collisions need compact cards, but compact cards cannot always carry enough text to identify the right
            appointment. Permanently enlarging them would destroy the density that makes the planner useful.
          </p>
          <p>
            A hovered card can expand temporarily while hit-testing continues to use every event’s original lane. Moving
            into a covered lane hands focus to the underlying event and brings it forward. Detail is available on
            demand, and no event becomes unreachable just because a neighbor is easier to read.
          </p>
          <Callout>
            This exhibit turns the calendar vertically so the covered lanes run left to right. Move horizontally through
            the stacked events around 13:00. The expanded card yields as soon as the pointer enters another event’s
            original mini-lane.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="underlying event hover example">
              <HoverRevealDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="preloading" number="09" title="Preload the dates a user is likely to visit">
          <p>
            Waiting for events after every small scroll makes the calendar feel slower than the work around it. Loading
            an entire year avoids that pause, but spends network, memory, and backend capacity on dates the user may
            never visit.
          </p>
          <p>
            A bounded warm window loads likely next dates before they enter view. Loaded and in-flight ranges are
            deduplicated; obsolete requests can be aborted, and late generations cannot overwrite newer data. The next
            navigation feels immediate while the product keeps its memory and request budget predictable.
          </p>
          <CodeBlock code={prefetchSnippet} title="Control the warm event window" />
          <Callout>
            Wait for the first range to settle, then jump to the prefetched date. Its consultation is already cached;
            the request counter may advance only to warm dates beyond the new viewport.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="event preloading example">
              <PrefetchLoadingDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="late-loading" number="10" title="Load late without making the calendar jump">
          <p>
            Event APIs rarely arrive in layout order. A delayed response can introduce several collisions above the
            viewport, change a resource row’s height, and move the appointment a user was reading or about to click.
            Correct data that makes the interface jump still feels broken.
          </p>
          <p>
            Calendar chrome and stale events remain visible during refresh. Before late metrics apply, the calendar
            captures the visible date, resource row, and row-local offset, then restores that semantic point after
            layout. Visibility changes use the same anchor, so fresh information can reshape the schedule without moving
            the user’s place.
          </p>
          <p>
            The same model supports shared resources. One consultation can project into both a doctor and a room while
            retaining a single event identity: local hover and focus stay with the visible card instance, while
            persistence and drag state remain consistent across every projection.
          </p>
          <CodeBlock code={loadingSnippet} title="Loading is an asynchronous boundary" />
          <Callout>
            Scroll partway into a day, then load the dense update or reveal the shared room. Existing content remains
            visible while the delayed response arrives, and the visual focus does not jump.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="delayed loading stability example">
              <StabilityDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="creation-lane" number="11" title="Creation can focus one doctor lane">
          <p>
            Choosing a time for one doctor is harder when every other practitioner competes for attention. A draft that
            also consumes an overlap lane makes the remaining availability narrower precisely while the user is trying
            to compare it.
          </p>
          <p>
            The parent can temporarily narrow creation to the selected doctor, and the draft renders as an overlay
            rather than a saved-event lane. Existing appointments and availability remain visible underneath. The user
            gets a stable, uncluttered comparison surface and can return to the full resource set when the decision is
            complete.
          </p>
          <DemoBreakout>
            <LazyArticleDemo label="single-lane creation example">
              <CreationLaneDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="visual-focus" number="12" title="Visual focus follows the event, not its lane">
          <p>
            Saving a draft, assigning a room, or receiving a new collision can move an event to another lane. If focus
            follows screen coordinates, the user loses the object they were editing as soon as the operation succeeds.
          </p>
          <p>
            Focus is anchored to the event and calendar instance instead. The parent captures that semantic anchor
            before a mutation and restores it after identity or lane geometry changes. The card stays at the same visual
            point, preserving continuity through save, reassignment, and overlap growth.
          </p>
          <CodeBlock code={visualAnchorSnippet} title="Carry visual focus across a mutation" />
          <DemoBreakout>
            <LazyArticleDemo label="visual focus lane-change example">
              <EventFocusDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="react-integration" number="13" title="Use it from React">
          <p>
            A calendar is easier to evolve when ownership is explicit. The product supplies resources, visible ids,
            asynchronous event data, and card design; the calendar supplies bounded rendering, time geometry, and
            interaction proposals. Each side can change without duplicating the other’s state.
          </p>
          <p>
            The minimal integration below keeps that contract small. Put the calendar in a sized parent, persist
            mutations in product state, use targeted cache commits when immediate feedback matters, and bump{" "}
            <code>eventVersion</code> when a broader refresh is appropriate.
          </p>
          <CodeBlock code={completeSnippet} initiallyOpen title="Complete minimal integration" />
        </ArticleSection>

        <ArticleSection id="motion" number="14" title="Motion is part of the renderer">
          <p>
            Saving and cancelling both need visible confirmation. Without feedback, people repeat actions or wonder
            whether the schedule changed; animation that changes card geometry, however, can destabilize the very layout
            it is meant to clarify.
          </p>
          <p>
            The calendar reports short-lived states such as <code>appearing</code>, while the external renderer chooses
            a glint, fade, scale, or no animation. Added and cancelled feedback can match the product theme without
            changing time geometry, and <code>prefers-reduced-motion</code> can collapse both transitions for people who
            need a quieter interface.
          </p>
          <DemoBreakout>
            <LazyArticleDemo label="appearing event example">
              <MotionDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <footer className="calendar-article__footer">
          <p>
            This field guide is the single example surface for read-only use, editing, availability, orientation,
            loading, focus, and motion. For an unconstrained stress surface with the same public API, return to the{" "}
            <a href="/">main calendar demo</a>.
          </p>
          <a
            href="https://github.com/quno-ai/quno-calendar/tree/main/demo/examples/integration-walkthrough"
            rel="noreferrer"
            target="_blank"
          >
            Read the article source
          </a>
        </footer>
      </article>
    </main>
  );
}

function ArticleSection({
  children,
  id,
  number,
  title
}: {
  children: ReactNode;
  id: string;
  number: string;
  title: string;
}) {
  return (
    <section className="calendar-article__section" id={id}>
      <p className="calendar-article__section-number">{number}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <aside className="calendar-article__callout">{children}</aside>;
}

function DemoBreakout({ children }: { children: ReactNode }) {
  return <div className="calendar-article__breakout">{children}</div>;
}

function LazyArticleDemo({ children, label }: { children: ReactNode; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldRender) return;
    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: "480px 0px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div className="article-lazy-demo" data-mounted={shouldRender ? "true" : "false"} ref={containerRef}>
      {shouldRender ? children : <div aria-label={`Loading ${label}`} className="article-demo-placeholder" />}
    </div>
  );
}

function CodeBlock({ code, initiallyOpen = false, title }: { code: string; initiallyOpen?: boolean; title: string }) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Select to copy");
    }
    window.setTimeout(() => setCopyLabel("Copy"), 1_400);
  };

  return (
    <details className="article-code" open={initiallyOpen}>
      <summary>{title}</summary>
      <div className="article-code__body">
        <button aria-label={`Copy ${title}`} onClick={() => void copy()} type="button">
          {copyLabel}
        </button>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </details>
  );
}
