# Infinite Calendar before/after timing

## Optimized runtime — October 17, 2026

The optimization reduces horizontal scroll p95 CPU by **20.0%** and horizontal zoom by **32.6%** against the initial
rewrite. Scrolling is essentially at main parity; zoom is **17.6% lower than main**. Vertical zoom now meets the
10 ms target. Vertical scrolling has a measured tail-cost tradeoff, detailed below.

Lower is better. CPU is scripting + style recalculation + layout per input step, **not FPS or end-to-end input
latency**. All three columns come from the same new comparison, using sealed production builds and the shared
method below. “Initial rewrite” is the same artifact measured in the historical comparison later in this document.

| Orientation | CPU per step, p95 | Main      | Initial rewrite | Optimized    |
| ----------- | ----------------- | --------- | --------------- | ------------ |
| Horizontal  | Scroll            | 1.598 ms  | 2.014 ms        | **1.611 ms** |
| Horizontal  | Wheel zoom        | 6.102 ms  | 7.458 ms        | **5.030 ms** |
| Vertical    | Scroll            | 6.622 ms  | 3.534 ms        | **4.179 ms** |
| Vertical    | Wheel zoom        | 17.460 ms | 10.111 ms       | **9.112 ms** |

Horizontal scroll is 0.013 ms (+0.8%) above main, within the observed per-run variation; this is parity, not a
claimed speedup over main. The initial rewrite → optimized median CPU costs are horizontal scroll
1.743 → 1.381 ms, horizontal zoom 6.499 → 4.249 ms, vertical scroll 0.498 → 0.145 ms, and vertical zoom
7.586 → 6.602 ms.

**Tradeoff:** vertical scroll p95 rises by 0.645 ms (+18.3%) against the initial rewrite, despite the lower median.
It remains below main and the 10 ms budget. This comparison does not establish the cause of that tail increase;
it remains a profiling follow-up, and the result is not a uniform speedup.

| Orientation | Navigation elapsed, median | Main     | Initial rewrite | Optimized |
| ----------- | -------------------------- | -------- | --------------- | --------- |
| Horizontal  | Uncached                   | 214.4 ms | 179.6 ms        | 171.2 ms  |
| Horizontal  | Cached                     | 49.7 ms  | 22.2 ms         | 21.3 ms   |
| Vertical    | Uncached                   | 218.3 ms | 184.7 ms        | 182.8 ms  |
| Vertical    | Cached                     | 54.5 ms  | 21.7 ms         | 21.4 ms   |

Navigation includes loaded event nodes and three aligned animation frames; uncached navigation includes the fixed
40 ms loader. Only three uncached and 18 cached samples per orientation/version support these medians.
No long tasks above 50 ms were observed during sampled scroll/zoom. Maximum DOM counts remain identical across all
three builds: horizontal/vertical 421/2,234 for scrolling and 400/1,938 for zoom.

### What changed

- React reuses its presentation snapshot when geometry and visible/mounted identities are unchanged, while live
  scroll coordinates still advance in the engine. The horizontal time scale and date formatting are memoized.
- Preparation reuses metric maps, resource indexes, date sequences and stable axis extents. Resource rectangles
  are calculated on demand instead of rebuilding every resource's rectangle during zoom.
- Acknowledged wheel updates consume captured native observations without a redundant post-render DOM read.
  Programmatic commits discard superseded observations; pin-only updates commit the current matching revision.

A separate unminified production trace of 40 horizontal wheel steps records **40 layout operations after versus
75 before**. The 40 redundant layouts attributed to native-position flushes disappear; final commit layouts remain
(40 after, 35 before). These diagnostic counts explain eliminated work; trace durations are not mixed into the
production comparison above. The unchanged DOM counts indicate that reduced repeated work, rather than a smaller
mounted window, delivers these gains.

Infinite Calendar JavaScript is **32,555 B gzip (31.79 KiB)**, up 809 B from the initial rewrite and **23.8% below
main's 42,719 B**. Raw JavaScript is 135,149 B. Optional CSS remains 1,996 B gzip. Public API and overscan limits
are unchanged.

Including TanStack's transitive runtime code, the old library measures **51,727 B gzip (50.51 KiB)** against
**32,555 B (31.79 KiB)** after: **19,172 B saved (18.72 KiB), a 37.1% reduction**. This separate library build uses
both revisions' existing Vite library configurations with only React, React DOM and the JSX runtime external;
TanStack is bundled into the baseline. Gzip uses level 9, matching the size-report script. The rebuilt optimized
JavaScript is byte-identical to the measured package artifact. Optional CSS is unchanged. These measurements
precede the later integration of main's removal of zoom transparency.

### Latest measurement and reproducibility

[Raw samples, per-run statistics and build hashes](./benchmarks/2026-10-17-optimized.json) preserve all **3,006
sampled operations**. Three rounds rotate the version order: initial/optimized/main, optimized/main/initial,
main/initial/optimized. Each orientation/version has 360 scroll, 120 zoom, three uncached-navigation and 18
cached-navigation samples. Hardware, fixture, warmup and CDP measurement are the same as the shared method below.
Our builds and browser suites were stopped; other applications, including an active local server, remained running.
These are local comparative measurements, not hardware-independent guarantees or confidence bounds.

Across the three runs, horizontal scroll p95 ranges are main 1.527–1.626 ms, initial 1.994–2.049 ms, optimized
1.577–1.611 ms. Horizontal zoom ranges are main 5.980–6.224 ms, initial 7.307–7.498 ms, optimized 4.946–5.065 ms.
Vertical scroll ranges are main 6.275–6.622 ms, initial 2.920–3.922 ms, optimized 3.630–4.267 ms;
vertical zoom ranges are main 16.432–17.460 ms, initial 9.830–10.111 ms, optimized 7.991–9.358 ms.

Build and serve the three fixture artifacts following the instructions below, then run:

```sh
QUNO_BEFORE_URL=http://127.0.0.1:5194 \
QUNO_AFTER_URL=http://127.0.0.1:5195 \
QUNO_REFERENCE_URL=http://127.0.0.1:5192 \
QUNO_COMPARE_ROUNDS=3 \
QUNO_COMPARE_OUTPUT=/tmp/quno-calendar-optimized-comparison.json \
node scripts/profile-calendar-comparison.mjs
```

Here `before` is the initial rewrite, `after` is the optimized runtime and `reference` is main. The optional reference
URL enables three-version rotation; omit it for the original two-version alternating comparison. Both rewrite
artifacts come from uncommitted working-tree states; hashes identify the measured artifacts, not reproducible Git
revisions. The retained raw records preserve the original artifact identity.

## Historical initial rewrite comparison

Measured October 17, 2026. The rewrite improves vertical rendering and navigation, but increases the p95 cost of
horizontal scrolling and zooming. It is not a uniform speedup. These were the initial measurements, before the optimization above; they do not describe the final runtime.

### Initial results

Lower is better. CPU means scripting + style recalculation + layout per input step; navigation measures elapsed
time until the target date is aligned and contains loaded event nodes for three consecutive animation frames.
These are different units of work and should not be compared with each other.

| Orientation | Measurement                 | Before    | After     | Change |
| ----------- | --------------------------- | --------- | --------- | ------ |
| Horizontal  | Scroll CPU, p95             | 1.63 ms   | 2.01 ms   | +22.9% |
| Horizontal  | Wheel zoom CPU, p95         | 6.11 ms   | 7.70 ms   | +26.0% |
| Horizontal  | Uncached navigation, median | 219.90 ms | 178.70 ms | -18.7% |
| Horizontal  | Cached navigation, median   | 50.40 ms  | 21.80 ms  | -56.7% |
| Vertical    | Scroll CPU, p95             | 5.97 ms   | 4.27 ms   | -28.5% |
| Vertical    | Wheel zoom CPU, p95         | 17.34 ms  | 10.30 ms  | -40.6% |
| Vertical    | Uncached navigation, median | 221.50 ms | 180.90 ms | -18.3% |
| Vertical    | Cached navigation, median   | 54.50 ms  | 21.20 ms  | -61.1% |

Vertical zoom p95 remains slightly above the rewrite’s 10 ms runtime target at 10.299 ms; both scroll profiles
are below the target. This remains a performance follow-up alongside the horizontal regressions.

The median CPU costs are also useful: horizontal scroll **1.398 → 1.101 ms**, horizontal zoom **5.452 → 6.740 ms**,
vertical scroll **3.094 → 0.516 ms**, and vertical zoom **13.585 → 7.585 ms**. Horizontal scrolling improves at the
median while its p95 regresses. No observed long task exceeded 50 ms in either build during scroll/zoom sampling.
Maximum DOM counts match: 421 horizontal/2,234 vertical during scrolling, 400/1,938 during zoom. The vertical gains
occur with unchanged maximum mounted node counts.

Infinite Calendar library JavaScript falls from **42,719 to 31,746 bytes gzip**, a **25.7% reduction**
(41.72 → 31.00 KiB). Raw JavaScript falls from 178,583 to 131,828 bytes. Optional CSS remains 1,996 bytes gzip.
React stays external in both package measurements; the old build also excluded its TanStack dependency, which the
new engine no longer needs. These package sizes exclude the fixture and React runtime bundled into the benchmark page.

### Shared timing method

- Before: main commit `3138b28d0a25f2c0e1c2f1781ce0366c405dbb67`. After: the uncommitted
  `fix/infinite-calendar-runtime-rewrite` working tree measured on the date above. Raw data records build hashes.
- Identical production Vite builds of `e2e/fixtures/calendar-engine.html` and `.tsx`, using the public entry points,
  React 18.3.1, 50 resources, 20,000 deterministic events across 2026, a fixed 40 ms asynchronous loader,
  initial date October 8, zoom 1.5, a 600 px calendar and a 1280 × 900 browser viewport.
- Apple M4 Pro, arm64, Darwin 27.2.0; headless Chromium 149.0.7827.55; Node 23.10.0 and Vite 7.3.6.
  The baseline initially built under Node 23.6.0; rebuilding under 23.10.0 produced byte-identical artifacts.
- Three rounds, order before/after, after/before, before/after. Each orientation and workload opens a fresh page,
  waits for initial event nodes and warms for 1.5 seconds. The earlier smoke run is excluded.
- Scroll: 120 steps per run, ±43 px vertically and ±17 px horizontally, reversing every 20 steps. Zoom:
  40 Shift-wheel steps per run, deltaY ±100, reversing every eight steps at the same pointer position.
  Both versions end with the same zoom input value. Each step allows three animation frames for processing.
- Chromium CDP `Performance.getMetrics` deltas supply scripting/style/layout time. Sampling includes the identical
  harness overhead. It excludes paint, GPU work, network time and Playwright transport latency; it is **not FPS**
  or end-to-end input latency. Long-task observation covers scroll/zoom after warmup, not startup or navigation.
- Navigation uses the public handle through fixture buttons. The first October 8 → November 3 jump is uncached;
  six alternating return jumps are cached. The readiness condition includes DOM alignment, loaded event nodes
  and three stable animation-frame observations; it does not wait for an idle-recenter timer or measure physical display paint.
  Uncached timings include the artificial loader delay and request scheduling.
- P95 uses the nearest-rank value over 360 scroll or 120 zoom samples per orientation/revision. Navigation medians
  have only three uncached or 18 cached samples. Startup, dragging, filtering and arbitrary consumer renderers are
  outside this timing comparison; behavior parity is covered by separate tests.

The benchmark ran without concurrent builds or our browser suites. Other applications, including a heavily active
local server, remained running. Alternating order reduces directional bias but does not eliminate host contention.
Treat the figures as local comparative evidence, not hardware-independent guarantees or statistical confidence bounds.

### Initial comparison repeatability

[Raw samples and per-run statistics](./benchmarks/2026-10-17.json) include environment details, artifact hashes,
all 2,004 sampled operations, and the median/p95 of each run. The scroll p95 ranges across runs were:
horizontal before 1.577–1.648 ms / after 1.995–2.007 ms; vertical before 4.722–6.447 ms / after 3.934–4.283 ms.
Zoom p95 ranges were: horizontal before 5.999–6.114 ms / after 7.687–7.813 ms; vertical before
16.119–17.382 ms / after 9.829–10.299 ms.

1. Create an isolated checkout/archive of the baseline and install its locked dependencies. Copy the current
   `e2e/fixtures/calendar-engine.html` and `.tsx` into it unchanged. Their source is the same in both builds;
   the TSX SHA-256 is `e3f03423cbfda9d5eba2145429f10e0e6993ebaf10c4f0d69a5f6d626954fd9f`.
2. For each checkout, create a temporary Vite config that imports its existing `vite.config.ts`, keeps its aliases
   and plugins, sets `root` to the checkout's real absolute path, and replaces `build` with
   `{ outDir: absoluteOutputDirectory, emptyOutDir: true, rollupOptions: { input: absoluteFixtureHtmlPath } }`.
   Build it with `npx vite build --config absoluteTemporaryConfigPath`. Use canonical paths on macOS (`/private/tmp`
   rather than a symlinked `/tmp` root). This leaves generated package `dist` assets untouched.
3. Serve the two output directories on separate local ports, preserving `/e2e/fixtures/calendar-engine.html`.
4. From the current repository, run:

```sh
QUNO_BEFORE_URL=http://127.0.0.1:5192 \
QUNO_AFTER_URL=http://127.0.0.1:5193 \
QUNO_COMPARE_ROUNDS=3 \
QUNO_COMPARE_OUTPUT=/tmp/quno-calendar-comparison.json \
node scripts/profile-calendar-comparison.mjs
```

See the [rewrite verification record](./runtime-rewrite.md) for functional coverage and the outstanding Firefox
startup blocker. The latest optimization above addresses the horizontal regressions; Firefox acceptance remains open.
