# Async Loading And Layout

The event API is additive to the calendar surface. Dates, resources, scrolling, hit-testing, zoom, and drafts render from settings, virtualization state, and the last accepted cache snapshot. None of them waits for `loadEvents`.

Consumers can supply `loadingFallback` and control `isLoading` during startup. With an initially empty selection,
the view waits for resource context before mounting. Once selected rows exist, the timeline measures and loads events
beneath a hidden surface; the fallback occupies the same viewport. Clearing loading reveals the mounted view, and
the consumer can center its initial date through the navigation handle. The loader itself does not infer readiness
or replace consumer error handling, and ordinary refreshes can retain the visible grid. The shell applies component
size/flex constraints before metadata exists; the timeline fills it after mounting. Percentage dimensions are applied
once, and minimum sizing reserves space even in an auto-height parent.

## End-To-End Delayed Load

```mermaid
sequenceDiagram
  actor User
  participant View as Calendar viewport
  participant Window as Virtual date window
  participant Hook as Range loader hook
  participant Coordinator as Range coordinator
  participant API as Async API
  participant Cache as Date/event cache
  participant Layout as Prepared-cell engine
  participant Measure as Day measurement bridge

  User->>View: Navigate or scroll to date D
  View->>Window: Render D from base/known date geometry
  Window-->>Hook: Settled viewport date keys
  Hook->>Hook: Apply prefetch policy to build warm window
  Hook->>Coordinator: Update load dates; ask for missing ranges
  Coordinator-->>Hook: Contiguous keys not loaded or already loading
  Hook->>Coordinator: Begin each missing range in current generation
  Hook->>API: loadEvents(missing range, calendarIds, signal)
  Note over View,API: Grid, labels, zoom, hit-testing, drag, and draft creation remain live
  API-->>Hook: Events resolve later
  Hook->>Coordinator: Accept only if request is current
  alt Aborted, obsolete generation, or no rendered change
    Coordinator-->>Hook: Ignore snapshot commit
  else Current response changes cache
    Coordinator->>Cache: Replace requested buckets, deduplicate, touch, and trim
    Cache-->>Coordinator: Accepted bounded snapshot
    Hook->>Hook: startTransition(setEventsByDate)
    Hook-->>Layout: Revised date events after optional display projection
    Layout->>Layout: Membership, intervals, overlap lanes, row metrics
    Layout-->>View: Event shells and revised row/day heights
    View->>Measure: Resize affected virtual dates
    Measure->>View: Restore semantic date/resource focus when required
  end
```

Render overscan and offscreen restore pins do not define the API window. Viewport intersections settle for 100 ms before requesting dates. Apply prefetch only after this separation. Optional `loadCalendarIds` keeps provider read coverage independent of displayed rows; its default remains the selected IDs.

The response is indexed into the bounded cache before it becomes React state. Prepared-cell layout then reads the committed snapshot; React rendering does not coordinate requests or mutate the cache.

While a controlled draft is active, participant filtering may make horizontal days shorter and expose more virtual
date nodes. Event loading retains the last non-draft warm window instead of treating that geometry-only expansion as
new navigation, then unions policy windows around the draft date and the explicit virtual-window anchor. A genuinely moved draft
or viewport navigation still loads its destination without prefetching a transient extra date at the lower edge.

## Display Projection

Optional synchronous `projectEvents` receives persisted events and the inclusive rendered date window before layout.
It can replace an edited series and add local previews on empty dates. Both orientations index the result with the
existing event start-date semantics; returned events outside rendered dates are ignored. The callback must not mutate
cached records. Unchanged date buckets retain their preparation identity.

Changing or clearing this callback never invalidates the range coordinator or writes previews to the persisted cache.
Clearing it restores the cached events immediately. Recurrence expansion remains consumer-owned. Actual navigation
can still prefetch newly visible dates; saves and filters keep their existing loader/version invalidation. Accepted
move patches first look up the persisted record by id and apply only proposed timestamps and participant geometry.
Projected display metadata and projection-only ids never enter the cache through that path.

## Date Request State

Loaded knowledge and rendered cache content are deliberately different concepts. Invalidating knowledge makes a date eligible for refresh; it does not erase the cached bucket that is currently on screen. Each loaded date also records the calendar ids covered by its accepted response. A selected subset remains fresh when that coverage contains every requested calendar id.

```mermaid
stateDiagram-v2
  [*] --> Missing
  Missing --> Loading: warm-window date enters a request
  Loading --> Loaded: current response accepted
  Loading --> RetryWait: request fails and retries remain
  RetryWait --> Loading: 250 ms or 1 s delay completes
  RetryWait --> Missing: aborted while waiting
  Loading --> Missing: rejected after final retry
  Loading --> Missing: viewport leaves every requested date
  Loaded --> Loaded: selection narrows within accepted calendar coverage
  Loaded --> StaleVisible: loader or eventVersion changes
  Loaded --> Loading: selection requires an uncovered calendar id
  StaleVisible --> Loading: warm-window date refresh begins
  Loading --> Loading: obsolete response ignored by generation check
  Loaded --> Missing: bucket evicted outside protected load dates
  StaleVisible --> Missing: stale bucket later evicted
```

`StaleVisible` means the old bucket is still rendered while the date is no longer considered freshly loaded.

## Request And Cancellation Decision

```mermaid
flowchart TD
  Visible["Settled viewport date keys changed"] --> Policy["Derive before/after warm window"]
  Policy --> Update["Touch warm-window cache dates"]
  Update --> Active{"Does an active request overlap the warm window?"}
  Active -->|No| Abort["Abort and release its loading keys"]
  Active -->|Yes| Keep["Keep request alive"]
  Abort --> Diff
  Keep --> Diff["Diff warm-window keys against loaded + loading sets"]
  Diff --> Range{"Any date missing selected-calendar coverage?"}
  Range -->|No| Done["Render current snapshot"]
  Range -->|Yes| Begin["Capture request id + generation + key set"]
  Begin --> Fetch["Call loader with AbortSignal"]
  Fetch --> Result{"Result"}
  Result -->|Abort| Release["Release loading keys; no commit"]
  Result -->|Failure| Retry{"Retries remain?"}
  Retry -->|Yes| Wait["Abort-aware delay"]
  Wait --> Fetch
  Retry -->|No| Release
  Result -->|Success| Current{"Signal live + generation current + request registered?"}
  Current -->|No| Release
  Current -->|Yes| Commit["Commit cache transaction"]
```

Cancellation is an optimization and a resource boundary, not the correctness boundary. The generation and request-registration checks reject stale results even when an API client ignores `signal`.

## Cache Commit Transaction

```mermaid
flowchart LR
  Response["Accepted event array"] --> Requested["Requested date-key set"]
  Requested --> Clear["Replace each requested bucket with an empty bucket"]
  Response --> Dedupe["Deduplicate response globally by event id"]
  Clear --> Upsert["Upsert unique events by their local date key"]
  Dedupe --> Upsert
  Upsert --> Repair["Repair event-id to date index"]
  Repair --> Loaded["Mark requested dates loaded"]
  Loaded --> Protect["Touch warm-window dates"]
  Protect --> Trim["Trim LRU to 120 date buckets"]
  Trim --> Snapshot["Reuse unchanged immutable bucket arrays"]
```

Empty requested buckets are meaningful: a successful empty response records that those dates are loaded. A failed or aborted response never replaces the rendered buckets with emptiness.

Targeted moves and visible commits take a shorter path:

```mermaid
flowchart LR
  Mutation["Accepted move/create/save"] --> Id["Find old bucket through event-id index"]
  Id --> Remove["Remove old id or previous temporary id"]
  Remove --> Destination{"Destination date already cached?"}
  Destination -->|Yes| Insert["Upsert destination bucket"]
  Destination -->|No| Stop["Do not create an unobserved visible bucket"]
  Insert --> Snapshot["Publish revised cache record"]
```

## Late Events That Increase Horizontal Height

Before the API resolves, an unloaded horizontal date uses compact base row heights. After loaded overlaps are prepared,
dense foreground or explicitly background-layered availability collisions may grow only their date/resource row.
The two layers are prepared independently and sizing uses their maximum depth; draft and drag-preview overlays do not
contribute lanes.

### What Stays In Focus?

The calendar preserves the semantic location that was visible before the metric commit. It does not focus the first newly loaded event.

Capture the anchor before resizing any date. Offscreen overlap growth can exceed the old scroll area's maximum;
an immediate scroll correction would be clamped into the growing date. Carry the anchor through a synchronous layout
projection that commits the revised spacer. Restore from that anchor, publish the corrected virtual range and project
it again before paint. Do not capture a replacement anchor from the temporary clamped offset. Height reductions follow
the same path. Unchanged height snapshots do not need these extra projections. Explicit navigation and restores retain
priority, and pending reads do not retain a focus target from when the request started.

Refresh the resource viewport snapshot synchronously after the correction. Its ordinary scroll reader runs on the next
animation frame; leaving its old absolute offset in place can unmount the displayed row for one frame after a large
correction, even when the date range is already correct. Normal manual-scroll reads remain frame-coalesced.

```mermaid
flowchart TD
  Commit["Late events revise row/day heights"] --> Owner{"Higher-priority owner active?"}
  Owner -->|Parent restore| Parent["Let explicit event/slot geometry restore own scroll"]
  Owner -->|Draw or drag| Interaction["Keep mounted gesture target; defer idle recenter"]
  Owner -->|No| Snapshot{"Where is the visible point?"}
  Snapshot -->|Date header or fallback| Date["Capture dateKey + offsetWithinDate"]
  Snapshot -->|Calendar row| Resource["Capture dateKey + calendarId + offsetWithinRow + fallback offset"]
  Date --> Resize["Apply revised date sizes"]
  Resource --> Resize
  Resize --> Resolve{"Can the same resource row be resolved?"}
  Resolve -->|Yes| RowTarget["Translate through new row prefix extents"]
  Resolve -->|No| DateTarget["Use fallback date-local offset and clamp"]
  RowTarget --> Restore["Restore before paint"]
  DateTarget --> Restore
```

Concrete cases:

| Situation                                | Preserved visual focus                             | Growth direction                                                            |
| ---------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `scrollToDate(D)` while D is unloaded    | D’s date header and local date offset              | Dense rows expand below the header.                                         |
| Viewport is inside resource R on D       | D, resource R, and the pixel offset inside R       | Rows above R are compensated; R keeps its local point; later rows move.     |
| The anchored row itself grows            | Its top plus the previous local offset             | The row gains height below its top while the saved local pixel stays fixed. |
| An explicit event/slot restore is active | Its captured viewport-relative point               | The automatic data-layout anchor yields.                                    |
| The anchored resource disappears         | D plus the saved fallback offset, clamped inside D | No unrelated resource is selected as a replacement.                         |
| User starts a new manual scroll          | The user’s new position                            | Scheduled correction is cancelled or superseded.                            |

For horizontal `scrollToDateTime`, vertical focus follows the date/resource policy while the requested time remains on the horizontal time axis.

### Changing the selected row count

Changing `estimateSize` alone does not invalidate virtualizer prefix positions. Capture the semantic anchor before
clearing estimates. Reapply current known day measurements, including overlap heights. Request one layout projection
and carry the anchor through that commit. Expansion can exceed the old scroll spacer and clamp date-offset resolution. Hold the semantic render window during
that transition. Restore in the next layout phase, after the spacer commits, and publish the corrected virtual range
before native scroll observation. Defer these resets while a draft, editor restore or pointer gesture owns focus.

The missing-resource fallback stays inside the new base date height even before event metrics exist. Keep room for
the visible-date resolver's one-pixel probe so the fallback cannot become the following date. Ordinary event refreshes
and drafts with an unchanged row count retain their measurements. Explicit restores and active gestures keep priority.

## Orientation Differences

| Concern                               | Infinite horizontal                                        | Infinite vertical                                                                                                           |
| ------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Time axis                             | X                                                          | Y                                                                                                                           |
| Resource axis inside a date           | Variable-height rows                                       | Variable-width columns                                                                                                      |
| Late overlap metric                   | Can increase row height and total date height              | Can increase column width; date/time height remains determined by settings and zoom                                         |
| Primary scroll focus after event load | Date header or date/resource/local-row offset              | Date/time remains stable because event data does not change day height                                                      |
| Cross-axis identity                   | Calendar row id is restored when horizontal heights change | Calendar column id is the semantic cross-axis identity; this change does not add a separate automatic width-correction pass |
| Foreground availability               | Ordinary event lanes may increase row height               | Ordinary event lanes may increase column width                                                                              |
| Background availability               | Independent mini-lanes may increase row height             | Independent side-by-side lanes may increase column width                                                                    |
| Draft/preview                         | Transient only; no row-height growth                       | Transient only; no column-width growth                                                                                      |

## Runtime Invalidation Matrix

| Trigger                                     | Recomputed or updated                                                                   | Must remain stable                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Visible date keys or prefetch policy change | Warm-window derivation, missing-range diff, request sets, load-window LRU protection    | Existing fresh cache buckets and grid DOM                             |
| Current API response                        | Requested bucket identities, membership/preparation for revised dates, affected metrics | Unchanged bucket arrays, prepared dates, settings, pointer state      |
| `eventVersion` or loader changes            | Request generation and loaded-date/calendar coverage knowledge                          | Rendered stale cache until replacement arrives                        |
| Selected ids change                         | Coverage diff; request only when a selected id is not already covered                   | Covered cache snapshot and rendered event DOM                         |
| Active-draft filtering changes visible keys | Retained settled warm window plus draft/navigation-anchor policy windows                | Loader calls caused only by transient day-height contraction          |
| Accepted move/create/visible commit         | Indexed source/destination buckets and affected cells                                   | Loader call count and unrelated buckets                               |
| Horizontal zoom only                        | Time projection pixels and event-shell geometry                                         | Cache, memberships, overlap lanes, row metrics, external card content |
| Vertical zoom only                          | Time projection pixels and virtual day height                                           | Cache, memberships, overlap lanes, column metrics                     |
| Scroll                                      | Visible snapshot, virtual items, local resource subscribers                             | Event cache and prepared cells                                        |
| Hover                                       | One resource-local rendered instance                                                    | Multi-calendar sibling instances and cache                            |

## Failure And Cancellation Subflows

### Failed loader

The loader retries after 250 ms and 1 second. The last accepted snapshot stays visible during both delays. After the final failure, loading ownership is released so a later visibility change or invalidation may request the date again.

### Never-resolving loader

The calendar surface stays interactive. If the request leaves the active warm window and its adjacent boundary dates, the coordinator aborts it and releases its loading keys. A loader that ignores abort may eventually resolve, but its request is no longer current and cannot commit.

### Out-of-order responses

Every request carries a generation, id, and calendar-id set. Loader or `eventVersion` changes advance the generation and abort registered requests. A read-coverage selection change retains requests that cover the next subset and aborts incompatible ones. An older response fails the current-request predicate before touching rendered state.

### Empty response

A successful empty response writes empty buckets for the requested dates and marks them loaded. It does not alter date/resource geometry because loading UI is not rendered inside rows or columns.

### React transition delay

The cache coordinator may already hold the accepted result while React defers the snapshot transition. Rendering continues from the previous `eventsByDate` object until the transition commits atomically.

## Source Map

- `src/lib/timeline/infinite/events/loading/useEventRangeLoader.ts`: React async boundary and snapshot publication.
- `src/lib/timeline/infinite/events/loading/eventRangeCoordinator.ts`: request generations, loaded/loading knowledge, and request ownership.
- `src/lib/timeline/infinite/events/loading/eventDateCache.ts`: date buckets, event-id index, and LRU.
- `src/lib/timeline/infinite/events/loading/loadEventRange.ts`: retry and abort-aware delay.
- `src/lib/timeline/infinite/events/metrics/useDayMetrics.ts`: horizontal membership, preparation, and row/day metrics.
- `src/lib/timeline/infinite/anchors/data-layout/useHorizontalDayMeasurement.ts`: virtualizer sizing and automatic horizontal data-layout focus.
- `src/lib/timeline/infinite/events/metrics/useVerticalPreparedColumns.ts`: vertical membership, preparation, and width metrics.

The complete ownership map is in the [events domain](../domains/events.md) and
[anchors domain](../domains/anchors.md).
