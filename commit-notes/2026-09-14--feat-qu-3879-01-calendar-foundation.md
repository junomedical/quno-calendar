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

6. Preserve imported timestamps when opening an event.
   1. Compare absolute start minutes, elapsed duration and calendar membership when deciding whether a pointer release is a move. A stationary click or a return to the original minute activates the untouched event, including seconds and milliseconds.
   2. Retain actual time/resource moves and repeated-hour identity. Exercise differing endpoint seconds, browser-local mode and the public timezone demo.
      Why: minute-only interaction proposals must not silently reschedule imported appointments when the user clicks them.
      Files: dragInteractionModel.ts, tests/unit/lib/interaction/seconds.test.tsx, demo/demos/TimeZoneDemo.tsx, e2e/specs/timezone.spec.ts and the README/usage/decision/changelog records.
   3. Validation: all 25 focused interaction tests and 120 Chromium checks pass, including actual click and drag behavior in New York and Tokyo browser contexts. The full unit run passed 354 cases and hit one layout-scaling timing threshold; both layout-scaling tests passed when rerun without the concurrent browser/build jobs. Formatting, architecture, TypeScript, lint, library/demo builds, React/SSR and Preact package verification, size guards and pack dry-run pass. Infinite Calendar is 39,501 bytes gzip against 39,936 allowed.
   4. Refresh the corresponding step 1 Onboarding archive and its isolated local installation; all 50 selected package, calendar-surface and editor tests pass. The running release checkout and database are unchanged.

7. Reproject retained events and normalize actual moves at minute precision.
   1. Reindex cached absolute events into the selected display timezone synchronously while the refreshed source response is pending. Keep the existing source cache and refetch behavior.
   2. Floor both endpoints of an actual imported appointment move to whole minutes, retain untouched source timestamps on clicks, and reject invalid DST destinations without opening the original editor.
      Why: timezone changes must not render old-zone geometry with new-zone pointer math; fractional imported timestamps must not suppress valid edge moves or turn rejected drops into clicks.
      Files: useEventRangeLoader.ts, projectEventSnapshot.ts, horizontal/vertical view adapters, timelineInteractionModel.ts, dragInteractionModel.ts, useTimelineDragInteraction.ts, focused tests and timezone documentation.
   3. Validation: 360 unit tests, architecture/library/demo guards, TypeScript, lint, bundle-size guard and library build pass.
