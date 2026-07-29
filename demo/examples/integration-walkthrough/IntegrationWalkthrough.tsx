/** @see ./README.md */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import {
  CssNativeDemo,
  CustomCardStructureDemo,
  DateLocalizationDemo,
  EverythingTogetherDemo,
  NavigationControlsDemo,
  ProgressiveTimeRevealDemo,
  StylingDemo,
  TimeMarkerDemo
} from "./ArticleProductDemos";
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

const containerQuerySnippet = `/* Calendar event shells are named "calendar-event" size containers. */
@container calendar-event (width < 120px) {
  .event-card__type,
  .event-card__details,
  .event-card__time {
    display: none;
  }
}

@container calendar-event (height < 54px) {
  .event-card__details,
  .event-card__time {
    display: none;
  }
}`;

const customCardStructureSnippet = `type CardGrouping = "product" | "patient" | "room";

function TreatmentCard({ event, grouping, style }) {
  const primary = {
    product: event.productGroup,
    patient: event.patientName,
    room: event.roomNumber
  }[grouping];

  return (
    <article className="treatment-card" style={style}>
      <small>{grouping}</small>
      <strong>{primary}</strong>
    </article>
  );
}

<CalendarRoot
  {...calendarProps}
  eventRenderer={(props) => (
    <TreatmentCard {...props} grouping={grouping} />
  )}
/>`;

const readOnlySnippet = `<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={visibleCalendarIds}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
/>`;

const cssNativeSnippet = `.calendar-date-header {
  position: sticky;
  top: 0;
}

.calendar-date-label,
.calendar-resource-name {
  position: sticky;
  left: 0;
}`;

const mutationSnippet = `const [pendingDraft, setPendingDraft] = useState(null);

const onEventDraftRequest = (range) => {
  setPendingDraft(toCreateDraft(range));
};

const onEventMoveRequest = (proposal) => {
  setPendingDraft(toEditDraft(proposal));
  return false; // keep saved data unchanged while reviewing
};

const accept = async () => {
  const savedEvent = await api.events.save(pendingDraft.event);
  setEvents((current) => commit(current, savedEvent));
  setPendingDraft(null);
};`;

const zoomSnippet = `const [zoom, setZoom] = useState(1.25);

<CalendarRoot
  {...calendarProps}
  settings={{ ...settings, zoom }}
  onZoomChange={setZoom}
/>`;

const navigationSnippet = `const calendarRef = useRef<CalendarNavigationHandle>(null);

<input
  type="date"
  value={date}
  onChange={(event) => {
    setDate(event.target.value);
    calendarRef.current?.scrollToDateTime(event.target.value, time);
  }}
/>
<input
  type="time"
  value={time}
  onChange={(event) => {
    setTime(event.target.value);
    calendarRef.current?.scrollToDateTime(date, event.target.value);
  }}
/>
<button onClick={() => moveByDays(-1)}>Previous day</button>
<button onClick={() => moveByDays(1)}>Next day</button>

<CalendarRoot ref={calendarRef} {...calendarProps} />`;

const stylingSnippet = `const settings = {
  rowHeight: density === "compact" ? 42 : 58,
  dayHeaderHeight: density === "compact" ? 36 : 46,
  labelWidth: density === "compact" ? 150 : 190
};

<CalendarRoot
  {...calendarProps}
  className={\`product-calendar theme-\${theme}\`}
  settings={settings}
/>

// Product CSS stays scoped to its calendar.
.product-calendar.theme-night {
  --ic-cell-border: #33443f;
}`;

const dateLocalizationSnippet = `import type { DayNameGenerator } from "quno-calendar";

const dayNames: Record<string, DayNameGenerator | undefined> = {
  english: undefined,
  japanese: undefined,
  human: (date) => humanRelativeDay(date, today),
  robot: (date) =>
    (calendarDayNumber(date) % 64).toString(2).padStart(6, "0")
};

<CalendarRoot
  {...calendarProps}
  settings={{
    ...settings,
    dateLocale: mode === "japanese" ? "ja-JP" : "en-US",
    dayNameGenerator: dayNames[mode]
  }}
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

const visualAnchorSnippet = `calendarRef.current?.commitVisibleEvent(savedEvent, {
  previousEventId: draft.event.id,
  appearing: true
});

requestAnimationFrame(() => {
  void calendarRef.current?.focusEvent(savedEvent, {
    preferredCalendarId: savedEvent.calendarId
  });
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
  ["00", "horizontal-first", "Why build another calendar"],
  ["01", "infinite-view", "Vertical and infinite"],
  ["02", "performance", "Fast in the busiest times"],
  ["03", "css-native", "Leveraging browser engine"],
  ["04", "event-cards", "Event cards on the grid"],
  ["05", "card-structure", "Card structure for the occasion"],
  ["06", "read-only", "Starting static example"],
  ["07", "availability", "Availability and event layers"],
  ["08", "drag-create", "Deferred and optimistic event changes"],
  ["09", "current-time", "Time of the day"],
  ["10", "date-time-navigation", "Traditional date navigation"],
  ["11", "zoom", "Zoom into the calendar"],
  ["12", "time-precision", "Progressive time reveal"],
  ["13", "styling", "Visual theming"],
  ["14", "date-localization", "Localization"],
  ["15", "overlap-lanes", "Overlapping events"],
  ["16", "hover-reveal", "See-through event hover"],
  ["17", "preloading", "Content preloading"],
  ["18", "late-loading", "Stable view position"],
  ["19", "creation-lane", "Focus on the person"],
  ["20", "visual-focus", "Keep event in the view"],
  ["21", "react-integration", "Plays nice with React"],
  ["22", "motion", "Supporting animations"],
  ["23", "everything-together", "Full demo"],
  ["24", "package-footprint", "Dependencies and size"]
] as const;

const syntaxKeywords = new Set([
  "as",
  "async",
  "await",
  "const",
  "else",
  "export",
  "from",
  "function",
  "if",
  "import",
  "interface",
  "let",
  "new",
  "return",
  "throw",
  "type"
]);
const syntaxLiterals = new Set(["false", "null", "true", "undefined"]);
const syntaxTokenPattern =
  /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<\/?[A-Za-z][\w.-]*|\b(?:as|async|await|const|else|export|from|function|if|import|interface|let|new|return|throw|type)\b|\b(?:false|null|true|undefined)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$-]*(?=\s*=)|\b[A-Z][A-Za-z0-9_$]*\b|\b[A-Za-z_$][\w$]*(?=\s*\()|=>|===|!==|==|!=|&&|\|\||\?\.|[{}()[\].,:;=<>+\-*/?]/g;

export function IntegrationWalkthrough() {
  return (
    <main className="calendar-article" data-testid="calendar-article">
      <article className="calendar-article__content">
        <header className="calendar-article__hero">
          <p className="calendar-article__eyebrow">Quno Calendar · Field guide</p>
          <h1>A simple, fast calendar for businesses with complex schedules.</h1>
          <p className="calendar-article__dek">
            We built Quno Calendar around the problems scheduling teams face every day: moving through long date ranges
            quickly, reading busy days at a glance, keeping people focused while events load or move, and adapting the
            calendar to the way each business works.
          </p>
          <div className="calendar-article__meta" aria-label="Article details">
            <span>20 minute read</span>
            <span>Interactive examples</span>
            <span>React integration</span>
          </div>
        </header>

        <nav className="calendar-article__toc" aria-label="Table of contents">
          <p>Contents</p>
          <ol>
            {articleContents.map(([number, id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(event) => {
                    const target = document.getElementById(id);
                    const article = event.currentTarget.closest<HTMLElement>(".calendar-article");
                    if (!target || !article) return;
                    event.preventDefault();
                    article.style.scrollBehavior = "auto";
                    window.history.pushState(null, "", `#${id}`);
                    target.scrollIntoView({ block: "start" });
                    window.requestAnimationFrame(() => article.style.removeProperty("scroll-behavior"));
                  }}
                >
                  <span>{number}</span>
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ArticleSection id="horizontal-first" number="00" title="Why build another calendar">
          <p>
            Most calendars are built around a month, a week, or one person’s agenda. Business scheduling gets harder:
            many people and rooms share the same day, appointments overlap, availability changes, and event data keeps
            arriving while someone is already working.
          </p>
          <p>
            Quno Calendar was built for that density. Time runs horizontally, giving every event duration room for a
            readable card. People, rooms, and equipment stack vertically, so more of the working schedule fits on one
            screen and conflicts remain easy to compare.
          </p>
          <p>
            Days continue down the familiar vertical scroll axis. A mouse wheel or touchpad moves through resources and
            dates without modifier keys or small scrollbar targets, which makes repeated navigation feel natural even
            when the schedule is large.
          </p>
          <p>
            A vertical-time view is still available when resources need to be compared as columns. The calendar keeps
            both orientations because the right projection depends on the work being done.
          </p>
        </ArticleSection>

        <ArticleSection id="infinite-view" number="01" title="Vertical and infinite">
          <p>
            Days flow vertically with no artificial beginning or end. That makes nearby browsing effortless and lets a
            booking, search result, or historical review move months or years away from today without changing views.
          </p>
          <p>
            The browser never pays for an actually infinite page. Quno renders a fixed window around the visible dates,
            then recenters that window after scrolling stops while preserving the exact position inside the day. Moving
            three years costs roughly the same as moving three days.
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

        <ArticleSection id="performance" number="02" title="Fast in the busiest times">
          <p>
            Speed matters most when the schedule is hardest to read. A clinic or operations team can move from a few
            appointments to hundreds of events in one day, and the calendar still needs to respond while people scroll,
            hover, drag, and zoom.
          </p>
          <p>
            Quno limits work to the dates, resources, and cards near the viewport. It calculates overlap once, reuses
            rendered card content, and groups pointer and zoom updates by animation frame. These choices target smooth
            60–120fps scrolling on suitable hardware.
          </p>
          <p>
            Actual frame rate still depends on the browser, device, viewport, event density, and custom event renderer.
            The important guarantee is architectural: rendering cost follows the work on screen, not the full schedule
            or browsing history.
          </p>
          <div className="article-performance-range" data-testid="article-performance-range">
            <article>
              <strong>4</strong>
              <span>events / day</span>
              <p>Quiet schedules keep the same lightweight path.</p>
            </article>
            <article>
              <strong>40</strong>
              <span>events / day</span>
              <p>Indexed cells avoid repeated overlap scans.</p>
            </article>
            <article>
              <strong>400</strong>
              <span>events / day</span>
              <p>Virtualization bounds the work to what can be seen.</p>
            </article>
          </div>
          <Callout>
            Performance tests cover dense layout scaling, bounded DOM and cache sizes, frame-batched interaction work,
            and stable renderer identity. Product event renderers should keep their own card work equally disciplined.
          </Callout>
        </ArticleSection>

        <ArticleSection id="css-native" number="03" title="Leveraging browser engine">
          <p>
            The browser already knows how to scroll, clip, layer, and keep elements sticky. Using those native
            capabilities avoids rebuilding high-frequency layout behavior in application code.
          </p>
          <p>
            Native CSS sticky positioning keeps day headings at the top and date and resource labels on the left. The
            browser moves those labels directly, so React can concentrate on events, loading, and interactions. This
            keeps wide and tall schedules readable without a second stream of scroll-synchronization state.
          </p>
          <CodeBlock code={cssNativeSnippet} title="Keep stable labels visible with native CSS" />
          <Callout>
            Scroll the example vertically and horizontally. Day context and resource identity remain visible without a
            scroll-position prop, callback, or duplicate overlay component.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="CSS-native sticky calendar example">
              <CssNativeDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="event-cards" number="04" title="Event cards on the grid">
          <p>
            The grid decides where an event belongs; the card explains what it means. A clinic may show patient and
            treatment details, while an operations board may emphasize status, equipment, or location.
          </p>
          <p>
            The <code>eventRenderer</code> receives the event, render status, overlap information, and available card
            geometry. It can style event types, adjust compact and expanded content, and animate state changes without
            changing calendar layout code.
          </p>
          <p>
            The calendar controls time and placement; the renderer controls meaning and presentation. The same grid can
            therefore support very different products without turning their card design into calendar internals.
          </p>
          <p>
            Card content can also respond to the space the event actually receives. Every event shell is a named CSS
            size container, so the renderer can use container queries instead of page-level media queries: a narrow
            event can keep only its title, while a short event can drop secondary details without changing cards that
            have more room.
          </p>
          <CodeBlock code={rendererSnippet} title="Render a product-specific event card" />
          <CodeBlock code={containerQuerySnippet} title="Keep the most useful content for the available space" />
          <DemoBreakout>
            <LazyArticleDemo label="event card examples">
              <EventCardsDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="card-structure" number="05" title="Card structure for the occasion">
          <p>
            One card does not have one permanently correct hierarchy. A treatment planner may scan by product group, a
            clinical handoff by patient, and a room coordinator by room number.
          </p>
          <p>
            The renderer can promote the relevant field while leaving the event’s time, position, loading, and overlap
            unchanged. This lets one calendar support several working views of the same schedule.
          </p>
          <Callout>
            Switch between Product group, Patient name, and Room number. The same IV Drip, Botox, Sculptra, and skin
            treatment events remain mounted in the same positions while their visual hierarchy changes.
          </Callout>
          <CodeBlock code={customCardStructureSnippet} title="Choose the primary card field for each workflow" />
          <DemoBreakout>
            <LazyArticleDemo label="custom card structure example">
              <CustomCardStructureDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="read-only" number="06" title="Starting static example">
          <p>
            The smallest integration is a calendar that simply shows data. It is enough for patient portals, room
            displays, audit screens, search results, and the first step of a larger scheduling product.
          </p>
          <p>
            Supply resources, events, and an event renderer; omit mutation callbacks and no drag or creation gesture can
            begin. Long-range browsing, loading, zoom, and custom cards still work, and editing can be added later
            without replacing the surface.
          </p>
          <CodeBlock code={readOnlySnippet} title="Render a schedule without editing callbacks" />
          <DemoBreakout>
            <LazyArticleDemo label="read-only calendar example">
              <ReadOnlyArticleDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="availability" number="07" title="Availability and event layers">
          <p>
            Availability and appointments answer different questions. Availability says where work may happen;
            appointments say what has already been booked. Mixing both into one interactive layer makes the schedule
            harder to read and easier to edit by mistake.
          </p>
          <p>
            Availability renders as a full-row background and does not consume overlap lanes. In appointment mode it
            remains visible but does not intercept the pointer. In <code>interactionMode="availability"</code>,
            appointments become inactive context so only availability can be drawn or moved.
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

        <ArticleSection id="drag-create" number="08" title="Deferred and optimistic event changes">
          <p>
            A drag or newly drawn appointment should feel immediate, even when the real change must wait for permission,
            conflict, billing, or server validation. The calendar can show the proposed result now and defer the final
            decision to the application.
          </p>
          <p>
            Drawing and dragging create an optimistic draft without changing saved events. Accept commits it to
            application state and the visible cache; Cancel removes it and restores the saved schedule. The interaction
            stays fast without pretending that persistence has already succeeded.
          </p>
          <Callout>
            Drag a saved card or draw on empty timeline space. The proposed position remains visible while the saved
            event data stays untouched, so validation or confirmation UI can run before persistence.
          </Callout>
          <CodeBlock code={mutationSnippet} title="Stage a proposal, then accept or cancel it" />
          <DemoBreakout>
            <LazyArticleDemo label="drag and create calendar example">
              <DragCreateArticleDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="current-time" number="09" title="Time of the day">
          <p>
            A business schedule is not only a collection of bookings; it is also a live view of the day. Front desks,
            care teams, and dispatchers need to see where “now” sits and what should happen next.
          </p>
          <p>
            One current-time marker crosses the time scale and every resource row, giving all appointments the same
            reference. A product control can return directly to it, and zoom keeps it in place while it remains visible.
          </p>
          <Callout>
            Scroll the timeline away from the red 13:30 marker, then use “Keep current time visible.” The calendar
            returns to the same date and time without requiring a date-picker round trip.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="current-time marker example">
              <TimeMarkerDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="date-time-navigation" number="10" title="Traditional date navigation">
          <p>
            Infinite scrolling should complement familiar controls, not replace them. People still expect a date picker,
            Previous, Next, and Today, while search results and notifications already know the exact destination.
          </p>
          <p>
            The navigation handle accepts a date or date-and-time target and manages the virtual movement internally.
            Products can connect it to a compact toolbar, month picker, command palette, or deep link without learning
            how the infinite date window works.
          </p>
          <CodeBlock code={navigationSnippet} title="Connect any product control to calendar navigation" />
          <DemoBreakout>
            <LazyArticleDemo label="date and time navigation example">
              <NavigationControlsDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="zoom" number="11" title="Zoom into the calendar">
          <p>
            The same schedule needs more than one scale. Zoom out to compare the shape of the day across people or
            rooms; zoom in to read cards, inspect short gaps, or place work precisely.
          </p>
          <p>
            The slider and step buttons change scale while preserving the visible current-time marker or schedule
            center. Shift + wheel or Shift + trackpad zooms around the nearest time under the pointer. Both controls let
            the user change detail without losing the part of the schedule they were examining.
          </p>
          <CodeBlock code={zoomSnippet} title="Keep zoom smooth and controlled" />
          <DemoBreakout>
            <LazyArticleDemo label="controlled zoom example">
              <ZoomCalendarDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="time-precision" number="12" title="Progressive time reveal">
          <p>
            Time labels should match the current scale. A full-day view needs clear hour landmarks, while precise
            placement needs minute labels. Showing everything at once would create collisions and make both tasks
            harder.
          </p>
          <p>
            The time scale reveals detail as space becomes available: hours and half hours for overview, quarter hours
            for planning, and five-minute labels for precise placement. The tick structure stays stable while the
            readable labels change.
          </p>
          <Callout>
            Switch through the three precision levels. Minute labels appear in place while the same time-scale elements
            and event cards remain mounted.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="progressive time reveal example">
              <ProgressiveTimeRevealDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="styling" number="13" title="Visual theming">
          <p>
            Calendar behavior can stay consistent while its visual character changes. A clinical workstation, a compact
            operations console, and a low-light planning room need different density, contrast, and emphasis.
          </p>
          <p>
            Settings control row height, label width, header height, and zoom. A scoped <code>className</code> and CSS
            control colors, borders, typography, cards, and the current-time marker. Products can create distinct themes
            without changing calendar behavior.
          </p>
          <CodeBlock code={stylingSnippet} title="Combine geometry settings with scoped CSS" />
          <DemoBreakout>
            <LazyArticleDemo label="calendar styling presets">
              <StylingDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="date-localization" number="14" title="Localization">
          <p>
            Dates should read naturally wherever the calendar is used. That can mean another language and regional
            format, or a more conversational vocabulary such as Today, Tomorrow, and Yesterday.
          </p>
          <p>
            <code>settings.dateLocale</code> formats month, day, and weekday labels with the platform’s
            internationalization support. A <code>dayNameGenerator</code> can replace the complete label with human
            relative names or a machine-oriented binary sequence. Only the displayed text changes; date identity,
            loading, excluded weekdays, and virtual position remain stable.
          </p>
          <CodeBlock code={dateLocalizationSnippet} title="Localize dates or supply a product day name" />
          <Callout>
            Compare English and Japanese localization, then switch to human-relative or binary robot labels. The same
            calendar instance and visible date remain in place.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="date localization example">
              <DateLocalizationDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="overlap-lanes" number="15" title="Overlapping events">
          <p>
            Overlap is normal in business scheduling: one person, room, or machine can be connected to several events
            around the same time. Those collisions need to stay visible without making every quiet row unnecessarily
            large.
          </p>
          <p>
            Events receive lanes only where their times collide. A few lanes can share the existing row or column; after
            a configurable threshold, only that dense row grows or that dense column widens. Quiet parts of the schedule
            remain compact.
          </p>
          <Callout>
            Switch between Horizontal and Vertical. Both orientations align to the same 13:00 collision cluster, so the
            row growth and column widening can be compared without searching for the events.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="overlap lane comparison">
              <LaneComparisonDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="hover-reveal" number="16" title="See-through event hover">
          <p>
            Compact overlap cards preserve density, but they cannot always show enough text. Hover temporarily expands
            the card being read without making the other events underneath it unreachable.
          </p>
          <p>
            The hovered card expands temporarily, while pointer hit-testing continues to use each event’s original lane.
            Moving into another lane brings that event forward, so expanded content never makes a neighboring
            appointment unreachable.
          </p>
          <Callout>
            This horizontal calendar makes the overlap explicit: the hovered card expands across the stacked mini-lanes
            around 13:00. Move vertically through the stack and it yields as soon as the pointer enters another event’s
            original mini-lane.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="underlying event hover example">
              <HoverRevealDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="preloading" number="17" title="Content preloading">
          <p>
            The next place a user will visit is often predictable: tomorrow, the following week, or a known upcoming
            booking. Waiting until arrival creates a visible pause, while loading an entire year wastes network, memory,
            and backend capacity.
          </p>
          <p>
            A bounded warm window loads likely destination dates before they enter the viewport. The calendar
            deduplicates loaded and in-flight ranges, aborts obsolete requests when possible, and rejects stale
            responses. Nearby navigation feels immediate while request and memory costs remain predictable.
          </p>
          <CodeBlock code={prefetchSnippet} title="Preload nearby dates with a bounded policy" />
          <Callout>
            The loaded-events strip shows every event returned into the warm cache, including the July 13 consultation,
            before that date is visible. Then jump to the prefetched date: the same consultation appears immediately in
            the calendar while the request counter may advance only for dates beyond the new viewport.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="event preloading example">
              <PrefetchLoadingDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="late-loading" number="18" title="Stable view position">
          <p>
            New data should update the schedule, not move the user. A delayed response can add collisions above the
            viewport, change row height, and otherwise shift the appointment someone was reading or about to select.
          </p>
          <p>
            Calendar labels and previously loaded events remain visible during refresh. Before new layout metrics apply,
            the calendar captures the visible date, resource, and local offset, then restores that point after layout.
            Fresh data can reshape the schedule without moving the user’s place.
          </p>
          <p>
            The same event can also appear under several resources, such as both a doctor and a room. Each visible card
            keeps local hover and focus, while persistence and drag state remain tied to one event identity.
          </p>
          <CodeBlock code={loadingSnippet} title="Load events without blocking the calendar" />
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

        <ArticleSection id="creation-lane" number="19" title="Focus on the person">
          <p>
            Once a person has been chosen, the booking decision becomes simpler: find the best opening in that person’s
            schedule. Unrelated rows only compete for attention.
          </p>
          <p>
            The application can temporarily show only the selected person or resource. The draft renders above the
            schedule rather than taking a saved-event lane, so existing appointments and availability stay stable. The
            full resource set can return when creation is complete.
          </p>
          <DemoBreakout>
            <LazyArticleDemo label="single-lane creation example">
              <CreationLaneDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="visual-focus" number="20" title="Keep event in the view">
          <p>
            Saving a draft, opening a search result, assigning another resource, or adding a collision can move the
            event someone cares about. A successful action is confusing if its result ends up clipped or offscreen.
          </p>
          <p>
            A focus request highlights a fully visible card without scrolling. It moves the calendar only when the
            requested card is clipped or offscreen. This keeps the result visible without disrupting users who can
            already see it.
          </p>
          <CodeBlock code={visualAnchorSnippet} title="Keep the committed event visible" />
          <DemoBreakout>
            <LazyArticleDemo label="visual focus lane-change example">
              <EventFocusDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="react-integration" number="21" title="Plays nice with React">
          <p>
            Quno behaves like a React component, not a second application hidden inside one. Your app remains the source
            of truth for resources, permissions, persistence, settings, and product UI; the calendar handles layout and
            reports interaction proposals.
          </p>
          <p>
            The minimal example places the calendar in a sized parent and keeps zoom and resource visibility controlled.
            Applications can persist proposed mutations in their own state, patch visible events for immediate feedback,
            and change <code>eventVersion</code> when a wider refresh is needed.
          </p>
          <CodeBlock code={completeSnippet} initiallyOpen title="Complete minimal integration" />
        </ArticleSection>

        <ArticleSection id="motion" number="22" title="Supporting animations">
          <p>
            Motion can make a dense interface easier to understand. A brief glint confirms that an event was saved; a
            fade shows that a draft was cancelled. Neither should move neighboring events or interrupt the task.
          </p>
          <p>
            The calendar reports short-lived states such as <code>appearing</code>; the event renderer chooses a glint,
            fade, scale, or no animation. The shell’s time geometry stays fixed, and <code>prefers-reduced-motion</code>{" "}
            can remove the transition for people who need less motion.
          </p>
          <Callout>
            This exhibit zooms into the active 09:00–14:00 window and uses a taller lane, making the draft location and
            the renderer’s appearing or cancellation treatment easier to inspect.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="appearing event example">
              <MotionDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="everything-together" number="23" title="Full demo">
          <p>
            The focused examples explain one decision at a time. A real scheduling screen brings them together:
            navigation, zoom, remote data, overlap handling, editing, product-specific cards, and clear save feedback.
          </p>
          <p>
            This example combines bounded dates, preloaded events, availability, dense overlap, current time, Today
            navigation, controlled zoom, styling, reviewed drag and create changes, full-screen expansion, and animated
            commits. Every behavior uses the same public component shown in the focused examples.
          </p>
          <Callout>
            Change density or theme, zoom the schedule, drag an appointment, draw in empty space, insert an animated
            event, or expand the same calendar full screen.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="complete scheduling workflow example">
              <EverythingTogetherDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="package-footprint" number="24" title="Dependencies and size">
          <p>
            A calendar often appears on a product’s busiest screens, so its cost is paid frequently. JavaScript, CSS,
            and duplicated dependencies affect download, parsing, startup, and the time before the rest of the product
            is usable.
          </p>
          <p>
            The production build keeps React, React DOM, and the virtualizer external instead of copying dependencies
            already supplied by the application. The measurements below make the calendar’s direct, peer, and bundled
            costs explicit.
          </p>
          <div className="article-footprint" data-testid="article-package-footprint">
            <dl aria-label="Production package size">
              <div>
                <dt>Calendar ESM</dt>
                <dd>
                  <strong>124.87 KiB</strong>
                  <span>30.96 KiB gzip</span>
                </dd>
              </div>
              <div>
                <dt>Calendar CSS</dt>
                <dd>
                  <strong>5.68 KiB</strong>
                  <span>1.56 KiB gzip</span>
                </dd>
              </div>
              <div>
                <dt>Combined</dt>
                <dd>
                  <strong>130.55 KiB</strong>
                  <span>32.53 KiB gzip</span>
                </dd>
              </div>
            </dl>
            <dl aria-label="Production package dependencies">
              <div>
                <dt>Direct runtime</dt>
                <dd>
                  <strong>1</strong>
                  <span>@tanstack/react-virtual</span>
                </dd>
              </div>
              <div>
                <dt>Peer dependencies</dt>
                <dd>
                  <strong>2</strong>
                  <span>React + React DOM</span>
                </dd>
              </div>
              <div>
                <dt>Bundled third-party</dt>
                <dd>
                  <strong>0</strong>
                  <span>Application copies stay shared</span>
                </dd>
              </div>
            </dl>
          </div>
          <p className="article-footprint__note">
            Measured from the production package build with maximum gzip compression. The bundle guard caps ESM at 32
            KiB gzip and CSS at 2 KiB gzip.
          </p>
        </ArticleSection>

        <footer className="calendar-article__footer">
          <p>
            This guide demonstrates when to use read-only access, editing, availability, orientation, loading, focus,
            and motion. To explore the same API with unrestricted data and controls, open the{" "}
            <a href="/">main calendar demo</a>.
          </p>
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
    <div
      className="article-lazy-demo"
      data-demo-label={label}
      data-mounted={shouldRender ? "true" : "false"}
      ref={containerRef}
    >
      {shouldRender ? children : <div aria-label={`Loading ${label}`} className="article-demo-placeholder" />}
    </div>
  );
}

function CodeBlock({ code, initiallyOpen = false, title }: { code: string; initiallyOpen?: boolean; title: string }) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const highlightedCode = useMemo(() => highlightTsx(code), [code]);

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
          <code aria-label={`${title} TSX source`}>{highlightedCode}</code>
        </pre>
      </div>
    </details>
  );
}

function highlightTsx(code: string) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of code.matchAll(syntaxTokenPattern)) {
    const offset = match.index;
    const token = match[0];
    if (offset > cursor) nodes.push(code.slice(cursor, offset));
    nodes.push(
      <span className={`syntax-${syntaxTokenClass(token, code, offset)}`} key={`${offset}-${tokenIndex}`}>
        {token}
      </span>
    );
    cursor = offset + token.length;
    tokenIndex += 1;
  }

  if (cursor < code.length) nodes.push(code.slice(cursor));
  return nodes;
}

function syntaxTokenClass(token: string, source: string, offset: number) {
  if (token.startsWith("//") || token.startsWith("/*")) return "comment";
  if (/^["'`]/.test(token)) return "string";
  if (token.startsWith("<")) return "tag";
  if (syntaxKeywords.has(token)) return "keyword";
  if (syntaxLiterals.has(token)) return "literal";
  if (/^\d/.test(token)) return "number";
  if (/^[A-Z]/.test(token)) return "type";
  if (/^[A-Za-z_$]/.test(token)) {
    const remainder = source.slice(offset + token.length);
    return /^\s*=/.test(remainder) ? "property" : "function";
  }
  return "operator";
}
