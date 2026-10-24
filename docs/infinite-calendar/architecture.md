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
A finite month-before/month-after sequence represents the infinite date axis by default. Optional
settings.dateWindowRadius instead counts included dates on each side; the sequence cache keys that setting alongside
the anchor and excluded weekdays. Prefix extents give each day and
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
These layout flushes use captured observations; they never reinterpret a superseded DOM position as current input.
The optional stylesheet disables native scroll anchoring so the engine owns semantic corrections.

Ownership priority is explicit restoration, gesture, navigation, automatic layout correction, then idle recentering.
Equal-priority requests supersede older ones; cancellation IDs cannot cancel a later owner. Manual intent cancels
eligible owners. Late network data captures the current semantic position at commit time and cannot navigate to an
old request's date. Idle recentering rebuilds the date sequence around the current position, preserving its screen
coordinate. Ordinary settlement waits 1,200 ms; a scrollbar edge uses 240 ms.

`ZoomScrollLock` temporarily applies hidden overflow during captured Shift input. The wheel handler reads the current
Shift modifier on every sample (Decision 124), without momentum detection or a latched gesture mode. Shift keyup
releases overflow immediately; the next unshifted sample cancels queued zoom and scrolls. If keyup was missed and
overflow was still hidden during hit testing, the adapter delivers that first delta once with default action
prevented. Further samples are native. Window blur cancels zoom, and cleanup removes the global listeners.
The 300 ms idle overflow unlock is housekeeping; the first Shift time anchor survives idle pauses until input takeover.
This suspends Chrome's native momentum scrolling while `ViewportAdapter` retains programmatic anchor writes.
The lock restores the original inline overflow declarations/priorities on settlement, observed takeover or unmount;
it does not change render windows or add compositor layers. See Decision 119. Wheel takeover classification waits
until the next task, after all native listeners can cancel the event. A microtask is insufficient because browsers
can run one between capture and bubble listeners, incorrectly cancelling captured Shift input.

Both wheel projections preserve the exact time and screen point beneath the first Shift pointer, across pauses
and bounds. `ZoomInputAnchor` owns that input lifetime independently of request timeout, rejected requests and
overflow unlock. `ZoomAnchors` also retains a cancelled request’s focus for an immediate parent-clamped acknowledgement inside
its requested interval and original expiry. Unrelated external values still take over. Both external projections
preserve the focused current clock, centering it if offscreen; clocks
outside displayed hours retain the grid center/origin or vertical day fraction fallback. See Decision 162. `ZoomCommitCoordinator` allows one unexpired controlled request at a time. It accumulates newer samples into one
bounded target and waits for `ViewportAdapter.subscribeCommit` after current DOM geometry and scroll correction.
A matching engine value alone does not acknowledge the request. The next accumulated target is scheduled on the next
animation callback; this does not certify GPU presentation. External values and viewport takeovers cancel queued work.
An unacknowledged request expires after one second without retry; fresh input uses the actual controlled value.
The engine records each revision's reason so manual movement is distinguished from an adapter clamp observation.
See Decision 121. Pending native scroll is flushed before the wheel claims ownership. External zoom retains
its semantic anchor across successive values to avoid cumulative scroll rounding; movement, resize and navigation
reset it. Time labels switch immediately at full opacity and grid cadence follows the zoom threshold (Decision 116).

## Data and preparation

`EventRepository` publishes immutable retained-date arrays referencing complete events, with canonical ID lookup.
Replacement deduplicates IDs and indexes every overlapping retained date. Targeted edits/moves/removal update all
retained instances, preserve unchanged ordering/snapshots and never expand the complete event span. LRU eviction
has a hard 120-date bound; removing one date keeps events referenced by another. Loaders return overlap queries.
`Acquisition` tracks date/resource coverage independently of rendering. It keeps useful adjacent reads, cancels
incompatible/distant requests, rejects ignored aborts and obsolete generations, and retries failures only after
250 ms and 1,000 ms. Invalidations retain stale visible records while refreshes settle.

`useViewportPrefetch` subscribes to the live engine and applies `eventPrefetchPolicy` against its logical date extents.
The default buffer extends one usable viewport height on either side; explicit day policies remain available.
Each positive side includes at least the immediately adjacent included date, even when the pixel window stays
inside one tall day. Zero disables that side's adjacent-day minimum.
Changed requested-date keys settle for 100 ms before acquisition. Buffer-only changes are observed even when the
visible date and React rendering window remain unchanged. `loadCalendarIds`
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

Daily `CalendarEventSegment` intervals are prepared with each date/resource and shared by both projections and
transient rectangles. Renderer events remain complete records. Pointer offsets use elapsed time from the complete
start to the grabbed local date/time; proposals retain the original elapsed duration without display-hour clamping.
Mounted event registrations and captured anchors include segment date and participant identity. See Decision 160.

`TouchHoldGesture` gates pointer starts before the shared drag/draft lifecycle. Pending primary touches permit
native panning; an activated hold captures the saved target and reserves touch movement. Its timer and native
listeners are scoped to one touch and removed on completion, cancellation or unmount. Presentation shells retain
ordinary touch behavior; consumer card content and existing permission gates stay separate. See Decision 163.

Layout changes flush captured native scroll observations rather than rereading a potentially superseded DOM
position. This preserves the engine’s semantic date through row changes and idle date-window recentering.
See [Decision 166](./decisions.md#166---ignore-uncommitted-dom-positions-during-layout-changes).
