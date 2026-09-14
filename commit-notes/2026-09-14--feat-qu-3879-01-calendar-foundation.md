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

4. Verify the merged library and package.
   1. The full unit run passes 347 tests; final interaction tests pass 18 cases including an additional browser-DST-fold regression. All 118 Chromium checks pass across the full run and the rerun after fixing a missing pointer-helper import; timezone geometry also passes in New York and Tokyo browser contexts.
   2. Architecture, TypeScript, lint, formatting, library/demo builds, measured size guards, packed React/SSR and Preact fixtures, and npm pack dry-run pass. Current main resolves the earlier OffscreenPills formatting issue.
      Why: verify the combined public contract and timezone behavior, including actual package consumption.
      Evidence: local qu3879-cal-* merge verification logs; repository unit/browser tests and packaging scripts.

5. Align release 1 with current Calendar main.
   1. Merge origin/main at 2bcc8ce. Keep named object contracts, renderEvent, component-level locale, pointer-frame coalescing, ref-based interaction state and independent availability lanes, alongside timezone geometry and DST mutation safety.
   2. Compare drag changes by absolute instants so a repeated hour in the browser timezone cannot suppress a valid change in the configured calendar timezone.
   3. The combined Infinite Calendar artifact is 163.08 KiB raw / 38.59 KiB gzip with a 39 KiB ceiling; other product budgets are unchanged. Retain branch-local decision provenance where upstream reused Decision 091.
      Why: retain the latest main behavior without reintroducing browser-timezone dependence or breaking Onboarding's integration.
      Files: timeline runtime/interaction/date helpers, timezone demo/tests, public docs, size guards and shared production profiles. Onboarding updates its consumer API and vendored archive in the corresponding monorepo branch.
