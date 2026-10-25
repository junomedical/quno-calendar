# Quno/Timepicker decisions

## QTP-001 - Select a standalone timezone-free clock

- Date: 2026-10-06
- Status: Accepted
- Context: Choosing a clock should also be available without mounting a date calendar or supplying a date.
- Decision: Export `QunoTimePicker` from the independent `@quno/calendar/timepicker` subpath with an optional scoped
  stylesheet. Use controlled `value` or uncontrolled `defaultValue`, a separate `HH:mm` string or null, and named
  `onChange({ value })`. Reuse the enabled-hour and minute-cadence semantics of Datepicker's time mode, sticky hour
  headings, no more than six minute buttons per row, selected-slot reveal, and native button activation. Clear emits
  null; disabled prevents selection and Clear. Configuration changes and controlled off-slot clocks are never rounded.
- Consequences: No date, parser, timezone, or virtualizer enters this feature. Labels, a clock formatter, class names,
  stable slots/state attributes, and `--quno-time-picker-*` tokens keep presentation consumer-owned. Shared renderer
  ownership and dependency direction are recorded in QUNO-017; Datepicker retains its date-time interaction contract.

## Shared cadence update — 2026-10-06

[QUNO-018](../shared/decisions.md#quno-018---size-time-rows-by-minute-cadence) extends shared cadence choices with
20-minute steps and chooses time-selector columns by cadence. It supersedes the previous fixed maximum-six-column
layout; existing value, focus, formatting, and typed-clock ownership contracts remain in force.

## Shared enabled-hour default update — 2026-10-06

[QUNO-019](../shared/decisions.md#quno-019---default-omitted-or-empty-enabled-hours-to-all-hours) supersedes the empty-list
restriction: omitted or empty enabled hours now allows all 24 hours, including forced typed-clock validation and spins.
Nonempty lists retain their restrictions; disabled state, cadence, and existing values keep their contracts.

## Shared five-minute row update — 2026-10-06

[QUNO-020](../shared/decisions.md#quno-020---use-six-columns-for-five-minute-cadence) supersedes the five-minute column
count in QUNO-018: both time selectors now use two rows of six minute choices per hour.

## Shared hour emphasis update — 2026-10-06

[QUNO-021](../shared/decisions.md#quno-021---emphasize-hours-above-minute-options) makes sticky hour headings
larger and bold (16px/700), using normal text color beside 13px/550 minutes. Existing geometry and interaction remain.

## QTP-002 - Use regular-weight minute options

- Date: 2026-10-17
- Status: Accepted; supersedes only standalone Timepicker's minute weight in QUNO-021
- Decision: Set `.quno-time-picker-minute-option` to font weight 400 at the existing 13px size. Hour headings retain
  16px/700; Datepicker's independently scoped minute styles retain their existing weight.
- Consequences: Standalone minute options use regular text in every state. Existing desktop/mobile Chromium checks
  assert computed weight alongside selection, geometry, sticky hour headings and keyboard behavior.

## Separate demo configuration — 2026-10-18

[QUNO-026](../shared/decisions.md#quno-026---give-each-product-demo-its-own-json-file) moves this product’s concept
scenarios into its own JSON file. Component contracts and scenario behavior remain unchanged.

[QUNO-027](../shared/decisions.md#quno-027---store-every-scenario-in-its-own-json-file) further separates every scenario
into its own file; the product JSON retains only metadata and ordered references.

[QUNO-028](../shared/decisions.md#quno-028---navigate-demo-screens-with-a-bottom-title-rail) records viewport-sized
scenario sections, JSON explanations, explicit fullscreen, and inert mobile previews shared by the concept demos.

[QUNO-029](../shared/decisions.md#quno-029---preserve-scenario-text-layout-during-scrolling) keeps complete concept explanation layouts mounted and reserves playback/status space, preventing text jumps during scrolling and activation.

## QTP-003 - Align Concept Minutes Beside The Hour Heading

- Date: 2026-10-19
- Status: Accepted; adopts shared QUNO-032 and preserves QTP-002's public typography
- Decision: The concept uses 13 px/400 minutes beside 16 px/700 hours, aligned at the top. Scope these adjustments
  to the concept so its generic button rules cannot erase the hierarchy. Both time chapters use the floating guide.
- Consequences: Assert computed font sizes/weights and matching hour/first-minute top geometry. Package styles and
  selection contracts remain unchanged.

## QTP-004 - Demonstrate Shared Date And Time Selection In The Concept

- Date: 2026-10-19
- Status: Accepted; extends QTP-003's concept catalog
- Decision: Add Works with datepicker after the standalone Timepicker chapters. Use the public Datepicker's single-day
  time mode to demonstrate the shared time choices: select October 21 at 10:45, October 24 at 14:30, then restore
  October 19 at 09:00. Day selection opens time choices; minute selection returns to days. Keep prominent hours and
  smaller, regular-weight minutes. The authored date is optional scene configuration, not a Timepicker API setting.
- Consequences: Keep the standalone Timepicker entry independent from calendars. Scope playback's internal marker
  to synchronous synthetic pointer/click handlers under shared QUNO-033 so the component's focus handoff does not pause itself; real input
  between actions still interrupts. Verify every date/clock pair, return to days, manual selection and phone layout.

## QTP-005 - Keep Standalone Concept Controls Below The Clock

- Date: 2026-10-19
- Status: Accepted; refines QTP-003's standalone concept presentation
- Decision: Remove the duplicate Selected time output and business-hours checkbox. Keep the component's own summary,
  move cadence choices below the clock and retain authored enabled hours as scene configuration.
- Consequences: Assert absent duplicate output/toggle and cadence geometry below the component. Existing value
  preservation, minute selection, hour scrolling and the composed date/time chapter retain their behavior.

## QTP-006 - Keep A Chosen Visible Minute Under The Pointer

- Date: 2026-10-19
- Status: Accepted; refines QTP-001's selected-slot reveal through shared QUNO-036
- Context: Selecting a visible minute repositioned its entire hour at the scroller's top. New array instances from
  controlled consumers could repeat that correction even without a meaningful hour-list change.
- Decision: Keep visible selections stationary, reveal offscreen selections only as needed and compare enabled hours
  by their normalized values. Preserve initial selected-hour reveal, controlled/uncontrolled values and native focus.
- Consequences: Test pointer hit targets, unchanged option geometry/scroll offset, keyboard activation, uncontrolled
  selection, equivalent-array rerenders and existing external-value reveal on desktop/phone. The shared hook also
  serves Datepicker without adding a calendar dependency to standalone Timepicker.

## Shared mobile explainer drawer — 2026-10-20

[QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen) supersedes the shared
concept's mobile floating positioning and corner fullscreen placement. The drawer, chevron/fullscreen group and
responsive dock clearance belong to the demo; this product's public behavior and styles retain their contracts.

## Shared mobile drawer overlay — 2026-10-20

[QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer) removes reserved
mobile stage space: the shared explainer overlays the full canvas without disclosure-driven product movement.
This updates demo presentation only; public component contracts and desktop layout remain unchanged.

## Shared mobile drawer playback — 2026-10-20

[QUNO-040](../shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback) keeps a running
concept demo playing through mobile header swipes and chevron disclosure, while paused scenes remain paused.
This updates shared demo takeover only; public product behavior and desktop guide interaction retain their contracts.

## QTP-007 - Enlarge Concept Cadence Choices And Shorten Their Label

- Date: 2026-10-20
- Status: Accepted; refines QTP-005's standalone concept configuration
- Decision: Label the concept fieldset Cadence and give its 5 min, 15 min and 20 min buttons 80 px minimum width,
  44 px minimum height, 14 px type and 8 px gaps. Scope the presentation to the concept cadence fieldset.
- Consequences: Verify accessible naming, geometry, phone fit, mouse/keyboard activation, actual slot counts and
  preservation of an existing off-slot time. Public minuteCadence names, package minute buttons and other guides
  retain their contracts and presentation.

## Shared homepage and documentation routes — 2026-10-20

[QUNO-041](../shared/decisions.md#quno-041---promote-the-concept-homepage-and-preserve-field-guides) promotes the
concept to `/`, persists product/chapter navigation in the URL, and moves current field guides to `/docs`.
The pre-change guide source is retained at `/docs/archive`; public product contracts remain unchanged.

## Shared directory routes and quiet documentation — 2026-10-20

[QUNO-042](../shared/decisions.md#quno-042---use-directory-routes-and-quiet-documentation-loading) replaces
query navigation with product/chapter directories, converts earlier shared links, removes archive discovery links
and keeps lazy documentation loading silent. Public product contracts are unchanged.

## Shared documentation presentation — 2026-10-24

[QUNO-043](../shared/decisions.md#quno-043---share-left-aligned-navigation-and-system-themed-documentation) owns the shared header, browser-driven editorial appearance and
desktop supporting column. This product retains its public contracts and authored interactive examples.

## Shared section reading order — 2026-10-24

[QUNO-044](../shared/decisions.md#quno-044---keep-guide-sections-in-reading-order-with-one-instruction) refines QUNO-043 with one instruction aligned to the full description,
demos before implementation recipes, and shared-header-only demo navigation in current guides. This product's
public contracts, interactive examples and archive presentation remain unchanged.

## QTP-008 - Fit The Concept Controls At 320 Pixels

- Date: 2026-10-24
- Status: Accepted; refines QTP-007 and adopts the inner-card grid constraint in QUNO-047
- Decision: Use 12 px side gutters for the mobile Timepicker concept stage. At 320 px, this leaves enough card
  content width for all three 80×44 px cadence buttons and their 8 px gaps on one row. Keep the public clock’s
  360 px desktop width and allow its existing max-width rule to shrink it inside the constrained card.
- Consequences: Verify root/minute/cadence bounds at 280–844 px, one-row cadence geometry and real pointer/keyboard
  activation at 320×667, all three slot counts, off-slot value preservation, rotation and fullscreen. Desktop and
  package styles retain their existing values.

## Shared statistics presentation — 2026-10-24

[QUNO-048](../shared/decisions.md#quno-048---keep-statistics-free-of-instructions-and-list-actual-dependencies)
removes Try it notes from static statistics blocks and lists only actual dependencies, omitting an empty row.

## Shared demo recipe navigation — 2026-10-25

[QUNO-049](../shared/decisions.md#quno-049---keep-recipe-links-out-of-demo-popups) removes the recipe link from
demo popups. Implementation recipes remain accessible through Documentation in the shared header.
