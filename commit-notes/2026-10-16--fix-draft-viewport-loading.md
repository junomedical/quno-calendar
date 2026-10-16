# Branch: `fix/draft-viewport-loading`

1. Load all settled visible dates while a calendar draft is open.
   1. Include the settled viewport in the draft loading window. Keep the pre-draft coverage and draft/scroll anchors.
   2. Stop freezing horizontal viewport reads during an active draft. Retain the brief creation closing transition.
   3. Add unit and browser coverage for participant contraction and forward/backward scrolling.
      Why: Creation can show many dates. Each visible date must have event coverage.
      Files: range loader, horizontal foundation, viewport-loading fixture/tests and calendar documentation.
2. Prepare package version 0.6.4 from origin/main at 54cdc7a.
   1. Update package metadata, the lockfile, README and changelog.
   2. Verify 521 unit tests, 182 Chromium scenarios (one animation test passed on isolated retry), typecheck,
      lint, architecture, formatting, builds, package contracts, bundle sizes and Preact compatibility.
      Why: Onboarding needs a distinct package version for the corrected range loader.

3. Own visible-first prefetch in the calendar range coordinator.
   1. Request missing visible dates before policy-selected adjacent dates. Reuse existing coverage and pending state.
   2. Continue after successful empty responses and every navigation. Preserve finite retries, invalidation and abort guards.
   3. Prepare local package 0.6.4 so onboarding only configures its one-day buffer.
      Why: Consumers must not duplicate loaded-date tracking to control request priority.
      Files: range coordinator/loader, focused tests, package metadata and calendar docs.
   4. Reset virtual prefix geometry after excluded-weekday changes. Ignore metrics for excluded dates that normalize to a visible index. Preserve the original dense drawing assertions.
   5. Verify 182 of 183 Chromium scenarios. The remaining 20,000-event participant scroll check also fails in the pre-change source baseline: 200 px movement against a 2 px limit. Record this blocker in CHANGELOG.md.
   6. Pass architecture/contracts, formatting, lint, typecheck, packed React/ESM/CommonJS/SSR checks, bundle budgets, Preact compatibility, demo build and pack dry-run. Verify the installed onboarding timeline matches the final build.
   7. Pass all 526 unit tests in the final complete run. Keep package version 0.6.4 as requested. Rebuild the existing archive and verify its installed runtime and lockfile integrity.

4. Verify the demo against concurrent visible-first loading.
   1. Reuse the existing simulated API loader in the guide prefetch exhibit. Keep pending status correct for both adjacent reads.
   2. Check HTTP request ordering and cached-date navigation. Measure dense edit stability through the visible date and surviving card instead of internal scroll offsets. Keep the zero-late-mutation assertion.
      Why: Parallel reads must not report ready early. Bounded-window maintenance must preserve semantic geometry.
      Files: guide prefetch exhibit, browser regressions and package documentation.
   3. Pass 526 unit tests, architecture/contracts, formatting, typecheck and lint. Pass package verification, bundle budgets, Preact compatibility, the production demo build and pack dry-run. Keep version 0.6.4.
   4. Verify all 183 Chromium scenarios across the full run and isolated reruns. The full run passes 182; one cancellation case passes three consecutive isolated reruns. The prefetch HTTP ordering, held-neighbor readiness and dense edit position checks pass.

5. Share viewport settling with every event request.
   1. Pause new buffered reads while scroll, resize or committed layout corrections are pending.
   2. Use the existing viewport hook and coordinator. Keep cache coverage during the pause.
      Why: A fast response must not start another request for an intermediate range before the requested viewport settles.
      Files: viewport loading hook, horizontal/vertical integration, event loader, tests and calendar docs.

6. Expand settled event requests instead of adding response-driven prefetch calls.
   1. Remove the visible/adjacent phase split and duplicate priority-date tracking. Request missing coverage from the existing full policy window.
   2. Keep new requests behind native viewport settling. Reuse loaded and pending coverage. Preserve cached snapshots during scroll/layout changes.
      Why: A cold range should need one buffered request, not a visible request followed by two prefetch requests.

   3. Pass 524 unit tests, architecture/contracts, formatting, typecheck, lint, Preact compatibility, demo build, package verification, bundle budgets and pack dry-run. Verify all 183 Chromium scenarios across the full run and the two corrected guide-test reruns.
   4. Verify the live onboarding quick scroll produces one missing-edge request with no overlapping date reads. Match the installed 0.6.4 runtime and archive integrity to the final build.

7. Fetch missing dates after scroll and layout completion.
   1. Enable the existing virtualizer's native scroll-end support. Use its scrolling state and committed layout frames.
   2. Remove the general 100 ms request delay. Keep a wheel-only idle guard for per-step native scroll-end events.
   3. Keep cached events visible and accept completed responses during movement. Keep buffered missing-range coverage.
   4. Add return navigation to the guide exhibit. Cover warm navigation, gesture coalescing and structural ownership.
      Why: Date changes should read promptly once committed. Wheel bursts must not fetch intermediate viewports.
      Files: scroll runtime, viewport loader, guide demo, unit/browser regressions and calendar documentation.
   5. Pass all 528 unit tests and all 183 Chromium scenarios. Pass architecture/contracts, typecheck, lint, formatting, packed package contracts, bundle budgets, Preact compatibility, demo build and pack dry-run.
   6. Keep cancellation geometry and DOM assertions strict. Reject refetches of cached/pending dates while allowing new dates exposed by compact creation to load.
   7. Rebuild and clean-install 0.6.4 in onboarding. Verify runtime bytes, archive integrity, served browser code and one live missing-edge scroll request with no overlapping reads. Pass 113 onboarding tests and type checking.
