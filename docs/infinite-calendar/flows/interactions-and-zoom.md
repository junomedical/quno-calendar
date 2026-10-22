# Pointer interactions and zoom

The React adapter uses the engine inverse to resolve date, resource and minute. DOM hit testing only rejects points
outside the owning viewport or beneath sticky chrome/overlays. Grid geometry never comes from an independent DOM scan.
The existing pointer lifecycle preserves capture, outside-grid continuation, Escape/cancel and synchronous release.

## Draw, drag and edit

Touch dragging and drawing start after a 350 ms stationary primary-touch hold. Before then, ordinary finger
movement scrolls natively; movement beyond eight pixels, scrolling, cancellation, a second pointer, Escape or blur
cancels the pending hold. Event taps activate; empty-grid taps create nothing. Once held, pointer capture and a
non-passive touchmove listener reserve movement until release. Mouse and pen start immediately.

Drawing stays in its starting date/resource and snaps minutes to cadence. A zero-length range is cancelled. External
draft callbacks retain the preview through handoff; direct create callbacks can return a saved record. Active drafts
remain parent-owned and separate from committed collision metrics.

Dragging remembers movement beyond the four-pixel threshold even when the pointer leaves and returns. Moves coalesce to
a display frame; release flushes final coordinates first. A click activates, a returned drag does nothing, an accepted
move updates cached time/membership, and a rejected move leaves persistence unchanged. Foreground/background editing
mode gates pointer ownership. Transient drafts and previews pin only their relevant resources.

Hover uses resting lane bounds to reach underlying events even when an expanded card overlaps them. Consumer renderer
content retains identity when only shell geometry changes. Draft release and appearance use their existing independent
motion/status lifecycles and respect reduced motion.

A drag's offset is elapsed time from the full event start to the snapped grabbed date/time, including later-day
portions. Each proposal places that point at the snapped target and preserves elapsed duration without display-hour
clamping. Daily previews use the same clipped intervals as committed geometry. Midnight ends are exclusive.
Activation reports the grabbed portion's date; no-op detection compares complete timestamps.

## Controlled zoom

Shift-wheel samples coalesce to one request per frame. The exact time beneath the first pointer remains the anchor
while Shift stays held, including pauses, rejected requests and outward samples at zoom limits. Physical bounds
may temporarily displace it; reversing restores its original screen point when content bounds permit.
Only a parent-accepted zoom changes geometry; ignored requests expire, and a newer external value cancels a queued
wheel request. With `onZoomChange`, capture Shift-wheel before checking whether zoom can change, including at the
0.5/8 limits and for horizontal trackpad deltas. Shift-touch movement suppresses panning without requesting zoom.
Overflow unlocks after 300 ms idle, independently of anchor lifetime. Shift release or unshifted input restores
ordinary scrolling immediately; no gesture-tail delay changes input mode. See Decisions 124 and 162.

External zoom preserves the current clock’s visible screen coordinate in either orientation, preferring the top
visible date. An offscreen clock is brought toward the usable viewport center. When outside displayed hours,
horizontal zoom retains the grid center/origin and vertical zoom retains the top day-board fraction. Successive
values share the same original semantic anchor until scrolling, navigation or resize. Both paths build final extents and rendering windows,
then commit their anchor through the same adapter before paint. No multi-frame scroll retry loop remains.

Wheel capture reads native position before claiming ownership. On acknowledgement of the same request, the layout
phase consumes already captured native observations instead of reading the parent-mutated DOM again. External
changes retain a full flush. Horizontal row/date extents and vertical column extents are reused when their inputs
are unchanged; resource rectangles are projected on demand from those extents and the committed scale.

Labels switch immediately at full opacity and grid cadence follows scale (Decision 116); event and tick nodes remain stable.
Tests sample every animation frame, compare event/tick positions, check layering and clipping, repeat reversals at low
and high zoom, and verify delayed controlled acknowledgements and external takeover.
