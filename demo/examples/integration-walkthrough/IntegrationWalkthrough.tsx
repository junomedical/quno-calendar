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

const onEventCreateRequest = (range) => {
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
  ["00", "horizontal-first", "Why the primary view runs horizontally"],
  ["01", "infinite-view", "An infinite view without an infinite DOM"],
  ["02", "performance", "Performance should survive the busy days"],
  ["03", "css-native", "Let CSS own the stable parts"],
  ["04", "read-only", "Begin with a read-only calendar"],
  ["05", "event-cards", "Events are data; cards are design"],
  ["06", "card-structure", "Custom card structure follows the product"],
  ["07", "availability", "Availability is a separate interaction layer"],
  ["08", "drag-create", "Drag and create are parent-owned mutations"],
  ["09", "current-time", "Current time should never get lost"],
  ["10", "date-time-navigation", "Go directly to the date and time that matters"],
  ["11", "zoom", "Zoom in and out—when you need it"],
  ["12", "time-precision", "Reveal precision only when it becomes useful"],
  ["13", "styling", "Make the calendar belong to the product"],
  ["14", "date-localization", "Let date labels speak the product’s language"],
  ["15", "overlap-lanes", "Overlap lanes appear only when time collides"],
  ["16", "hover-reveal", "Hover can reveal what an expanded card covers"],
  ["17", "preloading", "Preload the dates a user is likely to visit"],
  ["18", "late-loading", "Load late without making the calendar jump"],
  ["19", "creation-lane", "Creation can focus one doctor lane"],
  ["20", "visual-focus", "Focus keeps the event in view"],
  ["21", "react-integration", "Use it from React"],
  ["22", "motion", "Motion is part of the renderer"],
  ["23", "everything-together", "Let’s see everything together"],
  ["24", "package-footprint", "Keep the package cost visible"]
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
          <h1>A calendar that keeps going, without getting in your way.</h1>
          <p className="calendar-article__dek">
            A scheduling product has to stay fast across years of time, express its own event language, and keep people
            oriented while data changes underneath them. This field guide explains the system boundaries that make those
            outcomes possible.
          </p>
          <div className="calendar-article__meta" aria-label="Article details">
            <span>39 minute read</span>
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

        <ArticleSection id="horizontal-first" number="00" title="Why the primary view runs horizontally">
          <p>
            The primary calendar shows the time of day horizontally—from morning on the left to evening on the
            right—then stacks people, resources, and rooms vertically inside each day. That orientation is a product
            decision about density: vertical space can hold more bookable people and places at once instead of spending
            a wide column on each one.
          </p>
          <p>
            Text in most interface languages flows horizontally, so a horizontal event card uses the same axis for both
            time and reading. Event duration creates width for its title and details; collisions share a compact
            resource row before that row grows locally for readability. The result is a denser presentation with more
            people, resources, rooms, and appointments visible together, without turning short events into narrow
            columns of clipped words.
          </p>
          <p>
            People, resources, rooms, and days all continue along the ordinary vertical scroll axis. Scrolling up and
            down is the cheapest repeated navigation a mouse wheel or touchpad can offer: it needs no modifier key,
            horizontal scrollbar, or small target. One familiar gesture moves through the working set and onward through
            days, making scanning and interaction substantially faster.
          </p>
          <p>
            Vertical orientation still matters when a product needs time to run top to bottom or wants resources
            compared as columns. It appears later as a direct comparison. The horizontal view leads because it best
            combines readable event content, dense overlap, and effortless movement across days.
          </p>
        </ArticleSection>

        <ArticleSection id="infinite-view" number="01" title="An infinite view without an infinite DOM">
          <p>
            A naïve infinite calendar keeps every visited date and event in the page. Memory use grows with every
            scroll, layout work becomes more expensive, and eventually the browser stops responding. Long-range
            navigation is only useful when its cost stays flat.
          </p>
          <p>
            This calendar keeps a fixed date window and mounts only what is near the viewport. Ordinary scrolling
            recenters that window after 1.2 seconds of rest; reaching its absolute top or bottom reduces the wait by 80%
            to 240 ms so the next bounded range arrives sooner. Both paths preserve the exact pixel offset inside the
            visible date. The result is stable memory, predictable layout cost, and a responsive browser whether a user
            travels three days or three years.
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

        <ArticleSection id="performance" number="02" title="Performance should survive the busy days">
          <p>
            A calendar that feels fast with four appointments can still collapse on the first genuinely busy day. This
            system was designed for a working range from a handful of events per day to hundreds, without making sparse
            schedules pay for dense ones or letting accumulated history determine today’s frame cost.
          </p>
          <p>
            The rendering target is smooth 60–120fps scrolling: about 16.7ms per frame on a 60Hz display and 8.3ms on a
            120Hz display. The calendar protects that budget by mounting only nearby dates and resources, indexing and
            preparing overlap cells once, memoizing renderer content, and coalescing pointer and zoom work to animation
            frames. Native sticky positioning keeps stable chrome outside the React scroll loop.
          </p>
          <p>
            Frame rate still depends on the browser, hardware, viewport, event density, and the work performed by the
            product’s external event renderer, so 60–120fps is a design envelope rather than a universal guarantee. The
            important invariant is that cost follows visible work instead of every event the user has ever visited.
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

        <ArticleSection id="css-native" number="03" title="Let CSS own the stable parts">
          <p>
            Scroll-linked interface chrome is easy to over-engineer. Mirroring every scroll position into React or
            JavaScript creates another high-frequency state stream, couples static labels to dynamic event rendering,
            and makes the browser wait for application code before it can paint the next frame.
          </p>
          <p>
            The calendar uses native CSS whenever the platform already owns the behavior. Day headings stay pinned with
            top-axis sticky positioning; dates and resource names stay pinned on the left. The browser can move those
            stable layers directly while React concentrates on changing events, overlap geometry, loading, and
            interaction state. That separation reduces synchronization work and makes static chrome remain readable even
            while the dynamic timeline is busy.
          </p>
          <CodeBlock code={cssNativeSnippet} title="Let the browser position stable calendar chrome" />
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

        <ArticleSection id="read-only" number="04" title="Begin with a read-only calendar">
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

        <ArticleSection id="event-cards" number="05" title="Events are data; cards are design">
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

        <ArticleSection id="card-structure" number="06" title="Custom card structure follows the product">
          <p>
            The most useful first line depends on the task. A treatment planner may scan by product group, a clinical
            handoff by patient, and an operations board by room. Forcing one hierarchy into the calendar would make the
            same event data less useful everywhere else.
          </p>
          <p>
            Because card content belongs to <code>eventRenderer</code>, the product can promote a different domain field
            without changing event geometry, loading, overlap, or navigation. The remaining fields stay as supporting
            context, while the selected grouping becomes the card’s strongest label.
          </p>
          <Callout>
            Switch between Product group, Patient name, and Room number. The same IV Drip, Botox, Sculptra, and skin
            treatment events remain mounted in the same positions while their visual hierarchy changes.
          </Callout>
          <CodeBlock code={customCardStructureSnippet} title="Let workflow choose the card’s primary field" />
          <DemoBreakout>
            <LazyArticleDemo label="custom card structure example">
              <CustomCardStructureDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="availability" number="07" title="Availability is a separate interaction layer">
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

        <ArticleSection id="drag-create" number="08" title="Drag and create are parent-owned mutations">
          <p>
            Scheduling changes are business operations: permissions, working hours, conflicts, billing rules, and
            persistence all belong to the product. A reusable calendar cannot safely guess which move or new range
            should be accepted.
          </p>
          <p>
            Drawing and dragging therefore produce proposals rather than mutating saved data. The live exhibit keeps
            each proposal visible as a parent-owned draft and asks for an explicit Accept or Cancel decision. Accept
            commits the draft to parent state and the visible cache; Cancel removes the draft and restores the
            previously saved calendar exactly as it was. The accepted card enters with the renderer’s appearing
            treatment, while a cancelled draft fades away before its shell is released.
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

        <ArticleSection id="current-time" number="09" title="Current time should never get lost">
          <p>
            A planner is full of possible time, but most operational decisions begin with one question: what needs
            attention now? When the current point in the day disappears during scrolling or scaling, people must
            reconstruct that context from labels before they can judge whether work is early, late, or still reachable.
          </p>
          <p>
            The current-time marker crosses the time scale, day header, and every resource row so “now” remains a shared
            reference instead of belonging to one appointment. Product controls can return to it directly, and
            cursor-free zoom keeps it at the same screen position whenever it is visible. That continuity makes the
            schedule faster to read under pressure.
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

        <ArticleSection id="date-time-navigation" number="10" title="Go directly to the date and time that matters">
          <p>
            Infinite scrolling makes nearby days inexpensive, but known destinations should not require repeated
            gestures. Search results, notifications, “next appointment” links, date pickers, and product shortcuts
            already know where the user intends to go.
          </p>
          <p>
            The imperative navigation handle accepts a date or a date-and-time target, so the product can provide the
            control that matches its workflow. The calendar recenters its bounded window, reveals the requested time,
            and keeps loading behavior internal. Teams can use a compact toolbar, a full month picker, or a command
            palette without coupling those controls to calendar layout. Date and time inputs navigate as soon as their
            value changes; previous and next move by one day without an extra confirmation step.
          </p>
          <CodeBlock code={navigationSnippet} title="Connect any product control to calendar navigation" />
          <DemoBreakout>
            <LazyArticleDemo label="date and time navigation example">
              <NavigationControlsDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="zoom" number="11" title="Zoom in and out—when you need it">
          <p>
            Zoom out when you need the shape of the whole day: open space, busy periods, and how people or rooms
            compare. Zoom in when you need to read a card, judge a shorter gap, or place work to the minute. A fixed
            scale makes one of those tasks unnecessarily difficult.
          </p>
          <p>
            The transition should feel continuous rather than like a jump to a different calendar. The slider and step
            buttons smoothly change the scale while keeping the visible current-time marker—or the center of the
            schedule—fixed. Shift + wheel or Shift + two-finger trackpad zooms around the nearest time under the
            pointer, so you can move between context and precision without losing the area you were examining.
          </p>
          <CodeBlock code={zoomSnippet} title="Keep zoom smooth and controlled" />
          <DemoBreakout>
            <LazyArticleDemo label="controlled zoom example">
              <ZoomCalendarDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="time-precision" number="12" title="Reveal precision only when it becomes useful">
          <p>
            Showing every five-minute label in a full-day overview creates more arithmetic than information. Labels
            collide, hour landmarks lose emphasis, and the schedule becomes harder to scan before the user has asked for
            that precision.
          </p>
          <p>
            The time scale keeps a stable five-minute structure, then progressively reveals readable labels as zoom
            creates room: hours and half hours for overview, quarter hours for planning, and every five minutes for
            precise placement. The calendar gains detail without inserting a burst of new nodes or letting numbers
            overlap.
          </p>
          <Callout>
            Switch through the three precision levels. Minute labels appear in place while the same time-scale elements
            and event cards remain mounted.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="progressive time precision example">
              <ProgressiveTimeRevealDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="styling" number="13" title="Make the calendar belong to the product">
          <p>
            A scheduling surface can be structurally correct and still feel foreign inside the product. Density,
            hierarchy, contrast, and brand tone differ between a clinical workstation, a compact operations console, and
            a low-light planning room.
          </p>
          <p>
            Settings control geometry such as row height, label width, header height, and zoom. A scoped{" "}
            <code>className</code> and ordinary CSS control color, borders, typography, cards, and current-time
            emphasis. The product can create distinct themes without forking calendar logic or reaching into React
            internals.
          </p>
          <CodeBlock code={stylingSnippet} title="Combine geometry settings with scoped CSS" />
          <DemoBreakout>
            <LazyArticleDemo label="calendar styling presets">
              <StylingDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="date-localization" number="14" title="Let date labels speak the product’s language">
          <p>
            Dates are shared data, but their labels are read through a language and a product vocabulary. Hard-coded
            month and weekday names make a global schedule feel foreign, while rebuilding date logic for every locale
            risks changing navigation and event identity along with the text.
          </p>
          <p>
            <code>settings.dateLocale</code> localizes month, day, and weekday labels through the platform’s
            internationalization support. A <code>dayNameGenerator</code> owns the complete displayed label, so it can
            instead speak like a person with Today, Tomorrow, Yesterday, and weekday names, or expose a machine-oriented
            binary sequence. The underlying date key, event loading, excluded weekdays, and virtual position stay
            exactly the same.
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

        <ArticleSection id="overlap-lanes" number="15" title="Overlap lanes appear only when time collides">
          <p>
            Reserving permanent space for every possible collision wastes the quiet parts of a schedule. Keeping every
            row fixed instead hides conflicts or crushes cards exactly when the information matters most.
          </p>
          <p>
            Overlap lanes exist only where event times collide. Depending on the product’s settings, several lanes can
            first share the existing row height without changing the surrounding layout. Only after the configured
            capacity is exceeded does that horizontal row grow locally; vertical columns follow the same rule by
            widening after their own threshold. The schedule stays compact through ordinary overlap, then creates more
            room when density would otherwise compromise readability.
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

        <ArticleSection id="hover-reveal" number="16" title="Hover can reveal what an expanded card covers">
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

        <ArticleSection id="preloading" number="17" title="Preload the dates a user is likely to visit">
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

        <ArticleSection id="late-loading" number="18" title="Load late without making the calendar jump">
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

        <ArticleSection id="creation-lane" number="19" title="Creation can focus one doctor lane">
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

        <ArticleSection id="visual-focus" number="20" title="Focus keeps the event in view">
          <p>
            Saving a draft, assigning a room, or receiving a new collision can move an event to another lane. If focus
            only means “highlight this id,” the highlighted card may still be clipped or outside the viewport when the
            operation succeeds.
          </p>
          <p>
            Event focus therefore guarantees visibility for the requested calendar instance. A fully visible card is
            highlighted without moving the calendar; only an offscreen or partially clipped card is brought into view.
            The same rule applies after save, reassignment, or overlap growth, so continuity does not come at the cost
            of unnecessary scrolling.
          </p>
          <CodeBlock code={visualAnchorSnippet} title="Keep the committed event visible" />
          <DemoBreakout>
            <LazyArticleDemo label="visual focus lane-change example">
              <EventFocusDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="react-integration" number="21" title="Use it from React">
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

        <ArticleSection id="motion" number="22" title="Motion is part of the renderer">
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

        <ArticleSection id="everything-together" number="23" title="Let’s see everything together">
          <p>
            The strongest outcome does not come from any feature in isolation. It comes from keeping each responsibility
            with the layer that understands it: the calendar bounds time and geometry, loaders own data access, product
            controls own navigation and zoom, and renderers own the meaning, theme, and motion of events.
          </p>
          <p>
            The final calendar combines bounded dates, warm event data, availability, dense overlap, a visible
            current-time reference, direct “Today” navigation, controlled zoom, product styling, drag and creation
            proposals, full-screen expansion, and an animated cache commit. Each capability composes through the same
            public package rather than a demo-only integration layer.
          </p>
          <Callout>
            Change density or theme, zoom the schedule, drag an appointment, draw in empty space, insert an animated
            event, or expand the same calendar full screen.
          </Callout>
          <DemoBreakout>
            <LazyArticleDemo label="complete calendar system example">
              <EverythingTogetherDemo />
            </LazyArticleDemo>
          </DemoBreakout>
        </ArticleSection>

        <ArticleSection id="package-footprint" number="24" title="Keep the package cost visible">
          <p>
            Runtime performance is only part of a calendar’s cost. A scheduling surface is present on high-traffic
            screens, so every byte affects startup, parsing, and how quickly the rest of the product becomes usable.
            Bundle size needs the same explicit boundary as event data and rendering ownership.
          </p>
          <p>
            The production ESM build keeps React, React DOM, and the virtualizer external instead of copying packages
            the application already owns. The calendar has one direct runtime dependency, two React peer dependencies,
            and no third-party dependency code bundled into its JavaScript artifact.
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
            This field guide is the single example surface for read-only use, editing, availability, orientation,
            loading, focus, and motion. For an unconstrained stress surface with the same public API, return to the{" "}
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
