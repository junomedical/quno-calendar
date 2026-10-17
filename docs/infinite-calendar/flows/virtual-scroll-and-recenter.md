# Native scrolling, navigation and recenter

A finite sequence extends one month before and after its center date, excluding configured weekdays. Prefix extents
represent each date and resource. Binary searches select visible intervals, five overscan dates per side and two
overscan resources per side. Pins are deduplicated and do not expand the data-loading range by themselves.

## Native scroll

The browser moves the viewport. The adapter batches observations to a display frame and publishes the latest actual
position. Visible-date changes feed the settled loader. Resource/date rendering uses the same committed geometry;
unchanged sections retain identity. A stable React snapshot skips rendering while geometry and visible/mounted
identities match; the engine's live position still advances. Pending observations flush before a settings, size or
data commit. A programmatic commit discards observations captured against the previous DOM. If only a pin/owner
revision advanced without changing the rendered window, the adapter commits the current matching engine revision.

Manual wheel, pointer, touch and scroll-key intent cancels eligible restoration. A wheel event captured by the zoom
controller does not become a competing scroll intent. Reaching an edge schedules settlement even when further wheel
input produces no scroll event.

## Navigation

Public date requests supersede queued resource navigation. Date/time and resource commands wait for committed parent
selection/settings. Excluded dates normalize to the next included day; an all-excluded configuration has an empty window.
The engine can construct a distant date window directly without waiting for mounted DOM.

Horizontal time navigation places the clock 48 px inside the timeline after sticky labels. Vertical time navigation
places it 48 px below the viewport top. Today uses the supplied/current local clock. Horizontal resource navigation
preserves an already visible row or reveals it below chrome; explicit center alignment follows eventual collision height.
Date-only anchors preserve the other axis. Parent restore options retain their navigation-fallback and manual-cancel rules.

## Settlement

Ordinary scrolling waits 1,200 ms; an edge waits 240 ms. If an explicit intent is active, recenter does not compete.
Otherwise the current date/resource offset becomes a semantic anchor, the bounded sequence moves around that date,
and reprojection preserves the same screen point. The adapter applies the new revision only after its spacer and
sections render. Obsolete revisions cannot overwrite a newer navigation request.

Tests assert screen geometry and logical dates, including exact boundaries, rapid reversals, far navigation, variable
row heights, empty selections, excluded weekdays, fractional zoom and repeated recentering.
