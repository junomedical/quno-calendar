# Agent Notes

## Project Context
This repository is a reusable React infinite-calendar PoC. Keep the implementation focused on the component/library surface first and the demo second.

## Documentation Discipline
Behavioral, API, interaction, or architecture changes must update the relevant Markdown files in `docs/` during the same change:

- `docs/architecture.md` for component contracts, data flow, layout, virtualization, and interaction architecture.
- `docs/taxonomy.md` for interface vocabulary and canonical names for UI parts.
- `docs/usage.md` for public API usage and copyable examples.
- `docs/decisions.md` for design decisions and tradeoffs.
- `docs/test-plan.md` for new or changed verification expectations.
- `docs/changelog.md` for user-visible changes.

Do not leave documentation updates as a follow-up when changing library behavior.

## Visual Verification
Any visual calendar change must be backed by a Playwright test in the same change. Prefer assertions that verify geometry, layering, clipping, or computed styles over screenshots alone, and update `docs/test-plan.md` when the visual expectation changes.

## Implementation Notes
- Prefer native CSS sticky positioning for fixed calendar labels and headers before adding synchronized overlay state.
- Keep zoom controlled by the parent through `settings.zoom`; calendar gestures should request changes with `onZoomChange`.
- Keep vertical virtualization bounded around the top visible date and recenter after scroll idle; date navigation should update that anchor rather than restoring an unbounded virtual list. Recenter operations must preserve the pixel offset inside the visible date so scroll end does not create a content jump.
- Keep timeline labels adaptive at dense zoom levels; hide minor minute labels before allowing numbers to overlap.
- Keep event rendering externalized through `eventRenderer`; product-specific card layout belongs in the renderer, not in calendar internals.
- Preserve multi-calendar event semantics: `calendarIds` renders one event in multiple rows; hover focus stays local to the row instance, while drag/drop-preview status stays keyed by event id across visible instances.
- Keep drag/drop and draft creation hit-testing limited to timeline grid space, not left-side labels.
