# Refactor Plan

## Goal
Keep reusable calendar modules small enough to read in one pass, with most files targeting 100-200 lines. Some render-only components can briefly exceed that range when their prop contract is explicit, but orchestration files should keep shrinking toward the target.

## Completed Split
- `src/lib/infinite/InfiniteTimelineView.tsx`: top-level orchestration for selected calendars, view state, interactions, and composition.
- `src/lib/infinite/components/InfiniteTimeScaleHeader.tsx`: sticky time header, current-time pin, and tick labels.
- `src/lib/infinite/components/InfiniteTimelineDay.tsx`: virtual day shell, sticky date header, current-time day line, and row composition.
- `src/lib/infinite/components/InfiniteTimelineRow.tsx`: row grid, availability/event/drop-preview shells, hover expansion state mapping.
- `src/lib/infinite/components/EventShell.tsx`: memoized external renderer host and event-shell CSS variables.
- `src/lib/infinite/hooks/useEventRangeLoader.ts`: async visible-range loading cache and local cache updates for accepted moves/creates.
- `src/lib/infinite/hooks/useVirtualTimelineWindow.ts`: bounded virtual date window, scroll recentering, scrollbar reset, visible date keys.
- `src/lib/infinite/hooks/useDayMetrics.ts`: row/day height calculation from loaded committed events.
- `src/lib/infinite/utils/infiniteTimelineUtils.ts`: view settings normalization, zoom bounds, time ticks, grid cadence, event date/request helpers.
- `src/lib/core`, `data`, `date`, `interaction`, `layout`, and `time`: public API, data helpers, date sequencing, interaction math, overlap layout, and time conversion grouped by responsibility.

## Remaining Split Targets
- Extract pointer hit-testing into `useTimelineHitTesting`.
- Extract drag/drop and draft drawing into `useTimelineInteractions`.
- Extract hover lane targeting into `useTimelineHover`.
- Split `InfiniteTimelineRow` into `AvailabilityLayer`, `TimedEventLayer`, and `DragPreviewLayer` if it continues growing.
- Move demo-only rendering stats out of `App.tsx` if the demo shell grows beyond its current role.

## Rules For Future Work
- New behavior should start in a focused helper/hook/component instead of expanding `InfiniteTimelineView.tsx`.
- Async event loading should go through `useEventRangeLoader` or a successor data hook, not direct effects in render components.
- Rendering components should receive already-computed state and callbacks; they should not own virtualization or data loading.
- Pure math/formatting should live in `time.ts`, `layout.ts`, `dateVirtualization.ts`, or `infiniteTimelineUtils.ts`.
