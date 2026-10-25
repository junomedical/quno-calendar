# Quno/Date Input decisions

This ledger owns component behavior for `QunoDateInput`. Parser grammar belongs to
[Quno/Date Parser](../date-parser/decisions.md); direct calendar manipulation belongs to
[Quno/Datepicker](../datepicker/decisions.md).

## QDI-001 - Keep typed interaction separate from parser semantics

- Date: 2026-08-25
- Status: Accepted
- Context: The former datepicker repository introduced natural parsing and its input component together under `QDP-*`
  identifiers. The combined package now publishes them as independent primitives with different runtime contracts.
- Decision: Date Input owns controlled and uncontrolled field state, keyboard editing, formatting, recognition and
  accessibility states, selection mode, and public composition examples. It consumes Date Parser internally but exports
  no parser utilities or parser-specific types.
- Consequences: Products can use the headless parser without React, or use Date Input without importing parser APIs
  directly. Future field behavior decisions use `QDI-*`; parser grammar decisions use `QDPR-*`.

## Historical accepted decisions

The canonical text of the following pre-consolidation decisions remains in the
[QDP historical ledger](../datepicker/decisions.md): `QDP-086`, `QDP-090`–`QDP-098`, `QDP-100`–`QDP-104`,
`QDP-106`–`QDP-108`, `QDP-110`–`QDP-115`, `QDP-119`, and `QDP-120`. They remain accepted where their behavior still
applies; new refinements belong here rather than in the Datepicker ledger.

## Shared contract update — 2026-09-05

[QUNO-012](../shared/decisions.md#quno-012---give-library-functions-named-contracts-and-align-product-ownership)
supersedes historical positional signatures and customization names for this product. The accepted interaction,
presentation, and geometry behavior in this ledger remains in force. See the
[migration guide](../shared/migration.md#unreleased-named-contracts-and-product-ownership) for exact replacements.

## Shared composition update — 2026-10-05

[QUNO-014](../shared/decisions.md#quno-014---retain-focus-through-composed-endpoint-navigation) records the focused
popup contract: Start/End shortcuts navigate without closing or changing the input value, while actual outside
focus or pointer actions still dismiss it. Datepicker owns the shortcut focus handoff in
[QDP-124](../datepicker/decisions.md#qdp-124--transfer-shortcut-focus-before-endpoint-navigation).

## Parser implementation update — 2026-10-05

[QDPR-005](../date-parser/decisions.md#qdpr-005---opt-into-timezone-free-clock-recognition) records optional headless
clock recognition. Date Input continues to consume the date-only analyzer; its values, formatting, and keyboard
editing retain their existing accepted behavior.

## QDI-002 - Recognize and edit one optional single-day clock

- Date: 2026-10-06
- Status: Accepted; extends QDI-001 and supersedes the date-only integration limitation noted on 2026-10-05
- Context: A date-time picker needs a native input that can control the same calendar day and clock through familiar
  typed syntax, while preserving date-only defaults and existing commit/IME behavior.
- Decision: In single-day `timeMode`, consume Date Parser's compiled clock-capable facade. Keep the date and separate
  controlled/uncontrolled clock synchronized; format the date then `HH:mm` (with an optional clock formatter).
  Enter/blur emits time-only changes, date-only text removes time, and clearing removes both. Reject off-cadence or
  disabled-hour clocks and distinct-clock intervals instead of rounding. Clock arrows edit the caret's hour or
  cadence-sized minute part, skip disabled hours, and stay drafts; date arrows retain the clock. Preserve IME guards.
- Consequences: Default/range behavior remains date-only. The synchronous parser code now enters the input bundle;
  parser utilities and grammar remain owned by Date Parser. QUNO-015 owns the shared settings/callback contract and
  QDP-125 owns direct time selection. Consumers own validation of persisted values after settings changes.

## QDI-003 - Make typed clock restrictions opt-in

- Date: 2026-10-06
- Status: Accepted; supersedes the implicit clock restrictions and arrow-step defaults in QDI-002
- Context: A minute cadence and enabled-hour list describe picker choices but should not reject a valid typed time.
- Decision: Add the Date Input-only `forceCadence` flag, defaulting to false. Valid typed clocks ignore both picker
  cadence and enabled hours unless that flag is true, including an empty hour list. Forced commits reject unsupported
  clocks without rounding. Default clock arrows use one-minute/all-hour editing; forced arrows use cadence-sized steps
  and skip disabled hours. Toggling enforcement does not rewrite committed values. Distinct-clock intervals, malformed
  clocks, overnight rejection, native commit points, and IME behavior retain QDI-002 semantics.
- Consequences: Products can offer convenient slots and accept exact typed times, or explicitly enforce identical
  picker/input options. The flag is not a parser option or a picker prop. QUNO-016 records the composed guide contract.

## Shared cadence update — 2026-10-06

[QUNO-018](../shared/decisions.md#quno-018---size-time-rows-by-minute-cadence) extends shared cadence choices with
20-minute steps and chooses time-selector columns by cadence. It supersedes the previous fixed maximum-six-column
layout; existing value, focus, formatting, and typed-clock ownership contracts remain in force.

## Shared enabled-hour default update — 2026-10-06

[QUNO-019](../shared/decisions.md#quno-019---default-omitted-or-empty-enabled-hours-to-all-hours) supersedes the empty-list
restriction: omitted or empty enabled hours now allows all 24 hours, including forced typed-clock validation and spins.
Nonempty lists retain their restrictions; disabled state, cadence, and existing values keep their contracts.

## Parser endpoint integration update — 2026-10-07

[QDPR-007](../date-parser/decisions.md#qdpr-007---return-paired-date-and-clock-endpoints) replaces the parser's parallel
date/clock results with `start` and `end` objects containing `{ date, time }`. Date Input projects their dates into its
existing `DateRange` and uses the start clock in single-day time mode. Controlled/uncontrolled values, commits,
recognition, partial completion, keyboard edits, cadence validation, and public callbacks retain QDI-001–QDI-003 semantics.

## Separate demo configuration — 2026-10-18

[QUNO-026](../shared/decisions.md#quno-026---give-each-product-demo-its-own-json-file) moves this product’s concept
scenarios into its own JSON file. Component contracts and scenario behavior remain unchanged.

[QUNO-027](../shared/decisions.md#quno-027---store-every-scenario-in-its-own-json-file) further separates every scenario
into its own file; the product JSON retains only metadata and ordered references.

[QUNO-028](../shared/decisions.md#quno-028---navigate-demo-screens-with-a-bottom-title-rail) records viewport-sized
scenario sections, JSON explanations, explicit fullscreen, and inert mobile previews shared by the concept demos.

[QUNO-029](../shared/decisions.md#quno-029---preserve-scenario-text-layout-during-scrolling) keeps complete concept explanation layouts mounted and reserves playback/status space, preventing text jumps during scrolling and activation.

## QDI-004 - Demonstrate Today's Typing And Repeated Keyboard Edits

- Date: 2026-10-19
- Status: Accepted; adopts shared QUNO-032
- Decision: Let the concept input use today's default reference date and a rolling expected period of twelve months
  either side. Remove the fixed reference label and raw result, leaving the formatted value in the field. Authored
  Enter actions wait 300 ms. Keyboard editing steps the day down three values, then the month up three values before
  committing, including the year boundary.
- Consequences: Keep timing and key/caret sequences in JSON and use public input configuration. Browser coverage
  observes every intermediate value, delayed Enter and relative dates under different current clocks. No API changes.

## QDI-005 - Show Several Natural Inputs Before Submitting

- Date: 2026-10-19
- Status: Accepted; supersedes QDI-004's 300 ms delay only for the natural-typing chapter
- Decision: Type and submit tomorrow, yesterday, 22 July 1980 and next Friday in sequence. Hold each complete input
  for 1200 ms before Enter and its formatted result for 1700 ms before the next example. Keep the single-date field,
  today's reference date, existing chapter identity, manual takeover and loop behavior. Other chapters retain 300 ms.
- Consequences: Author the examples and waits in scene JSON and update its explanation. Verify actual Enter timing,
  every committed value under two current browser dates, including a year boundary, and desktop/phone geometry.
  No player logic, public API or shipped stylesheet changes.

## QDI-006 - Explain Recognition And Open The Composed Picker On Focus

- Date: 2026-10-19
- Status: Accepted; extends QDI-004–005
- Decision: Give Date Input a first-person introduction and four chapters: Format guessing, Type naturally, Edit
  with keyboard and Works with datepicker. Demonstrate preferred numeric order and fallback to valid month/day
  combinations. Enable ranges in natural typing; retain its four examples and submission pacing. Open the composed
  calendar on field focus, without an extra toggle; retain it during internal selection and close on outside focus
  or pointer interaction. Typed endpoint edits reveal their month, and picker edits update the same native field.
- Consequences: Store copy and examples in JSON. Cover numeric results, native range typing, focus dismissal,
  bidirectional updates and desktop/phone geometry. No public API changes.

## QDI-007 - Complete Range Delimiters Only In Range Mode

- Date: 2026-10-19
- Status: Accepted; refines the partial-completion behavior inherited through QDI-001
- Decision: Only range-mode fields normalize a recognized start followed by a range delimiter while typing.
  Single-date fields retain native draft characters and reject multi-day commits; they do not insert a formatted
  range prefix. Range fields retain their existing completion and allow typing the second endpoint after the dash.
- Consequences: Native character-by-character regression tests cover both modes. Parser grammar, deletion, IME,
  Enter/blur commit points and public contracts remain unchanged.

## QDI-008 - Use The Field As The Composed Selection Summary

- Date: 2026-10-19
- Status: Accepted; refines QDI-006's concept presentation
- Decision: Hide the picker’s duplicate selection header in Works with datepicker using its public selectionHeader
  class override. Keep the selected range in the native input and the picker’s day selection, month navigation and
  endpoint shortcuts intact.
- Consequences: The calendar follows the input without a second summary card. Assert hidden header state and the
  resulting input-to-month spacing on desktop and phone. Standalone pickers and public component defaults retain
  their summaries.

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

## Shared statistics presentation — 2026-10-24

[QUNO-048](../shared/decisions.md#quno-048---keep-statistics-free-of-instructions-and-list-actual-dependencies)
removes Try it notes from static statistics blocks and lists only actual dependencies, omitting an empty row.

## Shared demo recipe navigation — 2026-10-25

[QUNO-049](../shared/decisions.md#quno-049---keep-recipe-links-out-of-demo-popups) removes the recipe link from
demo popups. Implementation recipes remain accessible through Documentation in the shared header.
