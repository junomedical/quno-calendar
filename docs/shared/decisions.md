# Shared package decisions

This ledger owns decisions that affect more than one of the four products. Product-specific choices belong in the
matching product's `decisions.md`.

The original consolidation record, `QUNO-001`, remains in the
[Infinite Calendar historical ledger](../infinite-calendar/decisions.md#quno-001---consolidate-calendar-picker-and-natural-input)
because that repository was the consolidation source. Its identifier and text remain unchanged.

## QUNO-002 - Organize documentation and decisions by product ownership

- Date: 2026-08-25
- Status: Accepted
- Context: The combined repository presents four equal public products, but its documentation tree still reflected the
  Infinite Calendar repository's former ownership. Datepicker history lived in one root file, while Date Input and Date
  Parser had no decision ledgers of their own.
- Decision: Organize maintained documentation under `infinite-calendar`, `datepicker`, `date-input`, `date-parser`, and
  `shared`. Give every product a `decisions.md`; file future product choices with their owner and reserve this ledger for
  genuinely cross-product decisions. Preserve historical identifiers and link older family decisions from their current
  owner rather than rewriting accepted records.
- Consequences: Documentation ownership now mirrors public package entry points. Readers can find a product's current
  guidance without traversing unrelated calendar internals, while shared architecture, usage, migration, taxonomy, and
  testing remain stated once.
