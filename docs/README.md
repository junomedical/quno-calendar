# Documentation

The documentation follows the five public `@quno/calendar` products. Start with the product you are changing, then
use the shared records for package-wide contracts and release work.

Focused input/picker compositions keep Start and End shortcut navigation inside the popup. See the
[composition recipe](./shared/usage.md#qunodate-input) and
[focus contract](./shared/decisions.md#quno-014---retain-focus-through-composed-endpoint-navigation).

| Product                | Public entry point                 | Documentation                                      | Live field guide           |
| ---------------------- | ---------------------------------- | -------------------------------------------------- | -------------------------- |
| Quno/Infinite Calendar | `@quno/calendar/infinite-calendar` | [Infinite Calendar](./infinite-calendar/README.md) | `/guide/infinite-calendar` |
| Quno/Datepicker        | `@quno/calendar/datepicker`        | [Datepicker](./datepicker/README.md)               | `/guide/datepicker`        |
| Quno/Date Input        | `@quno/calendar/date-input`        | [Date Input](./date-input/README.md)               | `/guide/date-input`        |
| Quno/Timepicker        | `@quno/calendar/timepicker`        | [Timepicker](./timepicker/README.md)               | `/guide/timepicker`        |
| Quno/Date Parser       | `@quno/calendar/date-parser`       | [Date Parser](./date-parser/README.md)             | `/guide/date-parser`       |

The [named-contract migration](./shared/migration.md#unreleased-named-contracts-and-product-ownership) maps the
current breaking API cleanup. Product decision records preserve the historical signatures they supersede.
For creation defaults and centered row navigation, see Infinite Calendar Decision 094 and the shared usage recipes.
Consumer-owned initial skeletons are covered by Infinite Calendar Decision 095 and the async-loading flow.
Resource-row navigation and anchor restoration after normal parent state updates are covered by
[Decision 097](./infinite-calendar/decisions.md#097---navigation-and-restoration-wait-for-committed-layout).

Local preview projection after the event cache is covered by Infinite Calendar Decision 098 and the shared usage recipe.
[Decision 101](./infinite-calendar/decisions.md#101---preserve-loading-cache-and-navigation-contracts-through-follow-up-actions)
clarifies accepted moves, loading dimensions, and navigation precedence;
[Decision 102](./infinite-calendar/decisions.md#102---retain-participant-identity-in-event-anchors)
keeps multi-participant editing anchored to a surviving visible instance.
[Decision 103](./infinite-calendar/decisions.md#103---preserve-measured-draft-layout-and-defer-idle-recenter)
preserves dense editor transitions and gives explicit restores priority over idle recentering.
[Decision 104](./infinite-calendar/decisions.md#104---anchor-horizontal-demo-editor-transitions-to-resource-slots)
keeps horizontal demo rows steady through editor opening, cancellation, and subsequent hover.
[Decision 105](./infinite-calendar/decisions.md#105---retain-horizontal-restore-dates-through-resource-changes)
keeps the restore date mounted when participant changes resize the date window.
[Decision 108](./infinite-calendar/decisions.md#108---alternate-horizontal-surfaces-by-logical-resource-position)
keeps alternating resource shading stable as horizontal rows are virtualized.
[Decision 109](./infinite-calendar/decisions.md#109---restore-offscreen-saves-to-the-retained-editor-anchor)
returns offscreen demo saves to the retained participant row and date.

[Decision 110](./infinite-calendar/decisions.md#110---coordinate-editor-restoration-and-virtual-projection-before-paint)
coordinates horizontal editor measurements, restoration and virtual windows so drawing and Cancel never paint an intermediate position.

[Decision 111](./infinite-calendar/decisions.md#111---query-demo-event-ranges-on-the-server)
moves showcase fixture generation and date/resource filtering to the HTTP endpoint. The
[copyable request](./shared/usage.md#demo-range-query-endpoint) includes dates, calendars and dataset size.

[Decision 128](./infinite-calendar/decisions.md#128---demonstrate-concurrent-loading-and-verify-visible-stability)
keeps the preloading guide's status accurate across concurrent reads and verifies stability through visible date/card geometry.

[Decision 129](./infinite-calendar/decisions.md#129---configure-prefetch-distance-in-screens)
defines screen-based prefetch distance, its live guide control, and compatibility with explicit day-based policies.
[Decision 130](./infinite-calendar/decisions.md#130---keep-an-adjacent-day-warm-for-every-enabled-screen-buffer)
adds a one-included-day minimum per enabled side, including when only a fraction of a dense day is visible.

The current responsiveness work is recorded in
[QUNO-013](./shared/decisions.md#quno-013---bound-high-frequency-work-to-display-frames), with Infinite Calendar's
multilane background availability geometry in [Decision 091](./infinite-calendar/decisions.md#091---availability-has-independent-collision-lanes),
refined by the explicit background opt-in in [Decision 093](./infinite-calendar/decisions.md#093---event-entity-kind-is-separate-from-its-render-layer).

The [single-day date-time recipe](./shared/usage.md#single-day-date-and-time) connects Date Input and Datepicker
through a separate `HH:mm` clock. Picker cadence/hours constrain typing only when Date Input enables `forceCadence`. Choosing a day opens time selection automatically, with no footer time control. The selector title displays the selected full date; its arrows skip disabled days while keeping time navigation open. Click the date title to return to day selection. Try `/demo/date-time`, or the Datepicker and Date Input guides’ date-time chapters.

Timepicker and Datepicker use [cadence-specific row sizes](./timepicker/README.md#value-and-settings), including six choices per five-minute row and 20-minute slots. Omitted or empty enabled hours enables all 24 hours in both selectors and forced input validation.
Both time selectors emphasize sticky hour headings with larger, bold text above the minute-number hierarchy.
Standalone Timepicker minute options use regular weight (400); see [QTP-002](./timepicker/decisions.md#qtp-002---use-regular-weight-minute-options).

Date Parser returns paired `start`/`end` objects with `{ date, time }`; missing clocks are `null`.
See the [endpoint migration](./shared/migration.md#unreleased-paired-parser-endpoints) for the breaking replacement of `value` and `times`.
It can opt into traditional clock times and overnight ranges with `recognizeTime: true`.
Single dates without a year, such as `6 oct 2pm`, use the same year ranking as date-only input.
See [optional clock recognition](./date-parser/README.md#optional-clock-recognition) and its live guide chapter.

The Infinite Calendar JavaScript gzip ceiling is 50 KiB; see
[Decision 094](./infinite-calendar/decisions.md#094---allow-50-kib-for-infinite-calendar-javascript).
Date Parser has a 7 KiB gzip ceiling; see
[QDPR-006](./date-parser/decisions.md#qdpr-006---leave-headroom-in-the-parser-bundle-budget).

[Decision 112](./infinite-calendar/decisions.md#112---restore-horizontal-wheel-anchors-in-the-zoom-layout-commit)
keeps horizontal wheel time geometry and scroll correction in the same layout commit.

[Decision 113](./infinite-calendar/decisions.md#113---commit-vertical-zoom-geometry-and-focus-before-paint)
extends committed zoom correction to vertical date/time anchors and uniform date/resource windows.

[Decision 116](./infinite-calendar/decisions.md#116---remove-zoom-detail-transparency)
restores immediate time-label and grid-cadence changes without transparency effects.

## Shared package records

- [Architecture](./shared/architecture.md) defines public surfaces, dependency direction, framework compatibility,
  date models, and packaging boundaries.
- [Usage](./shared/usage.md) owns copyable recipes and cross-product composition.
- [Migration](./shared/migration.md) maps former package names and APIs to `0.6.0`.
- [Taxonomy](./shared/taxonomy.md) defines vocabulary used across source, guides, and tests.
- [Testing](./shared/testing.md) owns the combined verification strategy and feature budgets.
- [Shared decisions](./shared/decisions.md) records choices affecting more than one product.

The package manifest provides both modern `exports` types and legacy Node-style `typesVersions` mappings for these public entry points.

Each product owns its own `decisions.md`. Historical identifiers remain stable even when an older decision predates
the four-product documentation structure. `CHANGELOG.md` remains at the repository root because releases apply to the
combined package.

- [Infinite Calendar rewrite milestones and verification](./infinite-calendar/runtime-rewrite.md)
- [Infinite Calendar production before/after timing](./infinite-calendar/performance-comparison.md)

[Decision 117](./infinite-calendar/decisions.md#117---separate-stable-layout-from-viewport-presentation) records
viewport presentation subscriptions, reusable geometry and native observation ordering.

[Decision 118](./infinite-calendar/decisions.md#118---capture-shift-input-even-when-zoom-cannot-change) keeps Shift input captured at zoom limits and preserves ordinary scrolling after the momentum tail.

[Decision 121](./infinite-calendar/decisions.md#121---pace-wheel-requests-after-dom-and-scroll-commit) records commit-aware zoom pacing and the retained native-scroll lock.

[Decision 122](./infinite-calendar/decisions.md#122---use-an-intermediate-shift-wheel-zoom-step) sets the current Shift-wheel step to 0.20.

[Decision 124](./infinite-calendar/decisions.md#124---follow-the-current-shift-state-immediately) replaces Decision 123’s gesture lock with immediate current-Shift behavior, accepting momentum switching modes.

## Concept playground

`/concept` presents all five products with the same live canvas and floating guide. The guide contains an introduction,
All demos contents, chapter explanation, recipe link and previous/next footer. Chapters autoplay and repeat until
manual takeover; reduced motion starts paused. Fullscreen sits beside the chevron, including when collapsed.
The guide starts 24 px from bottom left on desktop; mobile uses a bottom drawer with tap/swipe collapse and expansion. Non-calendar products sit to its right on wide screens;
phones keep a full-height product canvas behind the drawer, without reserved space. See [QUNO-032](./shared/decisions.md#quno-032---share-the-floating-guide-across-all-concept-products).

The [23 JSON scenarios](../demo/concept/README.md#edit-scenarios-in-json) include seven Datepicker interactions: paint,
adjust, move, intent guessing, month access, start/end shortcuts and single-day selection. Datepicker’s introduction
and chapters explain the author’s rationale; month access scrolls back to July 1980 and selects the 22nd. Date Input uses today's
reference date and four natural-typing examples, waiting 1.2 seconds before each Enter. Its keyboard demo steps days down and months up. Timepicker minutes are smaller than
hours and align at the top. Calendar overlap playback holds all cards closed between cycles; Save glints and Cancel
fades the draft. Existing field guides remain the destinations for live public-contract recipes.

Date Input concept chapters now explain format guessing, flexible range typing, caret edits and a focus-open picker
composition. See [QDI-006–007](./date-input/decisions.md). Datepicker’s distant-year scroll lasts 8840 ms; see
[QDP-134](./datepicker/decisions.md#qdp-134--double-distant-year-scroll-duration).

Timepicker’s [QTP-004](./timepicker/decisions.md#qtp-004---demonstrate-shared-date-and-time-selection-in-the-concept)
adds a date/time concept chapter; Date Parser’s [QDPR-008](./date-parser/decisions.md#qdpr-008---expose-tokens-beside-resolved-concept-dates)
makes tokens and resolved endpoints visible together.

Date Parser’s concept workbench contains only its phrase, reference, semantic tokens and resolved endpoints;
chapter JSON owns parsing options. See [QDPR-011](./date-parser/decisions.md#qdpr-011---keep-concept-resolution-free-of-extra-controls).

Date Parser’s ready date/time introduction and six-example phrase chapter are recorded in
[QDPR-012](./date-parser/decisions.md#qdpr-012---open-with-a-ready-date-and-time-and-expand-phrase-examples).

Concept guide footers now contain only Previous/Next with contextual contents actions (QUNO-035). Calendar creation
drafts support movement before Save (Infinite Calendar 149). Mobile drawer and adjacent fullscreen behavior are
recorded in [QUNO-038](./shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen).

Concept system appearance and preserved light control panels are recorded in
[QUNO-037](./shared/decisions.md#quno-037---follow-system-appearance-around-light-demo-panels); Calendar Decision 151
aligns its default palette and responsive zoom controls.

[Calendar Decision 153](./infinite-calendar/decisions.md#153---give-mobile-calendar-labels-thirty-percent-of-the-viewport)
sets the mobile concept names column to 30% of the viewport, with 25% smaller names and 40% smaller date labels.

[QUNO-039](./shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer) makes the mobile
explainer overlay the full product canvas without a spacer or disclosure-driven content movement.

The concept’s top menu uses **Parser**, while its introduction is titled **Date parser** and explains tokenization
followed by date interpretation. Product IDs, package imports and guide routes retain `date-parser`; see
[QDPR-013](./date-parser/decisions.md#qdpr-013---introduce-the-parser-with-tokenization-and-date-interpretation).

The Parser concept’s Resolve ambiguity chapter demonstrates numeric order and inferred years with `10-11-12`,
`01/02` and `feb 11 80`; see [QDPR-014](./date-parser/decisions.md#qdpr-014---demonstrate-ambiguous-short-dates-and-year-inference).

Mobile explainer disclosure preserves playback; see
[QUNO-040](./shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback).

Infinite Calendar’s scroll demos now use a 15-date window, and its busy-schedule exhibit retains a full-size calendar.
See [Decision 155](./infinite-calendar/decisions.md#155---use-smaller-demo-date-windows-with-stable-density-geometry)
and [Decision 156](./infinite-calendar/decisions.md#156---isolate-the-embedded-density-exhibit-from-concept-page-layout).

The busy-schedule comparison uses repeatable shuffled 4/20/60-event days; see
[Decision 157](./infinite-calendar/decisions.md#157---compare-realistic-shuffled-schedules-at-four-twenty-and-sixty-events).
