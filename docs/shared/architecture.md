# Shared package architecture

`@quno/calendar` contains five independently importable products authored in React. Consumers pay only for the entry
points and optional stylesheets they import.

## Public surfaces

| Entry point                        | Responsibility                                            | Runtime UI | Stylesheet   |
| ---------------------------------- | --------------------------------------------------------- | ---------- | ------------ |
| `@quno/calendar`                   | Timezone-free day contracts and safe calendar-day helpers | No         | No           |
| `@quno/calendar/infinite-calendar` | Virtualized schedules and timestamped events              | React      | `styles.css` |
| `@quno/calendar/datepicker`        | Direct manipulation of one day or an inclusive range      | React      | `styles.css` |
| `@quno/calendar/date-input`        | Controlled or uncontrolled typed date and range input     | React      | `styles.css` |
| `@quno/calendar/timepicker`        | Standalone timezone-free clock selection                  | React      | `styles.css` |
| `@quno/calendar/date-parser`       | Headless recognition and tokenization                     | No         | No           |

The root exports no UI. Date Input may consume parser implementation internally but does not re-export the parser's
public API. Datepicker and Infinite Calendar compose only through consumer-owned state and public handles.

## Date models

Shared `IsoDate` values represent timezone-free `YYYY-MM-DD` calendar days. Datepicker, Date Input, and Date Parser use
that model throughout. Infinite Calendar uses `IsoDate` for day keys, navigation, and loader boundaries, while event
`start` and `end` values remain local or offset-aware timestamp strings. Never apply timezone-free day arithmetic to
event timestamps.

Date Parser returns top-level `start` and `end` objects of type `DateInputParseEndpoint`, pairing an `IsoDate` with a
timezone-free `HH:mm` clock. A date-only or omitted endpoint time is `null`. Empty and invalid results have no endpoints.
Overnight inference uses calendar-day arithmetic, without producing event
timestamps or applying a timezone. Datepicker and Date Input opt into a separate `time`/`defaultTime` clock only with
single-day `timeMode`; both emit the shared `DateTimeSelectionChange` and consume headless `TimeSelectionOptions`.
The parser facade owns clock tokenization and result composition. Date Input compiles that facade once per
configuration, synchronously recognizes one clock, and validates enabled hours/cadence in its own UI domain only
when its `forceCadence` prop is true. Picker options remain constrained independently of typed recognition.
Datepicker owns the day-to-time view handoff and pointer compatibility-click suppression; its selection summary presents the separate clock.
Its optional behavior increases the independently imported input bundle; Datepicker never imports parser code.

## Dependency direction

- Product entry points may import the shared headless layer.
- Date Input may import the internal parser responsibility domain.
- Datepicker may import the private time-slot renderer owned by Timepicker. Timepicker imports only its own domain and shared headless contracts.
- Datepicker, Date Input, and Infinite Calendar do not import one another.
- Demo compositions may import several public entry points.
- React and React DOM remain runtime peers. The repository develops against React 18, verifies React 19 in a packed
  consumer fixture, and tests Preact through `preact/compat` aliases.
- Framework runtimes remain external to generated feature bundles. Infinite Calendar owns its mathematical virtualization and has no external virtualizer dependency.

## Named function boundaries

Production functions take one named object, including private helpers and commands; zero-argument functions remain
unchanged. Existing object requests are passed directly. Native React/DOM events, refs, state setters, array iteration,
promises, and subscription callbacks keep their required signatures through explicit types and boundary adapters.

Date Parser owns its implementation and types, and Date Input consumes it internally. Shared date primitives remain
in the headless layer; picker actions live with Datepicker. Shared runtime helpers have one public home at the root.
Parser internals and input formatting types do not leak through the parser public facade. Timeline local-date helpers
remain distinct from timezone-free arithmetic. Horizontal/vertical projections share event preparation and one viewport engine; its committed revision owns geometry and scheduling.

`check:architecture` verifies object signatures and dependency direction as well as module and function size limits.

## Main-thread responsiveness

The package applies frame-bounded work at input-rate boundaries: timeline pointer previews, Datepicker captured-pointer
painting, quick-jump scrolling, and zoom consume only the latest useful value before a paint. Release and commit paths
stay synchronous. React transitions defer Date Input recognition decoration, while
stable immutable buckets, prepared layers, grids, formatter configuration, and parser vocabulary eliminate repeated
work before scheduling is needed.

Two-axis virtualization, a 120-date event cache, memoized external event content, compositor-friendly transform/opacity
motion, and native sticky/overflow behavior were already present. The remaining work is bounded and coupled to DOM
geometry, so workers, offscreen observers, broad layer promotion, FLIP layout animation, and a custom priority queue are
not architectural dependencies.

## Packaging

Every JavaScript entry emits ESM, CommonJS, and declarations without accessing `document` during import. UI stylesheets
are optional, independent, component-scoped, and readable rather than minified in `dist`. The demo is a separate Vite
application and is not part of the installed runtime.

For Infinite Calendar's runtime ownership, virtualization, async loading, rendering, and interaction architecture, see
[its dedicated architecture guide](../infinite-calendar/architecture.md).

Timepicker stores a standalone `HH:mm` clock or null, with controlled/uncontrolled ownership and `onChange({ value })`. Its scoped optional stylesheet is independent of Datepicker. Both controls share slot generation and selected-slot reveal; Datepicker owns its date/time view handoff. See [QUNO-017](./decisions.md#quno-017---add-an-independent-timepicker-and-reuse-its-slot-renderer).

The shared time-slot renderer chooses columns by cadence; twenty-minute slots extend the headless `MinuteCadence` contract consumed by Datepicker, Timepicker, and optional forced Date Input validation. See [QUNO-018](./decisions.md#quno-018---size-time-rows-by-minute-cadence).

Omitted or empty enabled-hour lists enable all 24 hours in slot generation and forced clock validation, so Datepicker, Timepicker, and Date Input agree on defaults.

The showcase HTTP boundary belongs to the demo: `demo/server` generates deterministic fixtures for requested dates
and resources; local Vite and the deployed Web endpoint share one query handler. Browser session overrides retain
edits without making fixtures or API transport a dependency of any package entry point. See Infinite Calendar
[Decision 111](../infinite-calendar/decisions.md#111---query-demo-event-ranges-on-the-server).

`build:demo` and the function's `vercel-build` hook bundle the server query service into `build/demo-api/events.js`. The deployed handler reaches
that server-only bundle through a native private package import; Vite and TypeScript resolve the same name to its
source during development. This avoids relying on development aliases in Vercel's emitted Node function. The server
bundle is excluded from the published calendar package and the browser's `dist-demo` assets. Atomic publication
allows the site and function build steps to run concurrently.

The `demo/concept` homepage composes public product entry points with demo-owned fixtures and DOM
interaction playback. Product manifests order the 23 scene JSON files; `demo.json` owns startup order and shared
fixture context. Product manifests may provide a short tabLabel for top navigation independently of their full
label and introduction copy. Validation checks IDs, labels, references, initial values and typed actions. Date Input derives its reference
from today rather than the fixed fixture context; Date Parser keeps its inspectable reference date.

`ConceptTour` composes the stable `ConceptCanvas` and `FloatingGuide`, whose header groups fullscreen and chevron, for every
product. `DemoContents` and `DemoNavigation` include a presentation introduction before manifest chapters; Calendar's
introduction lives in `calendarIntroduction.json`, Datepicker’s in `datepickerIntroduction.json`, and others use product metadata. The footer sits outside the guide's
scrollable text body and disappears on collapse. No title rail, section scroller, playback toolbar or inert mobile
preview remains. `useDemoPresentation` owns fullscreen/focus restoration without remounting the live component.

`useFloatingGuide` stores left/bottom offsets, bounds frame-limited captured pointer dragging, handles keyboard
positioning, and measures guide height for the mobile Calendar control dock. Resizing text grows upward from the same
bottom edge. CSS places other products right of the explanation on desktop. Mobile product stages fill the canvas,
top aligned with fixed padding, and the drawer overlays them. The `--concept-guide-height` measurement is consumed
only by the floating Calendar dock clearance; it never sizes or repositions non-calendar stages.
`useGuideDrawer` owns mobile header pointer capture, swipe thresholds/cancellation and reduced-motion-aware height
animation. Mobile CSS attaches the guide to the bottom edge; desktop positioning stays in `useFloatingGuide` and is
retained across breakpoint changes. Body scrolling stays native. Calendar controls clear the measured mobile drawer
height and sit at bottom right on desktop. Fullscreen focus remains owned by `useDemoPresentation`.

`usePlayback` repeats only the selected scene under one AbortController. Deliberate trusted pointerdown, wheel,
keyboard, focus and tab visibility cancel pending actions; synthetic synchronous focus is marked internal. Hover
alone never cancels playback. The demo-owned playbackTakeover filter excludes mobile header/chevron pointer input,
its associated focus and Enter/Space disclosure. The same actor keeps running; paused scenes stay paused. Contents,
fullscreen, working controls and desktop guide interaction retain takeover. The actor uses public component controls
and browser hit testing, not library internals.
Day-cell clicks commit on pointerup, so playback does not dispatch an additional keyboard-style click afterward.
`ConceptProducts` resets only its active lazy product mount on the scoped loop event. Datepicker’s authored
continuous loops skip that event and retain the same picker. Its synthetic day-hover marker mirrors preview chrome
in demo-owned CSS because untrusted events cannot set native `:hover`. Calendar stays mounted and
restores a session checkpoint only when needed; naturally closed sequences use `loop: "continue"`.

Motion uses cancellable animation frames, integer cumulative scroll deltas and real controlled slider input.
The scroll-to action defaults to centering; optional start alignment lets Calendar return to a measured day header
before locating its virtualized participant/event.
Datepicker’s `scroll-year` action uses measured year height and the loaded year span to animate to an offscreen
virtual year. Step checks live in `scenarioStepChecks`, separate from document/product validation. The
rounded 15° cursor never intercepts input or renders captions. `playbackSurface` temporarily excludes the guide
only during synchronous synthetic hit testing; real input still operates it normally. Hover uses unpressed pointer
frames through topmost hit targets and closes before other actions, including the overlap chapter's closed hold.

Calendar's demo zoom hook observes viewport dimensions and shares the responsive public labelWidth with the
calendar settings and zoom floor: 30% horizontally on mobile, 238 px otherwise. Mobile label typography remains in
demo CSS; vertical time-pane geometry retains its existing width.

Calendar retains one cached fixture source and session edits across chapters, projecting density through
`projectEvents`. Draft focus changes displayed doctors while all IDs remain in load coverage; public viewport anchors
retain the edited slot. Demo-owned CSS presents drafted/dragged cards and saved glints; public draft release supplies
Cancel fading. Timepicker minute typography changes are scoped to `/concept`. No shipped runtime boundaries change.

Timepicker owns the shared private time-option renderer and selection-reveal hook. Initial mounting reveals the
selected hour; later updates use minimal reveal only for offscreen options and normalized hour-list dependencies.

Concept appearance is demo-owned: useSystemTheme listens for OS changes, while scoped CSS keeps explainers and
non-calendar controls light. Calendar resolves system scene defaults separately from explicit palettes. Its private
useCalendarZoom observes viewport width and shares settings with the renderer; it imports no private library modules.

Infinite Calendar can bound its scroll extent with optional settings.dateWindowRadius; the concept and guide scroll
exhibits use seven included dates per side while the library default remains month-based. The demo fixture source
retains full density choices separately from the calendar’s 22-event persistent baseline, preventing unprojected
cached packed days from changing ordinary offscreen geometry. Embedded guide exhibits opt out of the concept shell’s
grid rows and mobile preview control hiding.

The demo application owns URL navigation and the concept homepage at `/`. `demo/guide` contains lazily loaded
current `/docs/*` field guides; `demo/archive` holds an independent editorial source snapshot for `/docs/archive/*`.
Both consume public entry points. Neither URL state nor archive code is shipped in the package.

Concept navigation stores product/chapter identity in path segments. `/` is the Calendar introduction;
`/calendar/zoom` and `/datepicker/paint` are examples of chapter routes. The existing catch-all server rewrite
serves the entry document; App and the concept navigation hook resolve the path without remounting the active
canvas during tab/chapter navigation. Legacy query links normalize to paths. Documentation loading uses a silent
light placeholder; archive access is by direct route rather than current navigation.
