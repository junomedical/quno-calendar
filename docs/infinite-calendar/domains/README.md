# Runtime responsibility domains

The source is organized by ownership; the [flows](../flows/README.md) describe execution order.

| Domain                            | Owns                                                               | Boundary                                |
| --------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| [Foundation](./foundation.md)     | Public facade/types, dates, clocks, membership and focus callbacks | No viewport writes                      |
| [Scroll](./scroll.md)             | Geometry revisions, windows, native observations and commits       | No event fetching                       |
| [Events](./events.md)             | Request generations, immutable cache and deterministic preparation | No navigation                           |
| [Anchors](./anchors.md)           | Semantic targets, projection and intent priority                   | No collision-lane identity              |
| [Interactions](./interactions.md) | Pointer lifecycle and controlled zoom requests                     | Parent owns accepted settings/mutations |
| [Rendering](./rendering.md)       | Sticky chrome, event layers and external card content              | No requests or scroll writes            |
| [Views](./views.md)               | React adapters connecting the engine to public props               | No independent geometry authority       |

`runtime/model` and `runtime/data` are framework-independent. `runtime/viewport` depends on that model;
`runtime/browser` translates native observations and commits; `runtime/react` composes them with tested presentation
and callback lifecycles. Both orientations share the same engine. See the [architecture](../architecture.md).
