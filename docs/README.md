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

The current responsiveness work is recorded in
[QUNO-013](./shared/decisions.md#quno-013---bound-high-frequency-work-to-display-frames), with Infinite Calendar's
multilane background availability geometry in [Decision 091](./infinite-calendar/decisions.md#091---availability-has-independent-collision-lanes),
refined by the explicit background opt-in in [Decision 093](./infinite-calendar/decisions.md#093---event-entity-kind-is-separate-from-its-render-layer).

The [single-day date-time recipe](./shared/usage.md#single-day-date-and-time) connects Date Input and Datepicker
through a separate `HH:mm` clock. Picker cadence/hours constrain typing only when Date Input enables `forceCadence`. Choosing a day opens time selection automatically, with no footer time control. The selector title displays the selected full date; its arrows skip disabled days while keeping time navigation open. Click the date title to return to day selection. Try `/demo/date-time`, or the Datepicker and Date Input guides’ date-time chapters.

Timepicker and Datepicker use [cadence-specific row sizes](./timepicker/README.md#value-and-settings), including six choices per five-minute row and 20-minute slots. Omitted or empty enabled hours enables all 24 hours in both selectors and forced input validation.
Both time selectors emphasize sticky hour headings with larger, bold text above the minute-number hierarchy.

Date Parser can opt into traditional clock times and overnight ranges with `recognizeTime: true`.
Single dates without a year, such as `6 oct 2pm`, use the same year ranking as date-only input.
See [optional clock recognition](./date-parser/README.md#optional-clock-recognition) and its live guide chapter.

The Infinite Calendar JavaScript gzip ceiling is 50 KiB; see
[Decision 094](./infinite-calendar/decisions.md#094---allow-50-kib-for-infinite-calendar-javascript).
Date Parser has a 7 KiB gzip ceiling; see
[QDPR-006](./date-parser/decisions.md#qdpr-006---leave-headroom-in-the-parser-bundle-budget).

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
