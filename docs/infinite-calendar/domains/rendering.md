# Rendering domain

`runtime/react/RuntimeCanvas.tsx` renders the committed engine geometry and date/resource window.
`HorizontalDay.tsx` and `VerticalDay.tsx` place dates and resources at their full-model offsets. Unchanged day geometry
retains identity, allowing the day coordinators to skip work while the viewport moves within their resource window.

`RenderSnapshotReader` prevents React updates for native movement within an unchanged rendered/visible window.
Live position and ownership remain in the engine. Horizontal time-scale chrome is memoized; date labels retain
formatting across zoom while date, locale and formatter are unchanged.

The retained `infinite/rendering` leaves own event shells, independent availability and foreground layers, native
sticky chrome, time labels, hour presentation, hover expansion and consumer content. They receive the same committed
settings and prepared lanes as the model. They neither fetch data nor calculate a competing virtual window.

The vertical time pane is separately memoized so resource-window changes do not rebuild unchanged time ticks.

Event content remains external through `renderEvent`. Stable slots, state attributes and optional component-scoped
CSS remain public contracts. Time labels switch immediately at full opacity under Decision 116, with display-based hiding and no
animation tail. Grid cadence switches from 15 to five minutes above zoom 6. Resource parity uses the full list index even when earlier resources unmount.

Verification covers shell isolation, pure lane geometry, model projection and bounds, plus browser assertions for
layering, clipping, sticky positions, resource identity, visible detail and frame-by-frame zoom continuity.
See [architecture](../architecture.md) and [views](./views.md).
