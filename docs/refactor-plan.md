# Responsibility-Domain Refactor

## Goal

Keep the reusable calendar readable by organizing source around stable ownership domains. Folders answer “who owns this?”, modules answer “which step does it perform?”, and [`docs/flows`](./flows/README.md) answers “in what order does it run?”.

## Completed Structure

```text
src/lib/infinite/
├── scroll/        bounded date and resource windows
├── events/        loading, cache, indexing, layout, metrics
├── anchors/       semantic viewport focus and restoration
├── interactions/  pointer, hit testing, drag, draft, zoom
├── rendering/     shared and orientation DOM/CSS projection
└── views/         horizontal and vertical composition roots
```

The previous catch-all `hooks`, `utils`, `components`, `data`, `viewport`, `virtualization`, and `interaction` directories have been retired. Pure helpers were split by owner instead of moved into a replacement utility directory.

## Documentation Contract

- [`docs/domains`](./domains/README.md) defines ownership, dependency direction, invariants, and the complete source map.
- [`docs/flows`](./flows/README.md) defines runtime sequences, branches, cancellation, and focus priority.
- Every production source file links to exactly one domain document.
- `scripts/check-domain-docs.mjs` verifies source-map completeness, backlinks, retired directories, and allowed dependency direction.

## Size And Composition Rules

- Target 40–150 non-comment lines per production module.
- Fail architecture checks above 200 non-comment module lines or 120 source lines per function.
- Keep render-only components separate from stateful coordinators.
- Keep pure transformations separate from React effects.
- Add behavior to its owning domain instead of introducing `utils`, `common`, or generic `hooks` folders.
- Keep the public facade in `src/lib/index.ts`; internal domain paths are not package exports.

## Verification

Responsibility moves are behavior-neutral and must pass TypeScript, ESLint, Prettier, architecture/domain checks, unit/performance tests, Chromium, focused WebKit coverage, library/demo builds, package-consumer verification, SSR, declarations, and bundle budgets.
