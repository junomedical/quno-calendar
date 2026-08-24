# Events Domain

## Responsibility

Own event acquisition and transformation from API records into deterministic date/resource layout metrics. The domain maintains bounded cached data, rejects obsolete requests, indexes multi-calendar membership, prepares overlap cells, and exposes row heights or column widths.

```mermaid
flowchart LR
  Visible["Visible date keys"] --> Loader["Prefetch coordinator"]
  Loader --> Cache["Date cache + id index"]
  Cache --> Membership["Calendar membership index"]
  Membership --> Prepared["Prepared overlap cell"]
  Prepared --> Metrics["Row heights / column widths"]
  Metrics --> Views["View composition"]
  Metrics --> Anchors["Late-layout anchor"]
```

See [Async Loading And Layout](../flows/async-loading-and-layout.md) for request, cancellation, cache, and late-height sequences.

## Contracts And Invariants

- The calendar surface renders independently of request latency.
- Abort, generation, and selected-calendar checks reject stale commits.
- One event may belong to multiple calendars without duplicating the cached event record.
- Layout preparation is deterministic and shared by sizing and projection.
- Loading never writes scroll position; it only publishes event snapshots and metrics.

## Source Map

| Source file                                                                                                     | Responsibility                                                                    |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`eventDateKey.ts`](../../src/lib/timeline/infinite/events/eventDateKey.ts)                                     | Normalizes an event start into its cache and layout date bucket.                  |
| [`eventDateCache.ts`](../../src/lib/timeline/infinite/events/loading/eventDateCache.ts)                         | Stores bounded date buckets, event-id lookup, local patches, and LRU eviction.    |
| [`eventRangeCoordinator.ts`](../../src/lib/timeline/infinite/events/loading/eventRangeCoordinator.ts)           | Plans policy-derived load windows and owns freshness, requests, and generations.  |
| [`loadEventRange.ts`](../../src/lib/timeline/infinite/events/loading/loadEventRange.ts)                         | Executes one abort-aware API request with finite retry delays.                    |
| [`useAppearingEvents.ts`](../../src/lib/timeline/infinite/events/loading/useAppearingEvents.ts)                 | Tracks newly published event ids for bounded appearance state.                    |
| [`useEventRangeLoader.ts`](../../src/lib/timeline/infinite/events/loading/useEventRangeLoader.ts)               | Bridges visible date keys to the coordinator and publishes React event snapshots. |
| [`eventMembershipIndex.ts`](../../src/lib/timeline/infinite/events/indexing/eventMembershipIndex.ts)            | Indexes cached events by calendar while preserving multi-calendar semantics.      |
| [`eventIntervals.ts`](../../src/lib/timeline/infinite/events/layout/eventIntervals.ts)                          | Converts events into clipped, sortable timeline intervals.                        |
| [`minHeap.ts`](../../src/lib/timeline/infinite/events/layout/minHeap.ts)                                        | Reuses the earliest available overlap lane in logarithmic time.                   |
| [`preparedCell.ts`](../../src/lib/timeline/infinite/events/layout/preparedCell.ts)                              | Produces the deterministic overlap model shared by sizing and rendering.          |
| [`rowLayout.ts`](../../src/lib/timeline/infinite/events/layout/rowLayout.ts)                                    | Projects a prepared cell into horizontal lanes and row height.                    |
| [`columnLayout.ts`](../../src/lib/timeline/infinite/events/layout/columnLayout.ts)                              | Projects a prepared cell into vertical columns and growth width.                  |
| [`layout.ts`](../../src/lib/timeline/infinite/events/layout/layout.ts)                                          | Exposes the layout-domain facade and compatibility helpers.                       |
| [`activeDrafts.ts`](../../src/lib/timeline/infinite/events/metrics/activeDrafts.ts)                             | Removes the persisted source event while its edit draft is rendered externally.   |
| [`useDayMetrics.ts`](../../src/lib/timeline/infinite/events/metrics/useDayMetrics.ts)                           | Builds horizontal prepared cells and cached resource/day heights.                 |
| [`useRetainedCalendarRows.ts`](../../src/lib/timeline/infinite/events/metrics/useRetainedCalendarRows.ts)       | Retains hidden draft resources until their transient instance is released.        |
| [`useVerticalPreparedColumns.ts`](../../src/lib/timeline/infinite/events/metrics/useVerticalPreparedColumns.ts) | Builds vertical prepared cells, column widths, and lookup functions.              |

## Verification Map

- Unit: cache, request loader, membership, prepared layout, scaling, active draft, and zoom-preparation stability tests.
- Browser: delayed API rendering, external commit/cancel, multi-calendar layout, and late metric growth.
