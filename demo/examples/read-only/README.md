# Read-only Calendar

Use this as the first integration. The parent supplies resources, selected resource ids, a visible-range loader, a renderer, and controlled settings. No mutation callbacks are installed.

```mermaid
flowchart LR
  Range["visible date/resource range"] --> Loader["loadExampleEvents"] --> Root["CalendarRoot"] --> Renderer["ExampleEventCard"]
```

- Primary source: [`ReadOnlyCalendar.tsx`](./ReadOnlyCalendar.tsx)
- Shared fixture and renderer: [`../shared/calendarExampleSupport.tsx`](../shared/calendarExampleSupport.tsx)
- Public concepts: `CalendarRoot`, `LoadEvents`, `eventRenderer`, `settings`
