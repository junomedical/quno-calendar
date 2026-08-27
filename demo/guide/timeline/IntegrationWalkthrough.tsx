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
  CalendarCellStylingDemo,
  CustomCardStructureDemo,
  DateLocalizationDemo,
  EverythingTogetherDemo,
  NavigationControlsDemo,
  ProgressiveTimeRevealDemo,
  ThemeDemo,
  TimeMarkerDemo
} from "./ArticleProductDemos";
import { DragCreateArticleDemo, PrefetchLoadingDemo, ReadOnlyArticleDemo } from "./ArticleRecipeDemos";
import { ReactStateDemo } from "./ReactStateDemo";
import { FieldGuidePage } from "#quno-demo/guide/shared/FieldGuidePage";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import { infiniteCalendarProduction } from "#quno-demo/guide/shared/productionProfiles";
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

const containerQuerySnippet = `/* This lab's complete resize interaction is CSS-defined. */
.resize-lab {
  width: 260px;
  height: 92px;
  min-width: 90px;
  max-width: 360px;
  min-height: 28px;
  max-height: 120px;
  overflow: hidden;
  resize: both;
  container: calendar-event / size;
}

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

<QunoInfiniteCalendar
  {...calendarProps}
  eventRenderer={(props) => (
    <TreatmentCard {...props} grouping={grouping} />
  )}
/>`;

const readOnlySnippet = `<QunoInfiniteCalendar
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

<QunoInfiniteCalendar
  {...calendarProps}
  settings={{ ...settings, zoom }}
  onZoomChange={setZoom}
/>`;

const navigationSnippet = `const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);

const previewArrowDate = (event) => {
  if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
  const input = event.currentTarget;
  requestAnimationFrame(() => navigate(parseDate(input.value)));
};

<QunoDateInput
  value={{ start: date, end: date }}
  selectionMode="single"
  expectedRange={expectedRange}
  onKeyDown={previewArrowDate}
  onChange={(selection) => {
    if (!selection) return;
    setDate(selection.start);
    calendarRef.current?.scrollToDate(selection.start);
  }}
/>
<button onClick={() => moveByDays(-1)}>Previous day</button>
<button onClick={() => moveByDays(1)}>Next day</button>

<QunoInfiniteCalendar ref={calendarRef} {...calendarProps} />`;

const themeSnippet = `const settings = {
  rowHeight: density === "compact" ? 42 : 58,
  dayHeaderHeight: density === "compact" ? 36 : 46,
  labelWidth: density === "compact" ? 150 : 190
};

<QunoInfiniteCalendar
  {...calendarProps}
  className={\`product-calendar theme-\${theme}\`}
  settings={settings}
/>

// Product CSS stays scoped to its calendar.
.product-calendar.theme-night {
  --quno-calendar-cell-border: #33443f;
}`;

const calendarCellStylingSnippet = `const getCalendarDayProps = ({ isWeekend }) =>
  isWeekend
    ? {
        className: "weekend-day",
        style: { backgroundColor: "#fff3e3" },
        title: "Weekend"
      }
    : undefined;

const getCalendarCellProps = ({ calendar }) => {
  if (!calendar.id.startsWith("equipment")) return undefined;

  return {
    className: "equipment-cell",
    style: { backgroundColor: "#e8f1ff" },
    title: \`\${calendar.name} equipment\`
  };
};

const getCalendarHourProps = ({ hour }) =>
  hour === 12
    ? {
        className: "lunch-hour",
        style: { backgroundColor: "#dff5e8" },
        title: "Lunch hour"
      }
    : undefined;

<QunoInfiniteCalendar
  {...calendarProps}
  getCalendarCellProps={getCalendarCellProps}
  getCalendarDayProps={getCalendarDayProps}
  getCalendarHourProps={getCalendarHourProps}
/>
`;

const dateLocalizationSnippet = `import type { DayNameGenerator } from "@quno/calendar/infinite-calendar";

const dayNames: Record<string, DayNameGenerator | undefined> = {
  english: undefined,
  japanese: undefined,
  human: (date) => humanRelativeDay(date, today),
  robot: (date) =>
    (calendarDayNumber(date) % 64).toString(2).padStart(6, "0")
};

<QunoInfiniteCalendar
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

<QunoInfiniteCalendar
  {...calendarProps}
  selectedCalendarIds={visibleCalendarIds}
  loadEvents={loadEvents}
/>`;

const availabilitySnippet = `const [interactionMode, setInteractionMode] =
  useState<"events" | "availability">("events");

<QunoInfiniteCalendar
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

<QunoInfiniteCalendar
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
  QunoInfiniteCalendar,
  type EventRendererProps,
  type LoadEvents
} from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

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
      <QunoInfiniteCalendar
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
  ["#horizontal-first", "01", "Fit dense schedules into a clear view"],
  ["#infinite-view", "02", "Move through dates without limits"],
  ["#performance", "03", "Keep busy schedules fast"],
  ["#css-native", "04", "Leverage the browser engine"],
  ["#event-cards", "05", "Render useful event cards"],
  ["#card-structure", "06", "Shape card structure for the occasion"],
  ["#read-only", "07", "Start with a read-only calendar"],
  ["#availability", "08", "Add availability and event layers"],
  ["#drag-create", "09", "Create, move, and edit content"],
  ["#current-time", "10", "Mark and return to the current time"],
  ["#date-time-navigation", "11", "Connect familiar date navigation"],
  ["#zoom", "12", "Zoom without losing precision"],
  ["#time-precision", "13", "Reveal time progressively"],
  ["#styling", "14", "Theme the calendar"],
  ["#calendar-cell-styling", "15", "Style days, hours, rows, and columns from data"],
  ["#date-localization", "16", "Localize dates and product labels"],
  ["#overlap-lanes", "17", "Resolve overlapping content"],
  ["#hover-reveal", "18", "Reveal events beneath a hover"],
  ["#preloading", "19", "Preload events before they enter the view"],
  ["#late-loading", "20", "Keep a stable position during late loading"],
  ["#creation-lane", "21", "Focus creation on one calendar"],
  ["#visual-focus", "22", "Keep the committed event in view"],
  ["#react-integration", "23", "Keep React as the source of truth"],
  ["#motion", "24", "Support motion without losing state"],
  ["#everything-together", "25", "Put everything together"],
  ["#package-footprint", "26", "Ship the package"]
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

export function IntegrationWalkthrough({ embedded = false }: { embedded?: boolean }) {
  return (
    <FieldGuidePage
      className="calendar-article"
      product="Quno/Infinite Calendar"
      title="A simple, fast calendar for complex schedules."
      intro={
        <p>Move through dense schedules, keep events readable, and preserve focus while data and layouts change.</p>
      }
      demoHref="/demo/infinite-calendar"
      contents={articleContents}
      meta={["Interactive examples", "Copyable recipes", "React + Preact"]}
      embedded={embedded}
      testId="calendar-article"
    >
      <ArticleSection id="horizontal-first" number="01" title="Fit dense schedules into a clear view">
        <p>
          Most calendars are built around a month, a week, or one person’s agenda. Business scheduling gets harder: many
          people and rooms share the same day, appointments overlap, availability changes, and event data keeps arriving
          while someone is already working.
        </p>
        <p>
          Quno/Infinite Calendar was built for that density. Time runs horizontally, giving every event duration room
          for a readable card. People, rooms, and equipment stack vertically, so more of the working schedule fits on
          one screen and conflicts remain easy to compare.
        </p>
        <p>
          Days continue down the familiar vertical scroll axis. A mouse wheel or touchpad moves through resources and
          dates without modifier keys or small scrollbar targets, which makes repeated navigation feel natural even when
          the schedule is large.
        </p>
        <p>
          A vertical-time view is still available when resources need to be compared as columns. The calendar keeps both
          orientations because the right projection depends on the work being done.
        </p>
      </ArticleSection>

      <ArticleSection id="infinite-view" number="02" title="Move through dates without limits">
        <p>
          Days flow vertically with no artificial beginning or end. That makes nearby browsing effortless and lets a
          booking, search result, or historical review move months or years away from today without changing views.
        </p>
        <p>
          The browser never pays for an actually infinite page. Quno/Infinite Calendar renders a fixed window around the
          visible dates, then recenters that window after scrolling stops while preserving the exact position inside the
          day. Moving three years costs roughly the same as moving three days.
        </p>
        <p>
          Event loading follows the same moving window. This exhibit produces each requested date range immediately, so
          appointments are already present when a newly scrolled day enters the viewport instead of appearing after a
          simulated loading delay.
        </p>
        <Callout>
          Open the calendar full screen, drag the scrollbar, or keep scrolling through dates. The chip changes from
          “scrolled” to “repositioned” when the bounded window settles, while every new visible date stays populated.
          Closing the overlay returns to this exact article position; the calendar itself never remounts.
        </Callout>
        <DemoBreakout>
          <InfiniteCalendarDemo />
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="performance" number="03" title="Keep busy schedules fast">
        <p>
          Speed matters most when the schedule is hardest to read. A clinic or operations team can move from a few
          appointments to hundreds of events in one day, and the calendar still needs to respond while people scroll,
          hover, drag, and zoom.
        </p>
        <p>
          Quno/Infinite Calendar limits work to the dates, resources, and cards near the viewport. It calculates overlap
          once, reuses rendered card content, and groups pointer and zoom updates by animation frame. These choices
          target smooth 60–120fps scrolling on suitable hardware.
        </p>
        <p>
          Actual frame rate still depends on the browser, device, viewport, event density, and custom event renderer.
          The important guarantee is architectural: rendering cost follows the work on screen, not the full schedule or
          browsing history.
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
          Performance tests cover dense layout scaling, bounded DOM and cache sizes, frame-batched interaction work, and
          stable renderer identity. Product event renderers should keep their own card work equally disciplined.
        </Callout>
      </ArticleSection>

      <ArticleSection id="css-native" number="04" title="Leverage the browser engine">
        <p>
          The browser already knows how to scroll, clip, layer, and keep elements sticky. Using those native
          capabilities avoids rebuilding high-frequency layout behavior in application code.
        </p>
        <p>
          Native CSS sticky positioning keeps day headings at the top and date and resource labels on the left. The
          browser moves those labels directly, so React can concentrate on events, loading, and interactions. This keeps
          wide and tall schedules readable without a second stream of scroll-synchronization state.
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

      <ArticleSection id="event-cards" number="05" title="Render useful event cards">
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
          Card content can also respond to the space the event actually receives. Every event shell is a named CSS size
          container, so the renderer can use container queries instead of page-level media queries: a narrow event can
          keep only its title, while a short event can drop secondary details without changing cards that have more
          room.
        </p>
        <CodeBlock code={rendererSnippet} title="Render a product-specific event card" />
        <CodeBlock code={containerQuerySnippet} title="Keep the most useful content for the available space" />
        <Callout>
          Drag the live card’s lower-right corner. CSS defines the resize behavior, dimension limits, and responsive
          content rules; the same renderer removes supporting details only as its own container becomes narrow or short.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="event card examples">
            <EventCardsDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="card-structure" number="06" title="Shape card structure for the occasion">
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

      <ArticleSection id="read-only" number="07" title="Start with a read-only calendar">
        <p>
          The smallest integration is a calendar that simply shows data. It is enough for patient portals, room
          displays, audit screens, search results, and the first step of a larger scheduling product.
        </p>
        <p>
          Supply resources, events, and an event renderer; omit mutation callbacks and no drag or creation gesture can
          begin. Long-range browsing, loading, zoom, and custom cards still work, and editing can be added later without
          replacing the surface.
        </p>
        <CodeBlock code={readOnlySnippet} title="Render a schedule without editing callbacks" />
        <DemoBreakout>
          <LazyArticleDemo label="read-only calendar example">
            <ReadOnlyArticleDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="availability" number="08" title="Add availability and event layers">
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

      <ArticleSection id="drag-create" number="09" title="Create, move, and edit schedule content">
        <p>
          A drag or newly drawn appointment should feel immediate, even when the real change must wait for permission,
          conflict, billing, or server validation. The calendar can show the proposed result now and defer the final
          decision to the application.
        </p>
        <p>
          Drawing and dragging create an optimistic draft without changing saved events. Accept commits it to
          application state and the visible cache. Moving to another visible date or resource keeps the target at the
          same viewport position instead of snapping its row to the top; Cancel removes the draft and restores both the
          saved schedule and the pre-proposal view.
        </p>
        <Callout>
          Drag a saved card to another visible date or resource. Its row stays where you were working; choose Cancel and
          the original event and viewport return together. Drawing on empty timeline space follows the same review flow.
        </Callout>
        <CodeBlock code={mutationSnippet} title="Stage a proposal, then accept or cancel it" />
        <DemoBreakout>
          <LazyArticleDemo label="drag and create calendar example">
            <DragCreateArticleDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="current-time" number="10" title="Mark and return to the current time">
        <p>
          A business schedule is not only a collection of bookings; it is also a live view of the day. Front desks, care
          teams, and dispatchers need to see where “now” sits and what should happen next.
        </p>
        <p>
          One current-time marker crosses the time scale and every resource row, giving all appointments the same
          reference. A product control can return directly to it, and zoom keeps it in place while it remains visible.
        </p>
        <Callout>
          Scroll the timeline away from the red 13:30 marker, then use “Keep current time visible.” The calendar returns
          to the same date and time without requiring a date-picker round trip.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="current-time marker example">
            <TimeMarkerDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="date-time-navigation" number="11" title="Connect familiar date navigation">
        <p>
          Infinite scrolling should complement familiar controls, not replace them. People still expect a date picker,
          Previous, Next, and Today, while search results and notifications already know the exact destination.
        </p>
        <p>
          Quno Date Input accepts familiar dates and natural phrases, then passes its timezone-free day key to the
          navigation handle. Products can connect the same handle to a command palette, search result, or deep link
          without learning how the infinite date window works.
        </p>
        <Callout>
          Place the caret over part of the date and press Arrow Up or Arrow Down. Each recognized change moves the
          calendar immediately; Enter is still available when typing a complete replacement.
        </Callout>
        <CodeBlock code={navigationSnippet} title="Connect any product control to calendar navigation" />
        <DemoBreakout>
          <LazyArticleDemo label="date navigation example">
            <NavigationControlsDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="zoom" number="12" title="Zoom without losing precision">
        <p>
          The same schedule needs more than one scale. Zoom out to compare the shape of the day across people or rooms;
          zoom in to read cards, inspect short gaps, or place work precisely.
        </p>
        <p>
          The slider and step buttons change scale while preserving the visible current-time marker or schedule center.
          Shift + wheel or Shift + trackpad zooms around the nearest time under the pointer. Both controls let the user
          change detail without losing the part of the schedule they were examining.
        </p>
        <CodeBlock code={zoomSnippet} title="Keep zoom smooth and controlled" />
        <DemoBreakout>
          <LazyArticleDemo label="controlled zoom example">
            <ZoomCalendarDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="time-precision" number="13" title="Reveal time progressively">
        <p>
          Time labels should match the current scale. A full-day view needs clear hour landmarks, while precise
          placement needs minute labels. Showing everything at once would create collisions and make both tasks harder.
        </p>
        <p>
          The time scale reveals detail as space becomes available: hours and half hours for overview, quarter hours for
          planning, and five-minute labels for precise placement. The tick structure stays stable while the readable
          labels change.
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

      <ArticleSection id="styling" number="14" title="Theme the calendar">
        <p>
          Calendar behavior can stay consistent while its visual character changes. A clinical workstation, a compact
          operations console, and a low-light planning room need different density, contrast, and emphasis.
        </p>
        <p>
          Settings control row height, label width, header height, and zoom. A scoped <code>className</code> and CSS
          control colors, borders, typography, cards, and the current-time marker. Products can create distinct themes
          without changing calendar behavior.
        </p>
        <CodeBlock code={themeSnippet} title="Combine geometry settings with scoped CSS" />
        <Callout>
          Switch between Clinical, Compact, and Night. Each preset changes the whole calendar’s density and visual
          language while preserving its behavior.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="calendar styling presets">
            <ThemeDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="calendar-cell-styling" number="15" title="Style days, hours, rows, and columns from data">
        <p>
          Operational meaning often belongs to one date and resource rather than the calendar’s overall theme. Weekend
          capacity may need a warm background, equipment lanes need a distinct color, and lunch needs a visible band.
        </p>
        <p>
          <code>getCalendarDayProps</code> styles a complete date and its visible header from date, weekday,
          Today/weekend, and view context. <code>getCalendarCellProps</code> then adds resource-specific presentation to
          a matching horizontal row or vertical column. <code>getCalendarHourProps</code> styles a visible clock-hour
          band and its time label in either orientation without taking ownership of layout, events, or interaction.
        </p>
        <CodeBlock code={calendarCellStylingSnippet} title="Style dates, clock hours, and resources from context" />
        <Callout>
          Switch between Rows and Columns. The complete weekend stays warm, equipment stays blue, and the 12:00 lunch
          band plus its time label stay green in either orientation.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="calendar day, hour, and cell styling">
            <CalendarCellStylingDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="date-localization" number="16" title="Localize dates and product labels">
        <p>
          Dates should read naturally wherever the calendar is used. That can mean another language and regional format,
          or a more conversational vocabulary such as Today, Tomorrow, and Yesterday.
        </p>
        <p>
          <code>settings.dateLocale</code> formats month, day, and weekday labels with the platform’s
          internationalization support. A <code>dayNameGenerator</code> can replace the complete label with human
          relative names or a machine-oriented binary sequence. Only the displayed text changes; date identity, loading,
          excluded weekdays, and virtual position remain stable.
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

      <ArticleSection id="overlap-lanes" number="17" title="Resolve overlapping content">
        <p>
          Overlap is normal in business scheduling: one person, room, or machine can be connected to several events
          around the same time. Those collisions need to stay visible without making every quiet row unnecessarily
          large.
        </p>
        <p>
          Events receive lanes only where their times collide. A few lanes can share the existing row or column; after a
          configurable threshold, only that dense row grows or that dense column widens. Quiet parts of the schedule
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

      <ArticleSection id="hover-reveal" number="18" title="Reveal events beneath a hover">
        <p>
          Compact overlap cards preserve density, but they cannot always show enough text. Hover temporarily expands the
          card being read without making the other events underneath it unreachable.
        </p>
        <p>
          The hovered card expands temporarily, while pointer hit-testing continues to use each event’s original lane.
          Moving into another lane brings that event forward, so expanded content never makes a neighboring appointment
          unreachable.
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

      <ArticleSection id="preloading" number="19" title="Preload events before they enter the view">
        <p>
          The next place a user will visit is often predictable: tomorrow, the following week, or a known upcoming
          booking. Waiting until arrival creates a visible pause, while loading an entire year wastes network, memory,
          and backend capacity.
        </p>
        <p>
          A bounded warm window loads likely destination dates before they enter the viewport. The calendar deduplicates
          loaded and in-flight ranges, aborts obsolete requests when possible, and rejects stale responses. Nearby
          navigation feels immediate while request and memory costs remain predictable.
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

      <ArticleSection id="late-loading" number="20" title="Keep a stable position during late loading">
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

      <ArticleSection id="creation-lane" number="21" title="Focus creation on one calendar">
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

      <ArticleSection id="visual-focus" number="22" title="Keep the committed event in view">
        <p>
          Saving a draft, opening a search result, assigning another resource, or adding a collision can move the event
          someone cares about. A successful action is confusing if its result ends up clipped or offscreen.
        </p>
        <p>
          A focus request highlights a fully visible card without scrolling. It moves the calendar only when the
          requested card is clipped or offscreen. This keeps the result visible without disrupting users who can already
          see it.
        </p>
        <CodeBlock code={visualAnchorSnippet} title="Keep the committed event visible" />
        <DemoBreakout>
          <LazyArticleDemo label="visual focus lane-change example">
            <EventFocusDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="react-integration" number="23" title="Keep React as the source of truth">
        <p>
          Quno/Infinite Calendar behaves like a React component, not a second application hidden inside one. Your app
          remains the source of truth for resources, permissions, persistence, settings, and product UI; the calendar
          handles layout and reports interaction proposals.
        </p>
        <p>
          Controlled values flow down through <code>selectedCalendarIds</code> and <code>settings.zoom</code>;
          visibility and zoom requests flow back through callbacks. The surrounding product can then persist proposals,
          patch visible events immediately, or change <code>eventVersion</code> when it needs a wider refresh.
        </p>
        <Callout>
          Switch between one and two calendars, then change zoom. The state summary and calendar update together because
          React owns both values; the calendar keeps its visible date and loaded events while those props change.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="React-controlled calendar example">
            <ReactStateDemo />
          </LazyArticleDemo>
        </DemoBreakout>
        <CodeBlock code={completeSnippet} title="Complete minimal integration" />
      </ArticleSection>

      <ArticleSection id="motion" number="24" title="Support motion without losing state">
        <p>
          Motion can make a dense interface easier to understand. A brief glint confirms that an event was saved; a fade
          shows that a draft was cancelled. Neither should move neighboring events or interrupt the task.
        </p>
        <p>
          The calendar reports short-lived states such as <code>appearing</code>; the event renderer chooses a glint,
          fade, scale, or no animation. The shell’s time geometry stays fixed, and <code>prefers-reduced-motion</code>{" "}
          can remove the transition for people who need less motion.
        </p>
        <Callout>
          Start with New draft, then choose Add event or Cancel event. The exhibit enables outcome controls only after a
          draft exists and keeps the 09:00–14:00 window tall enough to inspect either transition.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="appearing event example">
            <MotionDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="everything-together" number="25" title="Put everything together">
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
          Zoom the schedule, drag an appointment, draw in empty space, insert an animated event, or expand the same
          calendar full screen. Styling choices remain in the dedicated theming chapter.
        </Callout>
        <DemoBreakout>
          <LazyArticleDemo label="complete scheduling workflow example">
            <EverythingTogetherDemo />
          </LazyArticleDemo>
        </DemoBreakout>
      </ArticleSection>

      <ArticleSection id="package-footprint" number="26" title="Ship Infinite Calendar independently">
        <p>
          Infinite Calendar JavaScript is 33.44 KiB gzip. Its optional stylesheet is a separate 1.95 KiB gzip import;
          neither number includes React, React DOM, or the external virtualizer supplied by the application.
        </p>
        <p>
          Keeping the artifacts separate makes the cost of behavior, default styling, and application-owned runtimes
          explicit. Products can import JavaScript without CSS, and server code can import JavaScript without document
          access.
        </p>
        <FieldGuideProduction profile={infiniteCalendarProduction} testId="article-package-footprint" />
      </ArticleSection>
    </FieldGuidePage>
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
  return (
    <aside className="calendar-article__callout">
      <strong>Try it</strong>
      {children}
    </aside>
  );
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
      <summary>Implementation · {title}</summary>
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
