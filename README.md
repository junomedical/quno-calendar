# @quno/calendar

Four opinionated date and scheduling primitives in one React-authored package. Version `0.6.0` supports React 18+
directly, verifies React 19 separately, and supports Preact through tested `preact/compat` aliases.

## Install

```sh
npm install @quno/calendar react react-dom
```

Import only the primitive and optional stylesheet you use:

```tsx
import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";

import { QunoDatePicker } from "@quno/calendar/datepicker";
import "@quno/calendar/datepicker/styles.css";

import { QunoDateInput } from "@quno/calendar/date-input";
import "@quno/calendar/date-input/styles.css";

import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
```

- **Quno/Infinite Calendar** virtualizes horizontal and vertical schedules with event loading, rendering, editing, zoom, navigation, and focus.
- **Quno/Datepicker** paints, resizes, and moves one timezone-free date or inclusive range.
- **Quno/Date Input** provides a native controlled or uncontrolled field for typed dates and ranges.
- **Quno/Date Parser** recognizes formats, relative phrases, configurable weeks, ranges, and multilingual vocabulary without a UI runtime.

The headless `@quno/calendar` root exports shared contracts such as `IsoDate`, `DateRange`, `DateSelectionMode`, `WeekStart`, and safe calendar-day helpers. It exports no UI. JavaScript entry points are ESM/CommonJS compatible, SSR-safe, and never inject CSS. The separately exported stylesheets remain readable, unminified CSS in `dist`.

Library functions and customization callbacks receive named objects: `addDays({ date, amount })`,
`parseDateInput({ text, expectedRange })`, and `onChange({ value })`. Text overrides use `formatters`; presentation
uses `getDayProps`, `getDayCellProps`, and `getHourProps` where supported. See the
[breaking migration](./docs/shared/migration.md#unreleased-named-contracts-and-product-ownership).

Calendar day keys use timezone-free `YYYY-MM-DD` values. Infinite Calendar event `start` and `end` remain timestamp strings with their local or offset semantics.

High-frequency pointer, zoom, and quick-navigation work is frame-bounded while release and commit paths stay
synchronous. Infinite Calendar prepares appointment and availability collision lanes independently, reuses unchanged
date buckets, and grows each resource to the deeper layer. Date Input reuses compiled parser configuration across
keystrokes without changing the synchronous headless parser API.

## Guides and records

Run `npm run dev` and open `/` for the four-product overview, its shared guiding principles, and creator attribution.
Each card links to a dedicated field guide and focused demo:

- `/guide/infinite-calendar`
- `/guide/datepicker`
- `/guide/date-input`
- `/guide/date-parser`

Start with the [documentation index](./docs/README.md). Shared records cover [usage](./docs/shared/usage.md),
[migration](./docs/shared/migration.md), [architecture](./docs/shared/architecture.md),
[taxonomy](./docs/shared/taxonomy.md), [testing](./docs/shared/testing.md), and
[cross-product decisions](./docs/shared/decisions.md). Each product directory owns its own overview and decision log.
Release history remains in the [changelog](./CHANGELOG.md).

## Development

```sh
npm test
npm run typecheck
npm run lint
npm run check:architecture
npm run build
npm run verify:package
npm run test:compat
npm run test:compat:react19
```

Release preparation is local only. Publishing, deprecating old packages, and deleting archival repositories require separate authorization.

Infinite Calendar supports an explicit IANA display timezone through `settings.timeZone`; see the [timezone recipe](./docs/shared/usage.md#explicit-display-timezone).

Clicking events with hidden seconds opens them without rounding their saved timestamps. The timezone demo shows minute-only labels alongside the precise source interval.

DST pointer policy: event moves preserve elapsed duration at minute precision. Drawn endpoints and move starts reject both nonexistent spring-forward times and ambiguous repeated autumn times. An invalid drawn endpoint cancels the gesture, so the last valid interval cannot be submitted; start a new selection at a valid time. No browser-zone or tenant-specific policy is introduced.
