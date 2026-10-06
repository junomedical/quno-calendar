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

Date Parser optionally returns a separate `DateInputTimeRange` of timezone-free `HH:mm` clocks. An omitted endpoint
time is `null`; dates remain `IsoDate`. Overnight inference uses calendar-day arithmetic, without producing event
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
- Framework runtimes and `@tanstack/react-virtual` remain external to generated feature bundles.

## Named function boundaries

Production functions take one named object, including private helpers and commands; zero-argument functions remain
unchanged. Existing object requests are passed directly. Native React/DOM events, refs, state setters, array iteration,
promises, and virtualizer callbacks keep their required signatures through explicit types and boundary adapters.

Date Parser owns its implementation and types, and Date Input consumes it internally. Shared date primitives remain
in the headless layer; picker actions live with Datepicker. Shared runtime helpers have one public home at the root.
Parser internals and input formatting types do not leak through the parser public facade. Timeline local-date helpers
remain distinct from timezone-free arithmetic. Horizontal/vertical projections continue to share event preparation
while retaining their own geometry and scheduling.

`check:architecture` verifies object signatures and dependency direction as well as module and function size limits.

## Main-thread responsiveness

The package applies frame-bounded work at input-rate boundaries: timeline pointer previews, Datepicker captured-pointer
painting, quick-jump scrolling, and zoom consume only the latest useful value before a paint. Release and commit paths
stay synchronous. React transitions defer non-urgent cache publication and Date Input recognition decoration, while
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
