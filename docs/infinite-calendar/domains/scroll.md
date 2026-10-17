# Scroll and virtualization

`runtime/model/extents.ts` builds finite half-open extents and searches them without DOM measurement.
`dates.ts` builds the bounded date sequence. `window.ts` selects visible/overscan dates and resources plus pins.
`runtime/viewport/CalendarEngine.ts` owns the logical viewport and one geometry revision.
`runtime/browser/ViewportAdapter.ts` is the sole programmatic scroll writer.

Native scroll events capture their current coordinates immediately; publication of those observations coalesces to a display frame; pending observations flush before layout changes. React renders
the committed geometry before the adapter applies its scroll position. Stale revision commits are ignored. A native
clamp is observed once against the committed spacer. A new manual action cancels eligible pending corrections.

An accepted wheel request consumes pending captured coordinates without a second DOM read after the parent
render; its initial pre-request flush already captured native position. External changes still perform a full
flush. React need not commit for a native scroll that changes neither geometry nor visible/mounted identities.
The live engine always advances, so focus capture and hit testing never use React's retained viewport position.

Settlement uses 1,200 ms ordinarily and 240 ms at an edge. Recenter waits while another intent owns the viewport,
then captures the current semantic position and rebuilds the bounded sequence around it. It does not reuse an offset
captured when a network request began. Wheel input at a hard edge still schedules settlement even if no new native
scroll event occurs.

Verification: `tests/unit/lib/runtime/{geometry,viewport,zoom}.test.ts`, Chromium scrolling/loading/filtering scenarios,
and seeded mixed-action coverage. Firefox and WebKit exercise the same windows, zoom and recenter boundaries.
