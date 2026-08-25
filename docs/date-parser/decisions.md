# Quno/Date Parser decisions

This ledger owns headless parsing, tokenization, vocabulary, ranking, relative-date arithmetic, and SSR-safe execution.
Date Input presentation and editing behavior belongs in [its own ledger](../date-input/decisions.md).

## QDPR-001 - Publish parsing as an independent headless primitive

- Date: 2026-08-25
- Status: Accepted
- Context: Parsing originated inside the natural date input, but consumers also need recognition and tokens without a
  rendered component or framework runtime.
- Decision: Publish `parseDateInput`, `tokenizeDateInput`, and parser-specific contracts only from
  `@quno/calendar/date-parser`. Keep the implementation timezone-free, dependency-free, ESM/CommonJS compatible, and
  safe to import without `document`.
- Consequences: Date Input may consume the implementation internally but does not re-export it. Future grammar,
  vocabulary, tokenization, and ranking decisions use `QDPR-*` and live in this file.

## Historical accepted decisions

The canonical text of the following pre-consolidation decisions remains in the
[QDP historical ledger](../datepicker/decisions.md): `QDP-086`–`QDP-089`, `QDP-099`, `QDP-105`, `QDP-109`,
`QDP-112`, `QDP-114`, `QDP-117`, `QDP-118`, and `QDP-120`. They remain accepted where their parser behavior still
applies; new refinements belong here rather than in the Datepicker ledger.
