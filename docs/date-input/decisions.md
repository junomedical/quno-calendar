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
