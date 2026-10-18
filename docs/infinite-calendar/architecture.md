# Quno/Infinite Calendar architecture

The public `QunoInfiniteCalendar` facade selects a horizontal or vertical projection of one viewport engine.
Its API, optional stylesheet, consumer-owned cards/editors, and React/Preact contracts are unchanged.
See [Decision 116-runtime](./decisions.md#116-runtime---one-mathematical-runtime-for-both-orientations) and the
[milestone record](./runtime-rewrite.md) for the replacement and its verification.

## Ownership

| Boundary          | Source                          | Responsibility                                                                              |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| Public facade     | `core/QunoInfiniteCalendar.tsx` | Loading shell, orientation, public handle and participant focus                             |
| Logical model     | `runtime/model`                 | Date sequence, prefix extents, projections/inverses, event targets and windows              |
| Events            | `runtime/data`                  | Immutable date buckets, coverage, request generations and prepared collision layers         |
| Viewport          | `runtime/viewport`              | One geometry revision, logical viewport and competing intent ownership                      |
| Browser           | `runtime/browser`               | Native scroll/size/input observation and the only programmatic scroll writer                |
| React             | `runtime/react`                 | Prop adaptation, committed snapshot rendering, public commands and mathematical hit testing |
| Presentation      | `infinite/rendering`            | Reusable event shells, sticky chrome, scoped styles and consumer rendering                  |
| Pointer lifecycle | `infinite/interactions`         | Frame-bounded drag/draw, threshold tracking, release, cancellation and callbacks            |

Pure model/data code imports no React or DOM. Presentation cannot start requests or write scroll positions.
The framework runtimes stay external. Virtualization is engine-owned and does not require TanStack.

React's `RenderSnapshotReader` keeps its snapshot identity while geometry and visible/mounted identities remain
unchanged. Every native scroll still updates the engine; commands and pointer queries read its live snapshot.
The adapter receives a new React commit when mounted content or geometry changes. See [Decision 117](./decisions.md#117---separate-stable-layout-from-viewport-presentation).

## Coordinate model

Day identity is a timezone-free `IsoDate`; timestamps on events retain their existing local/offset interpretation.
A finite month-before/month-after sequence represents the infinite date axis. Prefix extents give each day and
resource a half-open interval. Binary searches produce visible dates plus five overscan dates per side and visible
resources plus two overscan resources per side. One active anchor date and relevant draft/preview resources may be
pinned. Render overscan does not determine network ranges.

Prepared resource grids and prefix extents are independent of zoom-dependent rectangles. Horizontal zoom reuses
row/date extents; vertical zoom reuses column extents. Resource rectangles are projected on demand for anchors and
event lookup. Resource membership uses indexed lookup, and unchanged preparation retains the whole metric map.
Weak caches retain date sequences and resource grids without linking previous geometry revisions.

The same geometry supplies row/column placement, pointer-to-date/resource/minute conversion, event identity lookup,
visibility and anchor restoration. Horizontal time is `label + gutter + minutes * scale`; vertical time is
`day origin + header + gutter + minutes * scale`. Row heights and column minimum widths come from prepared independent
foreground/background collision layers. Native sticky positioning and clipping remain CSS responsibilities.

A semantic anchor identifies date, resource, time or event/participant, plus a viewport-relative point and affected
axes. Collision-lane indexes are never anchor identities. Reprojection computes the content point under new geometry
and subtracts the retained screen point, then clamps to actual content bounds. Row centering uses a resource fraction
so delayed collision growth remains centered. Date-only restoration leaves the other axis alone.

## Commit and intent model

`CalendarEngine` publishes geometry, viewport and windows together. React renders that revision; `ViewportAdapter`
commits it in a layout effect before paint. The adapter rejects obsolete revisions and observes browser clamping once.
It never retries an old pixel position. Native scroll observations are frame-bounded and flushed before layout changes.

Ownership priority is explicit restoration, gesture, navigation, automatic layout correction, then idle recentering.
Equal-priority requests supersede older ones; cancellation IDs cannot cancel a later owner. Manual intent cancels
eligible owners. Late network data captures the current semantic position at commit time and cannot navigate to an
old request's date. Idle recentering rebuilds the date sequence around the current position, preserving its screen
coordinate. Ordinary settlement waits 1,200 ms; a scrollbar edge uses 240 ms.

`ZoomScrollLock` temporarily applies hidden overflow during captured Shift input and its 300 ms settling tail.
This suspends Chrome's native momentum scrolling while `ViewportAdapter` retains programmatic anchor writes.
The lock restores the original inline overflow declarations/priorities on settlement, observed takeover or unmount;
it does not change render windows or add compositor layers. See Decision 119.

Both wheel projections preserve the nearest time tick beneath the first pointer in a burst. External horizontal
zoom preserves a visible current-time marker, otherwise the grid center or origin. External vertical zoom retains
the visible fraction of the day board. Controlled requests are coalesced to one per frame; external values supersede
queued wheel requests. Pending native scroll is flushed before the wheel claims ownership. External zoom retains
its semantic anchor across successive values to avoid cumulative scroll rounding; movement, resize and navigation
reset it. Time labels switch immediately at full opacity and grid cadence follows the zoom threshold (Decision 116).

## Data and preparation

`EventRepository` publishes immutable date arrays and indexes event IDs. Replacement deduplicates IDs; targeted edits
preserve same-date order and do not manufacture unloaded destination buckets. LRU eviction has a hard 120-date bound.
`Acquisition` tracks date/resource coverage independently of rendering. It keeps useful adjacent reads, cancels
incompatible/distant requests, rejects ignored aborts and obsolete generations, and retries failures only after
250 ms and 1,000 ms. Invalidations retain stale visible records while refreshes settle.

The React loading boundary waits for settled viewport dates, then applies `eventPrefetchPolicy`. `loadCalendarIds`
can retain coverage while displayed resources change. Draft editing retains warm dates and also loads newly visited
dates. Synchronous `projectEvents` runs after persistence and before preparation, including empty rendered dates;
preview titles/colors never leak into accepted persistent moves. Unchanged buckets and day geometry retain identity.

Preparation assigns deterministic collision lanes once per relevant date/resource input. Zoom reuses preparation.
Transient drafts remain separate from committed collision metrics. Event content retains React identity while its
shell geometry changes; unchanged date sections do not repaint merely because native scroll pixels changed.

## Consumer boundaries

The public handle queues resource navigation and restoration until parent layout commits. It supports date/time and
Today navigation, visible date queries, explicit anchors, targeted cache edits, draft release and event focus.
Event capture records the visible participant instance; `requireVisible` cannot fall back to an unrelated slot.
The DOM registry supplies mounted-instance visibility, while the engine supplies logical geometry.

Pointer input uses `elementFromPoint` only to reject overlays/sticky chrome. Date/resource/time comes from the engine
inverse. Captured pointers continue outside the grid; raw movement retains the drag threshold and release flushes the
last coordinates synchronously. Accepted/rejected moves, external editor delegation, draft release motion, independent
availability editing, and callback ownership retain their existing contracts.

The demo HTTP query endpoint, deterministic annual fixture generator and browser session overrides remain outside the
package. The five field guides continue to use public entry points, with heavy exhibits mounted lazily.

Vertical time-axis presentation is memoized independently of the resource window. Horizontal resource scrolling
therefore updates visible columns without rebuilding unchanged time labels.

## Verification

See [shared testing](../shared/testing.md), [runtime flows](./flows/README.md) and [responsibility domains](./domains/README.md).
The replacement keeps the 50 KiB JavaScript/2 KiB CSS gzip budgets, DOM limits, compatibility fixtures and package guards.
No runtime selector or alternate implementation is shipped.
