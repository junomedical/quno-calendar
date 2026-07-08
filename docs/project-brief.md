# Infinite Calendar PoC Project Brief

## Goal

Create a reusable React calendar component that can host multiple views. The first implemented view is an infinite vertical timeline where dates flow from top to bottom and selected calendars render as rows inside each date.

## Success Criteria

- Dates can be reached by vertical virtual scrolling into past and future ranges.
- Row and date labels stay fixed on the left while the timeline scrolls horizontally.
- Events are positioned on a horizontal time axis and rendered through a caller-provided component.
- Events can belong to multiple calendars, with one visible instance per matching selected row.
- Availability can render as a full-row background event layer without affecting overlap height.
- Availability editing mode can make availability the active draggable/creatable layer while events become inactive background context.
- Zoom can be changed with explicit controls or `Shift` + wheel over the calendar.
- Drag-and-drop supports moving events to another time or calendar, with parent-side validation.
- Drawing on empty calendar space starts a new event draft and calls the parent creation callback.
- The demo shows dataset scales from 100 to 20,000 events per year.
- Deterministic demo data is spread across all demo calendars so large scales exercise the full row set.
- The demo sidebar reports lightweight rendering stats: average frame redraw time, visible event DOM nodes, and total rendered calendar DOM nodes.
- Tests cover the core math, rendering contract, and browser interactions.

## Out of Scope for PoC

- Recurring events.
- Timezone selection UI.
- Server persistence.
- Accessibility polish beyond basic semantic controls and labels.
- Production packaging and publishing.
