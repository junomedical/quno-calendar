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
- React and React DOM remain runtime peers. Preact support uses tested `preact/compat` aliases.
- Framework runtimes and `@tanstack/react-virtual` remain external to generated feature bundles.

## Packaging

Every JavaScript entry emits ESM, CommonJS, and declarations without accessing `document` during import. UI stylesheets
are optional, independent, component-scoped, and readable rather than minified in `dist`. The demo is a separate Vite
application and is not part of the installed runtime.

For Infinite Calendar's runtime ownership, virtualization, async loading, rendering, and interaction architecture, see
[its dedicated architecture guide](../infinite-calendar/architecture.md).
