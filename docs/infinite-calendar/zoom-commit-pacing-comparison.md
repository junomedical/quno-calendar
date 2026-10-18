# Zoom commit pacing comparison

Measured 2026-10-18: candidate `9add7ce` against PR #44 head `d6ac965`. The candidate adds one outstanding controlled zoom request and
next-animation-callback scheduling after DOM/scroll commit. Both builds retain the native-scroll lock and 0.30 step.
[Raw samples and environment](./zoom-commit-pacing-results.json) are committed alongside this report.

Decision 122 subsequently changes sensitivity to 0.20. The measurements below remain a record of the 0.30 builds;
this sensitivity-only adjustment has not been reprofiled.

## Results

| Scenario                  | p95 scripting + style + layout | Change | p95 input → observed DOM commit | Callbacks per run |
| ------------------------- | ------------------------------ | ------ | ------------------------------- | ----------------- |
| Horizontal, 0 ms parent   | 4.885 → 5.238 ms               | +7.2%  | 5.3 → 5.5 ms                    | 40 → 40           |
| Horizontal, 180 ms parent | 25.334 → 15.917 ms             | -37.2% | 195.1 → 377.2 ms                | 64 → 16           |
| Vertical, 0 ms parent     | 8.248 → 7.883 ms               | -4.4%  | 8.2 → 7.8 ms                    | 40 → 40           |
| Vertical, 180 ms parent   | 61.562 → 28.291 ms             | -54.0% | 203.0 → 391.5 ms                | 64 → 16           |

Responsive-parent CPU is measured per wheel sample, allowing three animation callbacks to settle. Delayed-parent CPU
is **total work per eight-sample burst**, not per-frame cost; its larger numbers cannot be compared with the 10 ms
per-update budget. Each delayed run contains eight bursts (64 inputs). Each responsive run contains 40 inputs.

The delayed-parent candidate emits 16 callbacks and produces 16 observed geometry commits per run in both views,
versus 64 callbacks and 61–63 observed commits on the baseline. Every candidate request is observed committed, with
at most one outstanding. Baseline callbacks can be superseded/batched without an individually observed geometry;
its raw `maximumOutstanding` counts unmatched observations and is not a precise count of pending parent timers.
Latency statistics include requests with observed matching DOM geometry only. The candidate's accumulated input
waits for the previous acceptance before starting another parent delay: this explains the higher delayed latency.
No pending input is lost in these runs; both builds end at the same target (5.4 responsive, 3.0 delayed).

Maximum sampled DOM/event counts remain 386/19 horizontal and 1,861/132 vertical. No candidate long tasks above 50 ms
were observed; one baseline vertical run recorded 51 ms. The ≤10% comparative p95 CPU regression gate and <10 ms
absolute CPU target pass in both views, as do the DOM/event and candidate long-task budgets. The PR remains draft as
requested, with Firefox startup still blocked. This follow-up does not claim an overall responsiveness improvement
for slow controlled parents.

The measured candidate's Infinite Calendar JavaScript is 137,195 B raw (133.98 KiB), 33,047 B gzip (32.27 KiB): +2,375 B raw and
+503 B gzip versus `d6ac965`. Optional CSS is unchanged at 10,709 B raw / 2,018 B gzip. Public props and imports are unchanged.

## Method and limitations

Three rounds alternate before/after order, using identical minified production fixtures, 50 resources, 20,000 annual
events, 1280×900 viewport and initial zoom 3. This stays above the horizontal effective-scale floor so physical geometry
can acknowledge each requested logical zoom. A discarded exploratory run starting at 1.5 could not reliably match
callbacks below that floor and is not used here. Normal input uses Playwright wheel delivery; delayed bursts use
synthetic wheel samples separated by animation callbacks and a 180 ms parent timer. These final measurements include
the native-listener task-ordering fix. Earlier measurements of the unfinished
candidate exceeded the vertical 10 ms target; they do not describe this final build. There were no simultaneous
agent tests/builds during the final comparison; other desktop activity was uncontrolled. Results are local timing
observations, not FPS or proof of completed raster/GPU presentation.

Environment: Apple M4 Pro, darwin 27.2.0, Chromium 149.0.7827.55.

The test probe observes geometry mutations after DOM updates, not internal adapter notifications. Unit tests cover
adapter acknowledgment ordering separately. Input latency starts at the first input accumulated into each request
and ends at its matching DOM geometry observation.

## Reproduce

1. Export baseline `d6ac965` and candidate `9add7ce` into separate directories and make dependencies available there. Copy the candidate's
   `e2e/fixtures/calendar-engine.tsx` and `zoomProbe.ts` into that export so both builds use identical instrumentation.
2. Run `scripts/build-zoom-pacing-fixture.mjs` for each root with `QUNO_FIXTURE_ROOT` and distinct
   `QUNO_FIXTURE_OUTPUT` directories. Serve those production directories on ports 5192 and 5193.
3. With other tests/builds stopped, run `node scripts/profile-zoom-commit-pacing.mjs`.
   Override `QUNO_BEFORE_URL`, `QUNO_AFTER_URL`, `QUNO_COMPARE_ROUNDS` or `QUNO_COMPARE_OUTPUT` when needed.
4. Preserve all rounds and disclose any failed gate rather than selecting the fastest run.

## Physical touchpad experiment

A temporary private demo query switch disabled native-scroll suspension while keeping the new coordinator active.
The affected Chrome user retried the original inertial Shift-touchpad gesture and reported **“Gaps return.”**
Commit-aware scheduling alone therefore does not replace the workaround. The final implementation retains
`ZoomScrollLock`; the experimental switch was removed. Ordinary scrolling remains native and resumes after the
existing 300 ms tail. DOM tests alone cannot establish absence of the compositor symptom.

## Verification

559 unit tests and 37 focused WebKit zoom tests pass. The Chromium suite passes 222/223; the pending-update navigation
settling assertion passes three unchanged focused reruns after its one failure. The new delayed/rejected-parent
cases and frame-by-frame geometry checks pass. Firefox cannot launch in this environment; the exact error and full
package/compatibility verification are recorded in the [runtime verification record](./runtime-rewrite.md#commit-aware-zoom-follow-up).
