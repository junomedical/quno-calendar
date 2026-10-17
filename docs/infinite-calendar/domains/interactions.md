# Interactions domain

Pointer input resolves through `runtime/react/useRuntimeHit.ts`: the mounted DOM establishes ownership and
occlusion, then the committed model converts pixels into date, resource and minute. Labels and chrome reject hits.
The retained `infinite/interactions` draft, drag and pointer lifecycle hooks produce proposals and invoke consumer
callbacks. They do not own viewport coordinates or programmatic scrolling.

`runtime/react/useRuntimeZoom.ts` coalesces Shift-wheel samples, retains the first pointer anchor, and requests a
controlled value in a microtask. `runtime/viewport/CalendarEngine.ts` applies actual committed geometry before paint.
External values cancel queued wheel proposals. A delayed parent leaves the existing view intact; unmount drops work.

Gesture ownership outranks navigation, data correction and recentering. Pointer continuation survives leaving the
viewport, release flushes the final position, and consumer cancellation releases the draft. Hover stays participant-local.
The engine window pins the active draft resource without widening API read coverage.

See [interaction flow](../flows/interactions-and-zoom.md), `tests/unit/lib/runtime/wheel.test.tsx`, and the drag,
draft, editor and per-frame zoom browser suites. Public callbacks and external event rendering remain unchanged.
