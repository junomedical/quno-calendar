# Branch: `feat/internal-calendar-core`

1. Represent internal scheduling events without coupling entity type to presentation layer.
   Why: appointments, availabilities, and blockers must share the calendar editor while consumers may still opt to paint availability behind other events.
   1.1. Export typed event and rule kinds; make `renderLayer: "availability"` the explicit background-layer opt-in.
   1.2. Keep foreground availabilities in overlap metrics and interaction handling, and let a no-op drag activate the event editor.
   Files: `src/lib/timeline/core/`, `src/lib/timeline/infinite/events/`, `src/lib/timeline/infinite/interactions/`, `src/lib/timeline/infinite/rendering/`, `src/lib/timeline/index.ts`, and focused unit tests.
   Docs: `docs/infinite-calendar/README.md`, `architecture.md`, `decisions.md`, the layout and interaction flow guides,
   `docs/shared/taxonomy.md`, `docs/shared/migration.md`, and `CHANGELOG.md` describe the foreground default,
   background opt-in, and legacy event-kind mapping.

2. Reveal a known resource row through the public calendar navigation handle.
   Why: the onboarding editor needs to reach offscreen or virtualized rows without querying private timeline DOM.
   2.1. `scrollToDateTime({ date, time, calendarId })` scrolls an offscreen horizontal row into view while preserving an already-visible row.
   2.2. The guide and browser test exercise the public handle.
   Files: `src/lib/timeline/core/QunoInfiniteCalendar.tsx`, `src/lib/timeline/infinite/anchors/`, `src/lib/timeline/infinite/views/horizontal/useHorizontalNavigation.ts`, `demo/guide/timeline/`, `e2e/specs/examples.spec.ts`, and Infinite Calendar docs.

3. Resolve existing package subpath declarations for the onboarding TypeScript configuration.
   Why: the consumer should use the package's real declarations without ambient shims.
   3.1. Map the four existing public subpaths through `typesVersions`; do not include the separate booking-picker work.
   Files: `package.json`, `README.md`, `docs/README.md`, `docs/shared/usage.md`, `docs/shared/decisions.md`, and `CHANGELOG.md`.

4. Merge `origin/main` while preserving its named-object contracts and independent collision-lane pipeline.
   Why: the calendar feature should extend the current library contract rather than retain positional overloads or discard upstream performance work.
   4.1. Foreground events and explicitly background-layered availability are prepared separately; row/column sizing uses their maximum depth.
   4.2. Keep the unrelated booking-picker and Datepicker changes in the named stash; do not include them in the merge.
   4.3. Renumber this branch's decisions to Infinite Calendar 092/093 and shared QUNO-014 to preserve upstream 091 and QUNO-012/013.
