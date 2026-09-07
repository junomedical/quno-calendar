# Shared package architecture

`@quno/calendar` contains four independently importable products authored in React. Consumers pay only for the entry
points and optional stylesheets they import.

## Public surfaces

| Entry point                        | Responsibility                                            | Runtime UI | Stylesheet   |
| ---------------------------------- | --------------------------------------------------------- | ---------- | ------------ |
| `@quno/calendar`                   | Timezone-free day contracts and safe calendar-day helpers | No         | No           |
| `@quno/calendar/infinite-calendar` | Virtualized schedules and timestamped events              | React      | `styles.css` |
| `@quno/calendar/datepicker`        | Direct manipulation of one day or an inclusive range      | React      | `styles.css` |
| `@quno/calendar/date-input`        | Controlled or uncontrolled typed date and range input     | React      | `styles.css` |
| `@quno/calendar/date-parser`       | Headless recognition and tokenization                     | No         | No           |

The root exports no UI. Date Input may consume parser implementation internally but does not re-export the parser's
public API. Datepicker and Infinite Calendar compose only through consumer-owned state and public handles.

## Date models

Shared `IsoDate` values represent timezone-free `YYYY-MM-DD` calendar days. Datepicker, Date Input, and Date Parser use
that model throughout. Infinite Calendar uses `IsoDate` for day keys, navigation, and loader boundaries, while event
`start` and `end` values remain local or offset-aware timestamp strings. Never apply timezone-free day arithmetic to
event timestamps.

## Dependency direction

- Product entry points may import the shared headless layer.
- Date Input may import the internal parser responsibility domain.
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

## Packaging

Every JavaScript entry emits ESM, CommonJS, and declarations without accessing `document` during import. UI stylesheets
are optional, independent, component-scoped, and readable rather than minified in `dist`. The demo is a separate Vite
application and is not part of the installed runtime.

For Infinite Calendar's runtime ownership, virtualization, async loading, rendering, and interaction architecture, see
[its dedicated architecture guide](../infinite-calendar/architecture.md).
