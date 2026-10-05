# Documentation

The documentation follows the four public `@quno/calendar` products. Start with the product you are changing, then
use the shared records for package-wide contracts and release work.

Focused input/picker compositions keep Start and End shortcut navigation inside the popup. See the
[composition recipe](./shared/usage.md#qunodate-input) and
[focus contract](./shared/decisions.md#quno-014---retain-focus-through-composed-endpoint-navigation).

| Product                | Public entry point                 | Documentation                                      | Live field guide           |
| ---------------------- | ---------------------------------- | -------------------------------------------------- | -------------------------- |
| Quno/Infinite Calendar | `@quno/calendar/infinite-calendar` | [Infinite Calendar](./infinite-calendar/README.md) | `/guide/infinite-calendar` |
| Quno/Datepicker        | `@quno/calendar/datepicker`        | [Datepicker](./datepicker/README.md)               | `/guide/datepicker`        |
| Quno/Date Input        | `@quno/calendar/date-input`        | [Date Input](./date-input/README.md)               | `/guide/date-input`        |
| Quno/Date Parser       | `@quno/calendar/date-parser`       | [Date Parser](./date-parser/README.md)             | `/guide/date-parser`       |

The [named-contract migration](./shared/migration.md#unreleased-named-contracts-and-product-ownership) maps the
current breaking API cleanup. Product decision records preserve the historical signatures they supersede.

The current responsiveness work is recorded in
[QUNO-013](./shared/decisions.md#quno-013---bound-high-frequency-work-to-display-frames), with Infinite Calendar's
multilane availability geometry in [Decision 091](./infinite-calendar/decisions.md#091---availability-has-independent-collision-lanes).

Date Parser can opt into traditional clock times and overnight ranges with `recognizeTime: true`.
See [optional clock recognition](./date-parser/README.md#optional-clock-recognition) and its live guide chapter.

## Shared package records

- [Architecture](./shared/architecture.md) defines public surfaces, dependency direction, framework compatibility,
  date models, and packaging boundaries.
- [Usage](./shared/usage.md) owns copyable recipes and cross-product composition.
- [Migration](./shared/migration.md) maps former package names and APIs to `0.6.0`.
- [Taxonomy](./shared/taxonomy.md) defines vocabulary used across source, guides, and tests.
- [Testing](./shared/testing.md) owns the combined verification strategy and feature budgets.
- [Shared decisions](./shared/decisions.md) records choices affecting more than one product.

Each product owns its own `decisions.md`. Historical identifiers remain stable even when an older decision predates
the four-product documentation structure. `CHANGELOG.md` remains at the repository root because releases apply to the
combined package.
