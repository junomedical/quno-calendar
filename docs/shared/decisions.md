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

## QUNO-003 - Demonstrate Date Input as the Datepicker selection surface

- Date: 2026-08-25
- Status: Accepted
- Context: Moving the input-plus-picker composition exclusively into the Date Input guide removed the Datepicker
  guide's live explanation of how its selected-period summary can become an editable field. The single-day example also
  instructed readers to type the German month word `juni` without enabling German recognition.
- Decision: Keep a controlled `QunoDateInput` in the Datepicker range-model chapter as the visible selection surface
  that opens `QunoDatePicker` on focus. Configure both Datepicker typing examples for simultaneous English and German
  recognition while retaining English display formatting and the shared timezone-free `DateRange` value.
- Consequences: Datepicker readers can evaluate typing and picking in the same live range control, `12 juni` works in
  the single-day example exactly as instructed, and the two independent components remain coupled only by parent-owned
  state.

## QUNO-004 - Present production contracts consistently in every field guide

- Date: 2026-08-25
- Status: Accepted
- Context: The four browser guides described package size with different layouts, labels, precision, and inclusion
  rules. Combined JavaScript-plus-CSS totals could be mistaken for stylesheet size, and the Datepicker ended with a
  repository path that hosted readers could not follow.
- Decision: Use one shared production-facts presentation in all four guides. Show independently imported JavaScript and
  optional CSS as separate exact gzip and raw artifacts with their individual budgets; never headline a combined total.
  Show entry point, stylesheet path, runtime, compatibility, external dependencies, and a concise public API summary in
  the browser. Date Parser explicitly states that it has no stylesheet.
- Consequences: Readers can compare all four products directly and understand which bytes and runtimes are optional or
  external. Production measurements have one maintained source, and hosted documentation no longer relies on local
  repository navigation.

## QUNO-005 - Separate picker mode from focused Date Input composition

- Date: 2026-08-25
- Status: Accepted; refines QUNO-003
- Context: The Datepicker guide’s single-day chapter combined `selectionMode="single"` with an always-visible Date
  Input and picker. Readers could not evaluate the picker setting by itself, and the composition no longer behaved like
  the compact focused field it was meant to demonstrate.
- Decision: Keep the single-day chapter exclusive to `QunoDatePicker` configuration. Follow it with a separate live
  composition in which `QunoDateInput` replaces the selected-day summary and Clear action, opens the single-day picker
  only while focus remains in the composed control, and shares one parent-owned `DateRange` with it.
- Consequences: Each chapter demonstrates one contract. The composition remains adapter-free, avoids duplicated
  selection chrome, follows typed dates into their visible month, and closes when readers leave the control.
