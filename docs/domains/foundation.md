# Foundation Domain

## Responsibility

Own the public package facade and pure cross-domain primitives: public types, calendar root selection, date normalization, time conversion, tick generation, and public event membership operations.

```mermaid
flowchart LR
  Facade["Package facade"] --> Root["QunoCalendar"]
  Facade --> Types["Public types"]
  Date["Date primitives"] --> Runtime["Runtime domains"]
  Time["Time primitives"] --> Runtime
  Membership["Public event operations"] --> Runtime
```

## Source Map

| Source file                                                                                    | Responsibility                                                                         |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`index.ts`](../../src/lib/index.ts)                                                           | Defines the supported package exports and public compatibility boundary.               |
| [`QunoCalendar.tsx`](../../src/lib/timeline/core/QunoCalendar.tsx)                             | Selects horizontal or vertical projection from public props.                           |
| [`internalTypes.ts`](../../src/lib/timeline/core/internalTypes.ts)                             | Separates view handles and focused-instance state from the public contract.            |
| [`types.ts`](../../src/lib/timeline/core/types.ts)                                             | Defines the public API, events, settings, renderers, navigation, and anchor contracts. |
| [`useCalendarFocusCoordinator.ts`](../../src/lib/timeline/core/useCalendarFocusCoordinator.ts) | Coordinates focus, participant reveal, cancellation, and highlight state.              |
| [`useCalendarFocusEffects.ts`](../../src/lib/timeline/core/useCalendarFocusEffects.ts)         | Settles focus requests and owns transient cancellation/highlight effects.              |
| [`calendarEvents.ts`](../../src/lib/timeline/data/calendarEvents.ts)                           | Implements exported event membership and immutable move helpers.                       |
| [`eventPrefetch.ts`](../../src/lib/timeline/data/eventPrefetch.ts)                             | Defines the exported default event-prefetch policy.                                    |
| [`dateLabels.ts`](../../src/lib/timeline/date/dateLabels.ts)                                   | Formats localized calendar date labels.                                                |
| [`dateVirtualization.ts`](../../src/lib/timeline/date/dateVirtualization.ts)                   | Normalizes excluded dates and maps virtual offsets to date keys.                       |
| [`localDate.ts`](../../src/lib/timeline/date/localDate.ts)                                     | Parses and formats local dates without UTC drift.                                      |
| [`time.ts`](../../src/lib/timeline/time/time.ts)                                               | Converts minutes, pixels, clock strings, and ISO timestamps.                           |
| [`timelineTicks.ts`](../../src/lib/timeline/time/timelineTicks.ts)                             | Defines shared time-grid cadence, adaptive labels, and timeline gutter geometry.       |

## Verification Map

- Unit: public event helpers, local date behavior, virtualization math, and time conversions.
- Package: TypeScript declarations, ESM, CommonJS, SSR, stylesheet export, and isolated consumer build.
