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
