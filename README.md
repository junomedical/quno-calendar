# @quno/calendar

Five opinionated date and scheduling primitives in one React-authored package. Version `0.6.3` supports React 18+
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

import { QunoTimePicker } from "@quno/calendar/timepicker";
import "@quno/calendar/timepicker/styles.css";

import { QunoDateInput } from "@quno/calendar/date-input";
import "@quno/calendar/date-input/styles.css";

import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
```

- **Quno/Infinite Calendar** virtualizes horizontal and vertical schedules with event loading, rendering, editing, zoom, navigation, focus, and an optional consumer-owned loading fallback.
  Its handle exposes visible date keys for contextual creation and optional centered horizontal resource navigation.
  Optional synchronous `projectEvents` displays local previews after caching without refetching persisted events.
  Resource-row navigation and anchor restoration wait for committed parent layout; ordinary state updates need no forced React commit.
  Captured event anchors retain their participant identity, and explicit row centering follows async collision sizing.
  Horizontal participant edits retain measured day heights; idle recentering waits while an explicit anchor restore owns the viewport.
  Date-only anchors preserve the displayed day through editor completion without moving horizontal time/resource scrolling.
  Event loading uses settled viewport dates independently of rendering overscan. Optional `loadCalendarIds` keeps
  read coverage stable when consumers hide rows; it defaults to the displayed selection.
  Prefetch distance defaults to one screen on each side, with at least one adjacent day per enabled side, and is configurable through `eventPrefetchPolicy`.
  Both zoom orientations commit time geometry, virtual windows and their wheel anchor before paint.
  Time labels and grid cadence switch immediately at their readable zoom thresholds.
  Alternating resource shading stays consistent as rows enter or leave the viewport.

  Horizontal editor transitions coordinate measured dates, anchor correction and visible rows before paint, keeping drawn rows steady through opening and cancellation.
  The demo anchors horizontal editor opening and cancellation to the resource row, keeping the grid steady through card hover expansion. Active horizontal restores keep their target date mounted through participant changes.
  Saving after scrolling away returns the draft's participant row to its retained anchor position.
  Demo event requests send date/resource queries; server fixtures respect every participant's working hours, while session edits survive refetches.

- **Quno/Datepicker** paints, resizes, and moves one timezone-free date or inclusive range, with optional single-day time selection; endpoint shortcuts keep composed input popups open while navigating.
- **Quno/Date Input** provides a native controlled or uncontrolled field for typed dates, ranges, and optional single-day clock times.
- **Quno/Timepicker** selects a standalone clock with prominent sticky hours, enabled-hour choices, regular-weight minutes, and cadence-sized minute rows, including six choices per five-minute row and 20-minute steps. Omitted or empty enabled hours allows all 24 hours.
- **Quno/Date Parser** recognizes formats, relative phrases, configurable weeks, ranges, optional clock times, and multilingual vocabulary without a UI runtime. Its `start` and `end` endpoints each contain a timezone-free `date` and a `time` clock, or `null` when no clock was supplied.

The headless `@quno/calendar` root exports shared contracts such as `IsoDate`, `DateRange`, `DateSelectionMode`, `WeekStart`, and safe calendar-day helpers. It exports no UI. JavaScript entry points are ESM/CommonJS compatible, SSR-safe, and never inject CSS. The separately exported stylesheets remain readable, unminified CSS in `dist`.

Type declarations for the public subpaths resolve through package `exports` in modern TypeScript projects and through `typesVersions` in projects still using Node-style module resolution. Consumers do not need ambient module declarations or TypeScript path aliases.

Library functions and customization callbacks receive named objects: `addDays({ date, amount })`,
`parseDateInput({ text, expectedRange })`, and `onChange({ value })`. Text overrides use `formatters`; presentation
uses `getDayProps`, `getDayCellProps`, and `getHourProps` where supported. See the
[breaking migration](./docs/shared/migration.md#unreleased-named-contracts-and-product-ownership).

Calendar day keys use timezone-free `YYYY-MM-DD` values. Infinite Calendar event `start` and `end` remain timestamp strings with their local or offset semantics.

High-frequency pointer, zoom, and quick-navigation work is frame-bounded while release and commit paths stay
synchronous. Infinite Calendar prepares foreground events and explicitly background-layered availability in independent
collision lanes, reuses unchanged date buckets, and grows each resource to the deeper layer. Date Input reuses compiled parser configuration across
keystrokes without changing the synchronous headless parser API.

## Guides and records

Run `npm run dev` and open `/` for the five-product overview, its shared guiding principles, and creator attribution.
Each card links to a dedicated field guide and focused demo. `/demo/date-time` composes the single-day input and picker with enabled hours and minute cadence. Try `6 oct 2pm` to recognize a date without a year and a clock. Selecting a day opens time selection automatically. Its title shows the selected full date, and its arrows move through enabled days. Clicking the date title returns to day selection. Typed clocks stay unrestricted unless Date Input’s `forceCadence` is enabled:

- `/guide/infinite-calendar`
- `/guide/datepicker`
- `/guide/date-input`
- `/guide/date-parser`
- `/guide/timepicker`

Start with the [documentation index](./docs/README.md). Shared records cover [usage](./docs/shared/usage.md),
[migration](./docs/shared/migration.md), [architecture](./docs/shared/architecture.md),
[taxonomy](./docs/shared/taxonomy.md), [testing](./docs/shared/testing.md), and
[cross-product decisions](./docs/shared/decisions.md). Each product directory owns its own overview and decision log.
Release history remains in the [changelog](./CHANGELOG.md).

The Infinite Calendar preloading chapter demonstrates cached navigation in both directions and keeps its loading
status active until all concurrent reads finish.

## Development

```sh
npm test
npm run typecheck
npm run lint
npm run check:architecture
npm run build
npm run verify:package
npm run check:bundle-size
npm run test:compat
npm run test:compat:react19
```

Release preparation is local only. Publishing, deprecating old packages, and deleting archival repositories require separate authorization.

Infinite Calendar uses one mathematical viewport engine for both orientations, with stable semantic anchors and
bounded date/resource windows. Native movement within an unchanged rendered window avoids React updates, while zoom
reuses stable resource layout. See its [runtime architecture](docs/infinite-calendar/architecture.md).

With Infinite Calendar zoom enabled, wheel samples with Shift held stay reserved for zoom at both limits.

Shift-wheel zoom accumulates 0.20 per nonzero sample and waits for each accepted DOM/scroll commit before issuing the next request.

Wheel input follows the current Shift state immediately: hold Shift to zoom, release it to scroll. Remaining touchpad momentum may switch modes; there is no gesture-lock delay.

The isolated `/concept` playground presents all five products in a live full-window canvas with a draggable,
collapsible guide. The contextual contents button opens the contents; previous/next navigation stays inside the guide. Chapters autoplay
and loop unless reduced motion is enabled, and deliberate interaction pauses playback. The guide starts 24 px from
the bottom left on desktop. On mobile it becomes a bottom drawer: tap its chevron or swipe its header down to collapse,
and swipe up or tap to expand. Fullscreen sits beside the chevron in both layouts.
Mobile Calendar names use 30% of the viewport, with smaller name/date text. Other products sit to the right of the
explanation on wide screens; on phones, the drawer overlays their full-height canvas without reserving space. Datepicker has seven
chapters with first-person explanations, including an 8840 ms scroll to 22 July 1980; Date Input explains format
guessing, opens its composed picker on focus and demonstrates natural typing
with four varied examples and a readable pause before Enter, plus repeated day/month keyboard edits.
See [concept notes](./demo/concept/README.md) for JSON authoring, choreography and verification.

Timepicker’s concept chapters also show date-and-time selection inside Datepicker. The parser workbench exposes
live token chips and resolved endpoints beneath the phrase, with chapter configuration kept in JSON.

The concept’s **Parser** tab introduces tokenization and date interpretation under **Date parser**, with
`12/01 10:00` already resolved. Its phrase chapter demonstrates six varied inputs; Resolve ambiguity interprets `10-11-12`, `01/02` and `feb 11 80`.

Time choices keep a visible selected minute under the pointer instead of scrolling its hour to the top. Initial
opening and external offscreen selections retain automatic reveal.

Concept backgrounds follow the computer's light/dark preference, while explainers and non-calendar controls stay
light on bright panels. Calendar defaults follow the system palette, and demo zoom limits track its viewport.
