# React composition

`core/QunoInfiniteCalendar.tsx` retains the public loading shell, handles and focus coordination.
`runtime/react/RuntimeView.tsx` selects an orientation and composes `useRuntimeView` with `RuntimeCanvas`.

`useEngine` subscribes to the engine, commits layout inputs, attaches native observations and applies the latest
revision before paint. `useRuntimeView` adapts selection, data projection, preparation, gestures and pinned resources.
`RuntimeCanvas`, `HorizontalDay` and `VerticalDay` consume the geometry/window snapshot. Resource identity and settings
come from the same revision; a parent resource change cannot mix new resource indexes with old extents.

`dayPresentation.ts` avoids repainting a day when its immutable geometry, resource window and presentation are unchanged.
Event callbacks still resolve current consumer callbacks. No view owns a second date window or a separate scroll model.
The private dual-runtime build selector exists only during development and is removed at cutover.
