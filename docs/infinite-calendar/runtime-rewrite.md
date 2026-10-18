# Infinite Calendar runtime rewrite

Baseline: `3138b28` on `main`. Implementation branch: `fix/infinite-calendar-runtime-rewrite`.

## Accepted direction

Replace the complete runtime alongside the existing implementation. The replacement owns data preparation,
geometry, date/resource virtualization, viewport transactions and interactions. Preserve the public API,
consumer-owned rendering/editors, CSS contracts, React 18+, React 19 and Preact compatibility. Switch both
orientations only after parity. Time-detail visibility follows Decision 116: labels switch immediately at full opacity with zoom.

One committed geometry revision supplies rendering, visibility, hit testing and anchor resolution. Logical
identity uses date/resource/time and event/participant identity, never a collision-lane index. One browser adapter
owns programmatic scrolling. Explicit restoration, gestures, navigation, data correction and idle recentering
have descending priority. Manual input cancels eligible restores immediately.

## Milestones

| Milestone                                   | Status                         | Evidence                                                                                         |
| ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| M0 Baseline and harness                     | Complete                       | Latest main `3138b28`, isolated baseline, temporary private selector                             |
| M1 Logical coordinates and geometry         | Complete                       | Projection/inverse, fractional extents, CSS column sizing, boundaries and pins                   |
| M2 Events and preparation                   | Complete                       | Cache/request races, draft suppression, projection, immutable reuse and mutation parity          |
| M3 Viewport transactions and virtualization | Complete                       | One revision and scroll writer, ownership, cancellation, bounded windows and recenter invariants |
| M4 Both renderers                           | Complete                       | Full Chromium parity; geometry, layering, clipping, identity, loading and custom rendering       |
| M5 Interactions and public handle           | Complete                       | Pointer, controlled zoom, focus, navigation, editor and parent-commit tests                      |
| M6 Stability and performance                | Measured; Firefox blocked      | Repeated Chromium/WebKit and dense profiling; see exact environment blocker below                |
| M7 Cutover and cleanup                      | Implemented; Firefox gate open | Both orientations switched on this branch; 62 obsolete modules and TanStack removed              |

## Immediate Shift-state follow-up

Decision 124 replaces the gesture-mode latch with the user's selected behavior: Shift-wheel zooms, unshifted wheel
scrolls immediately, and remaining inertia may switch modes. Shift keyup releases native overflow without discarding
already collected zoom input. Ordinary wheel takeover cancels remaining zoom work; a missing-keyup fallback delivers
the first delta once through the viewport adapter. No contact, direction or restart classifier ships.

The earlier restart-detection experiment was discarded at the user's request. Keep the 0.20 step and scroll lock
while Shift input is captured. The historical production comparison remains tied to `9add7ce`; this input-policy
change has not been reprofiled. Firefox's previously recorded standalone startup blocker remains open.

Verification on 2026-10-18: **565/565 unit tests** and **30/30 selected Chromium/WebKit tests** pass. The first
integration run exposed an old vertical assertion that expected unshifted momentum to remain captured; it now checks
zoom anchoring before ordinary scrolling and verifies immediate manual movement. Formatting, architecture/contracts,
types, lint, Preact, demo build, package verification, size reporting and pack dry-run pass. JavaScript is
**33,305 B gzip (32.52 KiB)**, +206 B versus `3fc9ba7`; CSS stays **2,018 B**. Firefox was not retried for this follow-up.
Evidence is in `/tmp/quno-shift-immediate/`, including `final-browser.log`, `final-integration.log` and `unit.log`.

## Wheel gesture continuity follow-up

Decision 123 keeps the initial native-scroll or zoom mode until 300 ms without wheel input. Releasing Shift during
zoom keeps subsequent momentum captured, and pressing Shift during native scrolling cannot convert that stream
into zoom. Every captured sample renews native-scroll suspension. A rejected request still expires after one second,
but timeout does not release continuing input. The step remains 0.20.

The affected user confirmed that renewing capture prevents scrolling after Shift release, then reported the reverse
case (pressing Shift during scrolling). The symmetric mode latch passes automated Chromium/WebKit coverage; physical
touchpad confirmation for that reverse case is pending. These follow-ups have not been reprofiled against #44.

Verification on 2026-10-18: **562/562 unit tests** and **26/26 selected Chromium/WebKit tests** pass, covering both
modifier transitions, sustained decaying momentum, limits, delayed/rejected parents, pointer anchoring and guide
payload facts. Formatting, architecture/contracts, types, lint, Preact, demo build, package verification, size reporting
and pack dry-run pass. JavaScript is **33,099 B gzip (32.32 KiB)**, +54 B from the preceding 0.20 build; CSS remains
**2,018 B**. Firefox's previously recorded standalone startup blocker remains open; it was not retried for this
follow-up. Evidence is in `/tmp/quno-zoom-momentum-tail/`, especially `latch-browser.log` and `final-*.log`.

## Intermediate zoom sensitivity follow-up

Decision 122 sets the current Shift-wheel step to 0.20 in both orientations. Commit pacing, native-scroll suspension,
limits and anchoring retain their behavior. The 0.30 comparison below remains tied to candidate `9add7ce`; this
sensitivity-only change has not been reprofiled.

Verification on 2026-10-18: 559/559 unit tests pass. The selected Chromium/WebKit run passed 84/92; old step
expectations and a delayed-parent probe below the horizontal effective-scale floor caused eight test failures.
Corrected expectations and a fixture starting above that floor pass all 10 affected/rechecked cases, covering all
92 selected scenarios across the runs. Formatting, architecture/contracts, types, lint, Preact, demo build,
package verification, size reporting and pack dry-run pass. JavaScript is 33,045 B gzip (32.27 KiB), two bytes less
than the 0.30 candidate; CSS stays 2,018 B. Evidence is in `/tmp/quno-zoom-step-020/`.

## Commit-aware zoom follow-up

Branch `fix/calendar-zoom-commit-pacing` starts at PR #44 head `d6ac965` and targets `main` separately. Decision 121
adds one outstanding controlled request, adapter commit acknowledgment, next-frame scheduling and bounded timeout.
The physical Chrome touchpad experiment reproduced white gaps with the lock disabled; the final build retains
native-scroll suspension and removes the private experiment switch.

The [matched production comparison](./zoom-commit-pacing-comparison.md) records all three rounds and raw samples.
Responsive p95 CPU changed 4.885 → 5.238 ms horizontal (+7.2%) and 8.248 → 7.883 ms vertical (-4.4%). The final
build passes the comparative 10% regression gate, absolute <10 ms CPU target, long-task and DOM/event budgets.
Earlier unfinished-candidate measurements exceeded the vertical target; the committed report measures the final
native-listener ordering fix. With a 180 ms parent delay, callbacks fall 64 → 16 per run, while p95 input-to-commit
latency increases from 195.1 → 377.2 ms horizontal and 203.0 → 391.5 ms vertical. This is a work/latency tradeoff.
The PR remains draft as requested. Firefox's standalone startup blocker remains open.

Verification on 2026-10-18: **559/559 unit tests** and **37/37 focused WebKit zoom tests** pass. The full Chromium run
passed **222/223**; `calendar-row-filter.spec.ts`'s pending-update navigation case briefly reported October 29 instead
of October 22 after settling. It passes **3/3 unchanged focused reruns**. This is not an uninterrupted full-suite pass.
All new delayed/rejected-parent and existing frame, anchor, continuity, limit and momentum-tail cases pass.
Formatting, architecture/contracts, types, lint, packed package verification, Preact, React 19, demo build,
size reporting and pack dry-run pass. JavaScript is **33,047 B gzip (32.27 KiB)**, +503 B versus `d6ac965`; CSS is
unchanged at **2,018 B (1.97 KiB)**. Firefox's fresh standalone retry timed out after 15 seconds with
`sandbox_extension_issue_file_to_process ... Operation not permitted` and
`RenderCompositorSWGL failed mapping default framebuffer, no dt`; no Firefox application scenario ran.
Evidence is in `/tmp/quno-zoom-pacing/final-*.log`, `firefox.log` and the committed matched-run JSON/report.

## Zoom sensitivity follow-up verification

Decision 120 doubles each nonzero Shift-wheel sample from 0.15 to 0.30, retaining the native-scroll lock. Verification
completed on 2026-10-18: all **549 unit tests** pass in a fresh single-worker run. The overnight Chromium run passed
**213/219**; all six affected scenarios pass focused reruns. Two zoom expectations were updated, and the horizontal
anchor assertion now accepts the exact half-pixel native-scroll rounding boundary. Four guide/editor scenarios pass
unchanged on rerun. The overnight WebKit run passed **27/28**, with its navigation timeout passing on rerun. Both
updated anchor scenarios additionally pass in Chromium and WebKit (**four tests**).

Formatting, architecture/contracts, types, lint, demo build, packed package verification, Preact, React 19, size
reporting and pack dry-run pass. JavaScript is **32,544 B gzip (31.78 KiB)**; CSS remains **2,018 B (1.97 KiB)**.
Firefox's standalone startup blocker remains open. Evidence uses `sensitivity-*` logs in `/tmp/quno-runtime-rewrite/`;
the final unit log is `sensitivity-unit-clean.log`. Earlier unit runs encountered load/suspension timeouts and a stale
guide-size assertion, now corrected. The overnight browser runs are not claimed as uninterrupted full-suite passes.

## Inertial zoom follow-up verification

Decision 119 temporarily suspends native scrolling during captured Shift-wheel/touch input while programmatic
anchor commits remain available. Original overflow declarations and priorities return after 300 ms without a
captured sample, on observed external takeover or on unmount. The affected Chrome user confirmed the physical
touchpad gesture no longer produces rectangular white gaps. Original zoom sensitivity and render bounds remain.

All **549 unit tests** pass. The full Chromium run passes **218/219** cases, including the previously intermittent
row-filter restoration scenario. Its only failure used the old 31.53 KiB guide expectation while the displayed
measurement was updated during the run. The corrected guide assertion and Shift-input cases pass all **10 focused
Chromium/WebKit tests**. An additional **40 focused frame/input tests** pass across those browsers. Formatting,
architecture/contracts, types, lint, packed package verification, Preact, React 19, demo build, size reporting and
pack dry-run pass. JavaScript is **32,543 B gzip (31.78 KiB)**, up 255 B from the prior Shift-input fix; CSS stays
**2,018 B (1.97 KiB)**. Firefox's standalone startup blocker below remains open. Evidence uses `scroll-lock-*`
logs in `/tmp/quno-runtime-rewrite/`.

## Shift-input follow-up verification

Decision 118 reserves Shift-wheel before no-op/limit checks and suppresses Shift-touch panning. New wheel bursts
clear stale anchors even when their first sample cannot change zoom. Ordinary input returns after the existing
300 ms wheel tail. The live demo and PR include the fix.

All **545 functional unit tests plus two isolated scaling tests** pass. The full Chromium run passes **218/219**
cases, including all four new real-wheel tests. The row-filter restoration scenario times out waiting for `row-134`
after expansion, then passes **five isolated repeats unchanged**; retain this intermittent full-suite limitation.
All **20 focused WebKit cases** pass, including the new input cases and both orientations' frame-stability checks.
Formatting, architecture/contracts, types, lint, package verification, Preact, React 19, demo build, size reporting
and pack dry-run pass. JavaScript is **32,288 B gzip (31.53 KiB)**; CSS remains **2,018 B (1.97 KiB)**. Firefox's
standalone startup blocker is unchanged. Evidence uses `shift-*` logs in `/tmp/quno-runtime-rewrite/`; the earlier
`shift-chromium.log` run was intentionally interrupted before adding the stale-anchor regression, and the complete
run is `shift-chromium-final.log`.

## PR integration verification

Current main `edc6f38` is integrated. Its removal of zoom transparency is preserved in both renderers, including
full-opacity labels, display-based hiding and the 15/five-minute grid cadence. The branch-local runtime Decision
116 is disambiguated as `116-runtime`; the ledger records the collision and retains main's published Decision 116
and the optimization's Decision 117.

The integrated tree passes **538 functional unit tests plus both isolated scaling tests**, **215 Chromium
scenarios**, and **24 focused WebKit scenarios**. Formatting, architecture/contracts, types, lint, packed package
verification, Preact, React 19, demo build, size reporting and pack dry-run pass. The initial Chromium run had one
editor drag failure: its fixed destination landed on the external popup's date input. The regression now selects
an exposed calendar destination; five focused repeats and the final complete suite pass without runtime changes.

Integrated JavaScript is **32,224 B gzip (31.47 KiB)**; CSS is **2,018 B gzip (1.97 KiB)**. Previous timings below
precede this merge and are not presented as fresh measurements of the integrated runtime. Firefox remains blocked
at standalone startup as detailed below. Current evidence uses `pr-*` logs in `/tmp/quno-runtime-rewrite/`.

## Pre-integration optimization verification

Decision 117 refines the completed cutover with stable React presentation snapshots, indexed resource metrics,
reused geometry and captured native observations. All **541 unit tests in 66 files**, **223 Chromium scenarios**,
**200 sensitive frame/seeded repeats**, and **18 focused WebKit cases** pass on the final runtime. Architecture and
contract checks cover 162 production modules. Typechecking, lint, package verification, Preact, React 19, demo build
and size reporting pass. Final formatting, the guide's five updated size checks, pack dry-run and diff checks pass.

The first optimization browser run exposed eight focus/draft restoration failures. Captured observations could
outlive a programmatic commit, and a retained presentation revision could reject a valid pin-only restore. The
adapter now discards superseded observations; React commits the current engine revision only when its rendered
geometry/window still matches. All eight targeted reruns and the final complete suites pass. Seven new unit tests
cover work reuse, invalidation, live viewport state and observation/commit ordering.

The final three-version production comparison reduces horizontal scroll/zoom p95 from **2.014/7.458 ms** to
**1.611/5.030 ms**. Scrolling is essentially main parity; zoom is 17.6% below main. Vertical zoom is **9.112 ms**,
below the 10 ms budget. Vertical scroll p95 increases **3.534 → 4.179 ms** against the initial rewrite despite a
lower median; keep this tail-cost profiling follow-up visible. No sampled long tasks exceed 50 ms. The separate
production budget harness also passes (scroll p95 1.394 ms horizontal / 3.612 ms vertical). Different harness
cadences make those budget figures distinct from the comparison results.

JavaScript is **32,555 B gzip (31.79 KiB)** and optional CSS remains **1,996 B gzip**. See the
[complete comparison and raw samples](./performance-comparison.md). Logs are `opt-final-*`,
`optimization-restore-fixes.log`, `optimized-comparison.log`, and `optimized-layout-summary.json` under
`/tmp/quno-runtime-rewrite/`. Firefox remains blocked at standalone startup as recorded below; M7's complete
cross-browser acceptance remains open. These measurements preceded PR preparation and the integration of main's removal of zoom transparency.

## Initial cutover verification record

Baseline formatting, architecture/contracts, typechecking and lint passed. The initial unit run had 543 passes
and one noisy mixed-layer scaling failure (36.22 against 25) while builds ran concurrently; the isolated
performance rerun passed both cases. All 221 Chromium scenarios passed on an isolated server at port 5187.
Demo/package builds, Preact, React 19, size reporting and pack dry-run passed. The existing development server
at port 5173 served stale modules, so all subsequent browser verification uses `QUNO_TEST_PORT` and a fresh server.

Both public orientations now use the replacement. The private `QUNO_CALENDAR_RUNTIME` selector and temporary
presentation bridges are removed. Existing public entry points, names and CSS remain unchanged. The branch has not
been merged or published.

An earlier full unit run passed all 534 tests in 65 files. After updating the guide's measured-size assertion, all
532 functional tests pass; the combined run's mixed-layer timing ratio was 27.42 against 25, and both performance
checks pass in an isolated one-worker run without source changes. The complete Chromium suite passed 223 scenarios
before the final vertical time-axis memoization. A subsequent run had one row-filter setup timeout before its
update action; five isolated repeats and the next full run's row-filter cases pass. That full run caught a stale
41.72 KiB guide assertion, now updated to 31.00 KiB. The final full Chromium rerun passes all 223 scenarios. The 200-case sensitive repeat passes; after the memoization,
all 140 vertical-zoom and seeded cases pass ten repeats. The final focused WebKit suite passes all 18 cases, with
36 vertical frame repeats also passing before memoization.

Architecture/contracts, typechecking, lint, packed package verification, Preact and React 19 compatibility and size
reporting pass. The final demo build and formatting pass; the final pack dry-run passes. Infinite Calendar
JavaScript is 31,746 B gzip (31.00 KiB), down from 42,719 B; optional CSS remains 1,996 B gzip. The final development
profile records scroll p95 scripting/style/layout of 3.417 ms horizontal and 4.468 ms vertical, no long tasks,
and maximum DOM counts of 421/2,234 (22/168 event nodes). See the separate
[production before/after comparison](./performance-comparison.md) for timing methodology, gains and regressions.

The WebKit checks caught rounding amplification across slider reversals and pending native scroll cancelling the
first wheel owner. The engine now retains the external semantic zoom anchor until movement, navigation or resize,
and the adapter flushes native input before wheel ownership. Both have focused regression coverage. Vertical column
extents also use CSS `minmax(minimum, 1fr)` sizing so hit targets and native grid columns agree.

Firefox verification is blocked by browser startup on this host, independently of the calendar. A standalone
`firefox.launch({ headless: true, timeout: 15000 })` attempt cannot open even a blank page. It reports
`sandbox_extension_issue_file_to_process ... Operation not permitted` and
`RenderCompositorSWGL failed mapping default framebuffer, no dt`, then times out. The attempted Firefox suite was
interrupted during browser launch; no Firefox scenario passed or failed on application behavior. M6's Firefox gate
remains open, and M7's complete cross-browser acceptance is not claimed.

Implementation boundaries: `runtime/model` contains pure coordinates, extents and visibility;
`runtime/data` owns immutable cached buckets, request generations and preparation;
`runtime/viewport` arbitrates logical intent; `runtime/browser` observes native input and commits scrolling;
`runtime/react` adapts public props and renders the committed snapshot. Tested lane preparation, event-shell
presentation and consumer callback lifecycles are reused while obsolete viewport coordination is replaced.

Logs: `/tmp/quno-runtime-rewrite/`. Latest evidence uses `verified-*`, `row-filter-recheck.log`,
`memo-profile.log`, `benchmark-comparison.log`, `handoff-*` logs, and `firefox-launch.log`.
Performance runs are isolated from our builds and browser suites because concurrent work makes the scaling ratio
noisy. Other applications remained active during the local production comparison; this limitation is disclosed
in its report. Intermediate concurrent failures are retained in logs rather than used as the performance result.

## Budgets and boundaries

At 50 resources and 20,000 events/year: retain existing DOM limits, 120 cached dates, p95 scripting plus layout
below 10 ms, no task above 50 ms, and 10x layout input below 25x runtime. JavaScript remains at most 50 KiB gzip;
optional CSS remains at most 2 KiB. Five-date overscan per side and two-resource overscan per side remain bounded.
The latest production comparison meets the 10 ms target for both scroll and zoom orientations. It addresses the
initial horizontal regressions and vertical zoom budget overrun. The measured vertical scroll p95 increase against
the initial rewrite remains a profiling follow-up alongside the unavailable Firefox check; a uniform speedup and
complete cross-browser acceptance are not claimed.
Public imports continue through `@quno/calendar/infinite-calendar`; no runtime-selection prop is added.

## Coverage migration

The old private-hook suites were replaced when their production modules were removed. Their public behaviors are
covered by the engine and public entry-point suites:

| Retired implementation coverage                | Replacement                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Date cache, request loader, membership index   | `runtime/repository`, `runtime/loading`, `runtime/data`, `runtime/preparation`; public projection tests                 |
| Draft source and prepared-date cache           | `runtime/preparation`: create/edit source handling, multi-participant membership, 119 untouched dates                   |
| Resource and date virtualizers                 | `runtime/geometry`, `runtime/columns`, `runtime/viewport`; loading-window and seeded browser scenarios                  |
| Data-layout, row navigation and parent anchors | `runtime/anchors`, `runtime/navigation`, `runtime/viewport`; row-filter, editor, external-save browser scenarios        |
| Wheel coordinators and zoom preparation        | `runtime/wheel`, `runtime/zoom`, `runtime/preparation`; horizontal/vertical frame sampling and detail visibility suites |
| Mounted hit targets                            | `runtime/hit`: owned viewport, chrome rejection and model projection; public drag/create browser coverage               |
| Recenter timers                                | `runtime/viewport` ownership/expiry/recenter invariants; public edge scrolling and idle position assertions             |

Pure horizontal/vertical shell geometry tests remain. The old nine-item premeasurement fallback and TanStack callback
identity assertions are retired because the replacement has complete mathematical geometry before measurement.
The public API guards, React component tests, lane algorithms and all pre-existing Chromium scenarios remain.
