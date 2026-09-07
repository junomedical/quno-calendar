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
