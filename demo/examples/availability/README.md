# Availability Editor

Use this when drawing creates availability rather than appointments. The interaction mode changes hit semantics while creation remains parent-owned.

```mermaid
flowchart LR
  Draw["draw in timeline grid"] --> Mode["availability mode"] --> Request["EventCreateRequest"] --> Parent["parent-created availability"]
```

- Primary source: [`AvailabilityEditor.tsx`](./AvailabilityEditor.tsx)
- Public concepts: `interactionMode="availability"`, `onEventCreateRequest`
- Hit-testing remains limited to timeline grid space.
