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
