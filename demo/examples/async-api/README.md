# Delayed Async API

Use this to verify that slow or obsolete event requests never block calendar chrome, scrolling, navigation, or zoom. Late overlap may change row height or column width; semantic anchoring keeps the requested date/resource/time in focus.

```mermaid
sequenceDiagram
  participant User
  participant Grid
  participant Loader
  participant Anchor
  User->>Grid: jump to unloaded date/time
  Grid->>Grid: render dates and resources immediately
  Grid->>Loader: load visible range with AbortSignal
  Loader-->>Grid: dense events arrive later
  Grid->>Anchor: metrics changed
  Anchor->>Grid: preserve semantic date/resource/time
```

- Primary source: [`AsyncApiCalendar.tsx`](./AsyncApiCalendar.tsx)
- Fixture loader: [`asyncExampleData.ts`](./asyncExampleData.ts)
- Latency adapter: [`../shared/withSimulatedLatency.ts`](../shared/withSimulatedLatency.ts)
- Query parameters: `?latency=3000` changes delay; `?view=vertical` changes orientation.
- Detailed runtime flow: [`../../../docs/flows/async-loading-and-layout.md`](../../../docs/flows/async-loading-and-layout.md)
