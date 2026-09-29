# Documentation

The documentation follows the four public `@quno/calendar` products. Start with the product you are changing, then
use the shared records for package-wide contracts and release work.

| Product                | Public entry point                 | Documentation                                      | Live field guide           |
| ---------------------- | ---------------------------------- | -------------------------------------------------- | -------------------------- |
| Quno/Infinite Calendar | `@quno/calendar/infinite-calendar` | [Infinite Calendar](./infinite-calendar/README.md) | `/guide/infinite-calendar` |
| Quno/Datepicker        | `@quno/calendar/datepicker`        | [Datepicker](./datepicker/README.md)               | `/guide/datepicker`        |
| Quno/Date Input        | `@quno/calendar/date-input`        | [Date Input](./date-input/README.md)               | `/guide/date-input`        |
| Quno/Date Parser       | `@quno/calendar/date-parser`       | [Date Parser](./date-parser/README.md)             | `/guide/date-parser`       |

The [named-contract migration](./shared/migration.md#unreleased-named-contracts-and-product-ownership) maps the
current breaking API cleanup. Product decision records preserve the historical signatures they supersede.
For creation defaults and centered row navigation, see Infinite Calendar Decision 094 and the shared usage recipes.
Consumer-owned initial skeletons are covered by Infinite Calendar Decision 095 and the async-loading flow.

The current responsiveness work is recorded in
[QUNO-013](./shared/decisions.md#quno-013---bound-high-frequency-work-to-display-frames), with Infinite Calendar's
multilane background availability geometry in [Decision 091](./infinite-calendar/decisions.md#091---availability-has-independent-collision-lanes),
refined by the explicit background opt-in in [Decision 093](./infinite-calendar/decisions.md#093---event-entity-kind-is-separate-from-its-render-layer).

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
