# Loading and late layout

1. The engine computes visible date keys independently of rendered overscan. Empty calendars render geometry immediately.
2. `useRuntimeData` settles viewport dates for 100 ms, applies the consumer prefetch policy and requests missing coverage.
   `loadCalendarIds` defaults to the displayed selection; broader coverage can survive row filtering.
3. `Acquisition` groups contiguous missing dates and tags requests with an ID, generation and abort signal. Useful adjacent
   reads survive small range changes; incompatible resource or distant requests are cancelled.
4. A response is accepted only while its request remains current, even if the loader ignored abort. Empty successful ranges
   create loaded buckets. Retries use two finite backoffs: 250 ms and 1,000 ms. Disposal cancels outstanding ownership.
5. `EventRepository` replaces requested dates, deduplicates IDs, preserves untouched immutable arrays, and evicts by LRU
   beyond 120 dates. A version/loader invalidation clears coverage but retains stale records until replacement arrives.
6. Optional `projectEvents` transforms a read snapshot, including empty rendered dates. Preparation groups participant
   membership, excludes an edited source, and reuses deterministic foreground/background collision layers across zoom.
7. A geometry update captures the user's current semantic position. It rebuilds extents and restores that point unless
   an explicit higher-priority intent owns the viewport. A reply never navigates to the date it originally requested.
8. React renders the resulting revision; the adapter commits its scroll position before paint. Unchanged day geometry and
   external renderer content retain identity.

Draft editing preserves warm dates while also acquiring dates reached by navigation. Removing the last selected draft
participant can retain hidden rows without making them visible or interactive. Cancelling/releasing an editor can then
restore previously loaded rows without a blank intermediate frame.

Accepted moves patch only persistent time/membership fields, not local preview titles or colors. Targeted edits preserve
same-date order and do not create unloaded destination buckets. Appearance IDs are consumed once while requested;
independent timers prevent one event's appearance from prematurely ending another's.

Tests combine ignored aborts, old generations, subset/superset resources, empty ranges, delayed failures, local previews,
late row growth, native scrolling during reads, filtering and editor cancellation.
