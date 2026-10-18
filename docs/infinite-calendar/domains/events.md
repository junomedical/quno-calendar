# Event acquisition and preparation

| Module                                          | Responsibility                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `runtime/data/EventRepository.ts`               | Immutable date buckets, ID lookup, deduplicated replacement, targeted mutation, LRU          |
| `runtime/data/Acquisition.ts`                   | Date/resource coverage, abort/generation ownership, bounded retries                          |
| `runtime/data/requests.ts`                      | Prefetch normalization and contiguous request groups                                         |
| `runtime/data/Preparation.ts`                   | Resource membership, draft-source suppression, cached collision metrics and local projection |
| `runtime/react/useRuntimeData.ts`               | Settled viewport loading, public mutation callbacks and appearance status                    |
| `infinite/events/layout`                        | Tested interval clipping, deterministic lane assignment and layer-specific metrics           |
| `infinite/events/loading/useAppearingEvents.ts` | Independent appearance timers and one-time consumption of requested IDs                      |

Visible stale events survive invalidation. A response updates data only if its request still owns the current generation
and covers the required resources. Empty responses establish coverage. Cache eviction always repairs ID lookup and
coverage. The hard limit is 120 date buckets, even if more dates are requested for protection.

`projectEvents` never mutates persistence. Saved moves apply proposed time/membership to the cached record, preserving
its saved metadata. Foreground and background availability have independent collision lanes. Both orientation metrics
come from the deeper layer; zoom does not recompute membership or collision assignment. Only changed dates invalidate
prepared metrics, and unchanged geometry retains identity across data commits. The complete metric map retains
identity when every date metric matches, so a zoom-only update also reuses the indexed resource grid.

See [loading flow](../flows/async-loading-and-layout.md) and the repository/loading/preparation tests under
`tests/unit/lib/runtime`.
