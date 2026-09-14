# Quno Calendar Agent Instructions

These instructions apply to the entire combined `@quno/calendar` repository.

## Start here

Before changing code or behavior, read `README.md`, `docs/README.md`, `docs/shared/decisions.md`, `CHANGELOG.md`,
`docs/shared/usage.md`, and the `README.md` plus `decisions.md` for every product in scope. Treat them as part of the
implementation and update them in the same change.

## Package domains

- `src/lib/shared`: headless timezone-free `IsoDate` contracts and safe calendar-day helpers.
- `src/lib/timeline`: `QunoInfiniteCalendar`; day keys are `IsoDate`, while event start/end values remain timestamp strings.
- `src/lib/date-picker`: `QunoDatePicker` and its direct-manipulation range behavior.
- `src/lib/date-input`: `QunoDateInput`, native editing, and formatting; consumes the Date Parser domain internally.
- `src/lib/date-parser`: the headless parser/tokenizer implementation and public surface.
- `demo/guide`: four guides built from one editorial system. Every primary contract needs a live public-entry-point example, concise “Try it” guidance, and a copyable recipe. Mount heavy Infinite Calendar exhibits lazily.

Do not use parent-directory module imports. Same-folder imports may use `./`; every cross-folder import uses a stable alias: public package tests use `@quno/calendar/*`, private source tests use `#quno-internal/*`, demo code uses `#quno-demo/*`, API handlers use `#quno-api/*`, browser tests use `#quno-e2e/*`, unit-test helpers use `#quno-tests/*`, and root configuration uses `#quno-project/*`. The root `@quno/calendar` entry is headless; UI is exported only from its feature subpaths. Styles remain optional, independent, component-scoped assets.

## Documentation records

- Keep `CHANGELOG.md` at the repository root with `Unreleased` first.
- Keep product documentation under `docs/infinite-calendar`, `docs/datepicker`, `docs/date-input`, and
  `docs/date-parser`. Every product must retain its own `README.md` and `decisions.md`.
- Record a product-specific choice only in that product's `decisions.md`. Record a choice affecting more than one
  product in `docs/shared/decisions.md`; do not use another product's ledger as a convenient default.
- Append a new decision when accepted behavior changes. Never silently rewrite an accepted decision, move or reuse its
  identifier, or erase historical context. Preserve existing calendar, `QDP-*`, `QDI-*`, `QDPR-*`, and `QUNO-*`
  identifiers and link superseding entries explicitly.
- Keep `README.md` concise, `docs/README.md` navigable, `docs/shared/usage.md` copyable, and all four `/guide/*` routes
  interactive.
- Update `docs/shared/migration.md` for any breaking public-name, entrypoint, token, or class change.
- Keep `docs/shared/architecture.md`, `docs/shared/taxonomy.md`, and `docs/shared/testing.md` aligned with package-wide
  boundaries and verification. Keep Infinite Calendar runtime details in `docs/infinite-calendar`.

## Architecture and style

- Author against React 18+ and keep Preact support through tested `preact/compat` aliases.
- Preserve strict TypeScript, controlled/uncontrolled component behavior, stable `data-slot` and state attributes, external event rendering, and consumer-owned customization.
- Keep production modules at or below 200 non-comment lines and functions at or below 120 source lines. Split by responsibility before crossing either limit.
- Use `--quno-*` shared tokens, `--quno-calendar-*`/`quno-calendar-*` timeline names, and `--quno-date-picker-*`/`quno-date-picker-*` picker and input names.
- Keep framework runtimes and the TanStack virtualizer external. Never edit generated `dist` assets.

## Verification

Run formatting, architecture checks, typechecking, linting, unit tests, Chromium Playwright tests, the Preact compatibility fixture, demo build, package verification, size reporting, and `npm pack --dry-run` before handoff. Update `CHANGELOG.md` with any exact blocker.

Visual changes require Playwright coverage that asserts geometry, layering, clipping, state, or computed styles rather than screenshots alone. Public API guards must require all four product subpath surfaces and reject legacy facade names and private modules.
