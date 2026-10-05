# Branch: `feat/more-improvements`

1. Expose visible dates and center a requested horizontal resource row.
   Why: consumers need creation defaults from the actual viewport and explicit navigation to the row being edited.
   1.1. `src/lib/timeline/core/types.ts`, `useViewportAnchoring.ts` and `viewportGeometryRegistry.ts` expose `getVisibleDateKeys()` through the existing calendar handle. Dates are sorted and limited to the usable viewport rather than overscan.
   1.2. `useHorizontalNavigation.ts` adds optional `align: "center"` to resource-row navigation, including an already-visible row, while accounting for the sticky day header. Omitting alignment retains existing navigation behavior. `useVerticalNavigation.ts` exposes visible date keys without changing vertical navigation.
   1.3. `ArticleProductDemos.tsx`, `examples.spec.ts`, `viewportGeometryRegistry.test.ts` and `public-contracts.typecheck.ts` demonstrate and verify the public contracts and centered geometry.

2. Support consumer-owned initial loading content.
   Why: applications can wait for owner selection and initial data while retaining the timeline geometry needed for measurement and navigation.
   2.1. `QunoInfiniteCalendar.tsx`, `types.ts` and `base.css` add optional `isLoading` and `loadingFallback`. Empty owner selection defers initial timeline mounting; once owners exist, the timeline measures and loads beneath the supplied fallback. Revealing it preserves the mounted timeline.
   2.2. `ArticleRecipeDemos.tsx` and `IntegrationWalkthrough.tsx` demonstrate delayed owner context, supplied loading content and centered initial navigation. `examples.spec.ts` checks fallback visibility, layout, delayed initialization and stable navigation after loading.

3. Keep click-versus-drag detection inside the shared calendar.
   Why: moving an event away and back must not activate its editor, even when the final snapped slot is unchanged.
   3.1. `useTimelineDragInteraction.ts` tracks whether pointer movement exceeds four pixels for the whole gesture. The unchanged-slot activation fallback runs only when that threshold was never crossed; ordinary clicks and small pointer jitter still activate.
   3.2. `useTimelinePointerFrames.ts` observes raw movement before frame coalescing and observes the release point. `useTimelineInteractions.ts` supplies the starting point and connects observation to the drag interaction. Movement within one snapped slot, movement outside the hit region and release before the next frame cannot fall through to click activation.
   3.3. `dragActivation.test.tsx` adds eight gesture regressions. `interactions.test.ts` clarifies the unchanged-proposal contract. `drag.spec.ts` checks that dragging back clears the preview, preserves event geometry, emits no move and opens no editor, then verifies that a normal click still opens it.

4. Document behavior and verification for this branch.
   Why: reviewers and consumers need the public contracts, decision rationale and exact limits of the verification.
   4.1. `README.md`, `docs/README.md`, `docs/infinite-calendar/README.md` and `docs/shared/usage.md` describe the new contracts. Infinite Calendar decisions 094–096 record viewport navigation, loading ownership and gesture classification; the interaction and async-loading flow documents match the implementation. `CHANGELOG.md` records behavior and check results.
   4.2. Current implementation verification: typecheck, lint, architecture/contracts, changed-file formatting, library and demo builds, packed Preact compatibility, packed React/type/import/style verification and `npm pack --dry-run` pass. All 14 focused interaction tests and all three Chromium drag scenarios pass. The full Chromium run passed 117 of 118 scenarios; its single guide timeout passed on a targeted retry after building.
   4.3. Outstanding checks: the full unit run passes 336 tests and fails five existing stale guide assertions (one in `tests/date-picker/DemoStory.test.tsx`, four in `tests/unit/demo/FieldGuideProduction.test.tsx`). Repository-wide formatting flags unchanged `src/lib/date-picker/OffscreenPills.tsx`. Infinite Calendar JavaScript is 39,377 bytes gzip, 465 bytes above its unchanged 38 KiB ceiling, and 259 bytes larger than the preceding build. Other artifact budgets pass. These issues remain recorded rather than silently changing assertions, unrelated formatting or size ceilings.
   4.4. Preparation preserves the existing index, HEAD and active branch. This note is added only to the working tree; no staging, unstaging, stashing, commit, push or branch switch is performed.

5. Share the base event contract with consumers.
   Why: editor refs should use a named package contract rather than select fields from the renderer type.
   5.1. `src/lib/timeline/core/types.ts` defines `CalendarEventBase` with `id`, `calendarId`, and `start`. `CalendarEvent` inherits those fields. `src/lib/timeline/index.ts` exports the base through the public Infinite Calendar entry point.
   5.2. `tests/unit/lib/public-contracts.typecheck.ts` accepts the base fields and checks that rendering still requires the full event. `docs/infinite-calendar/README.md` and `CHANGELOG.md` describe the shared contract.

6. Own navigation timing inside the calendar package.
   Why: selection and draft changes must navigate using their committed geometry without consumer React wrappers.
   6.1. `useHorizontalNavigation.ts` consumes the latest request after layout commits. `useViewportAnchorRestore.ts` starts the existing anchor session after committed props and registrations; captures stay synchronous and cancellation discards pending work. Public handle names and options stay unchanged.
   6.2. Six regressions in `horizontalNavigation.test.tsx` and `viewportAnchoring.test.tsx` cover committed row sizing, newly selected participants, latest-request navigation, synchronous date-only navigation, committed anchor geometry and cancellation. The navigation guide reveals Room 1 and centers it in one normal state-update handler; Chromium asserts that it starts hidden. Controlled-draft guide examples use ordinary state updates before restoration.
   6.3. Navigation verification used temporary local version 0.6.3 so onboarding could install the changed build distinctly. No release is published. Decision 097, the usage recipes and ownership docs describe the layout boundary.
   6.4. Final source verification: all 347 unit tests, all 118 Chromium checks, typecheck, lint and architecture pass. Date-only navigation retains its synchronous path; deferring that path caused the saved-event motion regression, which was reproduced against the new code and passed against a read-only HEAD baseline before the fix. Infinite Calendar JavaScript is 39,500 bytes gzip, 588 bytes over its unchanged 38 KiB ceiling and 123 bytes larger than the previous build. Other artifact budgets pass.
   6.5. Final library/demo builds, packed Preact and React 19 fixtures, packed import/type/style/SSR verification, repository formatting and dry-run packing pass. Onboarding installs the local 0.6.3 archive; all 178 packaged files and lock integrity match. The work stays in the active main worktrees; this task does not stage, commit, push or publish.

7. Separate local preview projection from persisted loading.
   Why: editing a recurrence preview must not invalidate the event loader or require a consumer cache.
   7.1. `projectEvents` receives cached events and the inclusive rendered date window. Both views prepare its synchronous result after loading. Empty dates accept previews. Clearing the callback restores saved data. Recurrence rules remain consumer-owned.
   7.2. `useEventProjection.ts` leaves cache snapshots unchanged and retains unchanged date buckets. The loader keeps its existing version, filter, abort and mutation behavior. Public types, unit checks and the lazy guide example cover the new boundary.
   7.3. The branch package version is 0.6.2. Earlier local projection verification used temporary version 0.6.4. Nothing is published or staged by this task. Decision 098, usage and ownership documents describe the contract.
   7.4. Verification: all 351 unit tests and all 119 Chromium scenarios pass. Typecheck, lint, architecture, formatting, library/demo builds, Preact and React 19 compatibility, packed-package checks and pack dry-run pass. The existing size gate remains blocked: Infinite Calendar JavaScript is 39,858 bytes gzip, 946 bytes over the unchanged ceiling and 358 bytes above 0.6.3. Other artifact budgets pass.

8. Correct the branch package version to 0.6.2.
   Why: this branch must use the next package version after 0.6.1.
   8.1. `package.json`, both root package versions in `package-lock.json`, and the current `README.md` use 0.6.2. `CHANGELOG.md` records the correction under Unreleased.
   8.2. Earlier local 0.6.3 and 0.6.4 archive checks remain historical records. Existing staged changes remain intact. No consumer archive, commit, push, or publication is performed.
   8.3. Version verification on 2026-10-05: formatting, architecture, typecheck, lint, all 351 unit tests, all 119 Chromium tests, library/demo builds, packed React and Preact verification, and pack dry-run pass. The dry-run archive is `quno-calendar-0.6.2.tgz` with 180 entries. The size gate still failed against 38 KiB at that check; item 9 updates the limit.

9. Raise the Infinite Calendar JavaScript gzip ceiling to 39 KiB.
   Why: the accepted navigation and local projection behavior exceeds the earlier 38 KiB ceiling.
   9.1. `scripts/check-bundle-size.mjs` accepts up to 39,936 bytes. The measured 0.6.2 artifact is 39,858 bytes. Keep the other artifact ceilings. `guardScripts.test.ts` names the new limit.
   9.2. The shared guide profile and payload chapter report 38.92 KiB JavaScript and 1.99 KiB optional CSS. Guide unit and browser expectations use the same measured values. The guide README, product README, shared testing record, and `CHANGELOG.md` record the current budget. Infinite Calendar Decision 099 preserves the earlier decision and accepts the new ceiling.
   9.3. Verification: aggregate `npm run verify:package` now passes, including the size gate and packed React checks. Formatting, architecture, typecheck, lint, all 13 affected guard and guide unit tests, the Chromium payload-guide test, the demo build, and pack dry-run pass. The archive remains `quno-calendar-0.6.2.tgz`. Existing staged changes remain intact.
