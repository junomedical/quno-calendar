# Quno Calendar Agent Instructions

These instructions apply to the entire combined `@quno/calendar` repository.

## Start here

Before changing code or behavior, read `README.md`, `docs/decisions.md`, `CHANGELOG.md`, and `docs/usage.md`. Treat them as part of the implementation and update them in the same change.

## Package domains

- `src/lib/shared`: headless timezone-free `IsoDate` contracts and safe calendar-day helpers.
- `src/lib/timeline`: `QunoCalendar`; day keys are `IsoDate`, while event start/end values remain timestamp strings.
- `src/lib/date-picker`: `QunoDatePicker` and its direct-manipulation range behavior.
- `src/lib/date-input`: `QunoDateInput`, tokenizer, parser, and formatting contracts.
- `demo/guide`: the one canonical field guide. Every primary contract needs a live public-entry-point example, concise “Try it” guidance, and a copyable recipe. Mount heavy timeline exhibits lazily.

Use `#quno-internal/*` only for private cross-domain source imports. The root `@quno/calendar` entry is headless; UI is exported only from its feature subpaths. Styles remain optional, independent, component-scoped assets.

## Documentation records

- Keep `CHANGELOG.md` at the repository root with `Unreleased` first.
- Record important product or engineering choices in `docs/decisions.md`; do not rewrite accepted calendar decisions.
- Preserve datepicker history and `QDP-*` identifiers in `docs/date-picker-decisions.md`.
- Keep `README.md` concise, `docs/usage.md` copyable, and `/guide` interactive.
- Update `docs/migration.md` for any breaking public-name, entrypoint, token, or class change.
- Keep `docs/architecture.md`, `docs/taxonomy.md`, and `docs/test-plan.md` aligned with the source domains and verification strategy.

## Architecture and style

- Author against React 18+ and keep Preact support through tested `preact/compat` aliases.
- Preserve strict TypeScript, controlled/uncontrolled component behavior, stable `data-slot` and state attributes, external event rendering, and consumer-owned customization.
- Keep production modules at or below 200 non-comment lines and functions at or below 120 source lines. Split by responsibility before crossing either limit.
- Use `--quno-*` shared tokens, `--quno-calendar-*`/`quno-calendar-*` timeline names, and `--quno-date-picker-*`/`quno-date-picker-*` picker and input names.
- Keep framework runtimes and the TanStack virtualizer external. Never edit generated `dist` assets.

## Verification

Run formatting, architecture checks, typechecking, linting, unit tests, Chromium Playwright tests, the Preact compatibility fixture, demo build, package verification, size reporting, and `npm pack --dry-run` before handoff. Update `CHANGELOG.md` with any exact blocker.

Visual changes require Playwright coverage that asserts geometry, layering, clipping, state, or computed styles rather than screenshots alone. Public API guards must require the three subpath surfaces and reject legacy facade names and private modules.
