# Branch: `feat/qu-3879-01-calendar-foundation`

1. Add explicit display-timezone support to the Infinite Calendar.
   1. Keep event timestamps in UTC while using a caller-supplied IANA timezone for date bucketing, event geometry, Today/focus, navigation and draw/drag callbacks.
   2. Retain the existing headless date contracts and optional styling/public subpath boundaries. Demonstrate timezone behavior through the public calendar entry point.
      Why: the staff calendar must display the brand's timezone consistently across browser timezones.
      Files: timeline core/types/focus effects, date virtualization, event indexing/interval layout, horizontal/vertical geometry and navigation, interaction hooks, zonedTime.ts/time.ts, demo/guide entries and timezone tests.

2. Preserve duration and reject invalid DST interactions.
   1. Account for elapsed duration across offset changes. Reject nonexistent and ambiguous local pointer times rather than silently choosing an instant.
   2. Cancel invalid draft ranges and retain controlled interaction behavior. Add regression coverage for DST conversion and interactions.
      Why: spring gaps and autumn repeated times must not produce incorrect appointment or availability timestamps.
      Files: zonedTime.ts, timelineInteractionModel.ts, useTimelineDraftInteraction.ts, tests/timezone.test.ts, tests/unit/lib/interaction/dst.test.tsx and e2e/specs/timezone.spec.ts.

3. Document the supported behavior and package it for consumers.
   1. Update public usage, Infinite Calendar decisions, README/CHANGELOG and the interactive timezone demo. Adjust measured demo-size expectations for the added capability.
   2. Untrack and ignore the local node_modules symlink; it remains available locally and is not a package dependency declaration.
   3. The monorepo subsequently refreshed its vendored 0.6.0 archive and verified the installed bytes against it, so the library fixes are consumed by Onboarding. No registry publication is claimed.
      Why: public timezone behavior needs discoverable examples, explicit limits and the same tested implementation in the consuming app.
      Files: README.md, CHANGELOG.md, docs/, demo/demos/TimeZoneDemo.tsx, demo/guide/, scripts/check-bundle-size.mjs, e2e/specs/examples.spec.ts and .gitignore; consumer archive lives in quno-next-mono/apps/onboarding/vendor/.

4. Verify compatibility and retain the exact known formatting limit.
   1. All 328 unit tests pass with one worker, including 13 DST regression cases; four focused Chromium checks pass. A timing-sensitive parallel performance assertion passed in the single-worker run.
   2. Architecture, TypeScript, lint, library/demo builds, size budgets, packed React/SSR and Preact fixtures, and npm pack dry-run pass.
   3. Full formatting still reports a pre-existing issue in src/lib/date-picker/OffscreenPills.tsx; changed DST files pass. Chromium coverage reported here is the focused set, not a claim that the entire browser suite ran.
      Why: establish timezone correctness and package compatibility while preserving verification limits accurately.
      Evidence: local qu3879-dst-unit-serial.log, qu3879-dst-package.log, qu3879-dst-compat.log and qu3879-dst-format.log; repository tests and CHANGELOG.
