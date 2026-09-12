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

## QUNO-006 - Demonstrate range composition after single-day configuration

- Date: 2026-08-25
- Status: Accepted; supersedes the composition mode in QUNO-005
- Context: The focused Date Input composition followed the standalone single-day configuration chapter but repeated
  its one-day mode. That made the integration example undersell the shared range model and left its benefit-led title
  paired with the narrower interaction.
- Decision: Keep the standalone Datepicker chapter in `selectionMode="single"`, then configure both Quno/Date Input and
  Quno/Datepicker in the focused composition for ranges. Start it with a multi-day value and teach a complete typed
  range while retaining the shared controlled `DateRange`, focus-open behavior, and hidden duplicate selection header.
- Consequences: The adjacent chapters now demonstrate distinct contracts: one isolates single-day picker behavior, and
  the other shows typed and painted range editing through one compact selection surface.

## QUNO-007 - Present the package through six guiding principles

- Date: 2026-08-25
- Status: Accepted
- Context: The four-product home explained what each primitive does but did not state the product values shared across
  their elements and interactions. Readers could see individual features without a concise explanation of the choices
  connecting them.
- Decision: Introduce the package as an opinionated approach to date and scheduling UI, then place six principles after
  the four product guides: Clean, Focused, Impressive, Unbundled, Natural, and Preemptive. Keep each principle short,
  outcome-led, and independent of a specific component.
- Consequences: The home communicates both the four separately importable ideas and the design stance joining them.
  Product field guides remain responsible for proving those principles through live interactions and focused demos.

## QUNO-008 - Keep production chapters free of duplicate import accordions

- Date: 2026-08-25
- Status: Accepted
- Context: Date Input and Date Parser production chapters already present their entry point, stylesheet status, measured
  artifacts, runtime, dependencies, compatibility, and public API in the shared production-facts component. A separate
  implementation accordion repeated only a subset of those facts immediately above the complete presentation.
- Decision: Remove the Import Date Input and Import Date Parser implementation accordions from their production
  chapters. Keep copyable implementation recipes on task-oriented chapters and keep complete import and artifact facts
  visible in the shared production presentation.
- Consequences: The two production endings are shorter and avoid duplicate payload guidance without hiding their
  entry-point or stylesheet contracts. Other field-guide chapters retain their focused implementation recipes.

## QUNO-009 - Keep production facts concrete

- Date: 2026-08-25
- Status: Accepted; refines QUNO-004 and QUNO-008
- Context: The shared production ending followed exact payload, import, runtime, compatibility, and dependency facts
  with a compressed “Public API at a glance” list. Labels such as “calendar event and loader types” were too vague to
  help readers understand or adopt the components.
- Decision: Remove the public-API summary row from all four production-facts presentations. Keep complete API teaching
  in task-oriented guide chapters and copyable recipes, while the production ending stays limited to concrete build
  and runtime facts.
- Consequences: Production chapters end sooner and every remaining fact is specific and comparable. Public APIs remain
  documented where their individual behavior has enough context to be useful.

## QUNO-010 - Credit the product thinking on the project home

- Date: 2026-08-26
- Status: Accepted
- Context: The project home explains the four UI primitives and the principles connecting them, but it does not identify
  the person responsible for the UI elements and their product thinking or invite conversation about the work.
- Decision: End the project home with a distinct Created by section crediting Dmitry Kirillov, and provide `dmitry@qunomedical.com` as a direct email link for questions, suggestions, and opportunities.
  Keep the attribution separate from the four equal product cards and the six guiding principles.
- Consequences: Readers can identify the work's creator and know that contact is welcome without changing the product
  directory, guide navigation, or package API.

## QUNO-011 - Verify React 19 without replacing the React 18 baseline

- Date: 2026-08-26
- Status: Accepted
- Context: The peer range supports React 18 and newer, but a React 18-only repository can miss newer ref declaration
  constraints and development lifecycle warnings. Replacing the main runtime would stop exercising the oldest
  supported React generation, while a production-only build would hide development warnings.
- Decision: Keep React 18 as the repository development dependency and add a separate packed React 19 consumer. It
  typechecks and builds every public product, mounts Datepicker, Date Input, and the real virtualized Infinite Calendar
  under Strict Mode in a development Chromium page, and fails on console warnings, console errors, or page exceptions.
  Keep the Preact compatibility fixture separate.
- Consequences: React 18, React 19, and Preact compatibility regressions remain independently attributable. The React 19
  fixture requires a built package and an installed Chromium browser, and CI runs it after package verification.

## QUNO-012 - Give library functions named contracts and align product ownership

- Date: 2026-09-05
- Status: Accepted; supersedes positional signatures and customization names in QUNO-001 and the affected product records
- Context: The independent entry points retained parser implementation in the input domain, duplicate helper exports,
  mixed singular/plural formatter configuration, and positional callbacks that made similar integrations inconsistent.
- Decision: Use one named object for every library-owned function with arguments. Keep zero-argument commands and
  externally imposed React, DOM, collection, and virtualizer signatures, with explicitly typed adapters at those
  boundaries. Standardize text overrides as `formatters`, presentation as `getDayProps`, `getDayCellProps`, and
  `getHourProps`, disabled-date matching as `isDayDisabled`, and React event rendering as `renderEvent`. Selection and
  zoom notifications use named payloads. Timeline locale and day-label formatters are component props; day labels
  receive `IsoDate`. Retain only plural `parserLanguages`. Make Date Parser own its implementation and headless types,
  place picker interaction algorithms in Datepicker, and export shared runtime helpers only from the root.
- Consequences: This is a clean public break documented in the migration guide, with no compatibility aliases.
  Formatting output, selection semantics, native events, geometry, loading, and timezone distinctions are preserved.
  Architecture checks enforce signatures and dependency direction; public type guards reject removed interfaces.

- Size tradeoff: The mandated object argument convention adds property names and request construction throughout
  production code. Measured ESM output exceeds the prior Infinite Calendar 34 KiB and Date Input 7 KiB gzip ceilings;
  accept 37 KiB and 8 KiB respectively for this break. Retain all other budgets and report measured artifacts in the
  field guides. Native virtualizer adapters must remain referentially stable to avoid invalidating measurements.

## QUNO-013 - Bound High-Frequency Work To Display Frames

- Date: 2026-09-08
- Status: Accepted
- Context: Pointer streams and native scroll bursts can arrive more often than the browser can paint. Repeating
  hit-testing, virtual-window publication, or recognition setup for every raw event spends main-thread time without
  producing an observable intermediate frame.
- Decision: Calendar drag/draw and Datepicker touch/pen painting retain only the latest coordinates per animation
  frame, while pointer release synchronously processes its final coordinates before committing. Datepicker quick-jump
  scrolling publishes the latest viewport sample once per frame and keeps its existing 120ms settled-edge extension.
  Cancellation, capture loss, Escape, close, and unmount discard queued work. Date Input compiles normalized parser
  options and vocabulary once per configuration and returns tokens with parse results internally; native draft/caret
  writes and Enter, blur, Arrow, partial-range, and IME completion remain synchronous, while ordinary recognition
  decoration may publish through a React transition.
- Consequences: The implementation applies splitting, batching, prioritizing, deferring, and repeated-work elimination
  only to measured high-frequency paths. Existing two-axis virtualization, bounded caches, memoized cards, async cache
  transitions, frame-coalesced zoom, and transform/opacity draft motion remain the primary foundations. Workers would
  add startup, serialization, and an asynchronous parser contract for tiny strings; `IntersectionObserver`, broad
  `will-change`, a FLIP rewrite, and custom priority queues add complexity or memory without reducing these bounded hot
  paths, so they are intentionally not introduced.

- Size tradeoff: Datepicker's frame scheduler, prepared day descriptors, and hard selection limits raise its ESM
  artifact to 42.17 KiB raw and 10.47 KiB gzip, so its
  JavaScript ceiling moves from 10 KiB to 10.5 KiB. Date Input measures 29.83 KiB raw and 7.82 KiB gzip and remains
  inside its existing 8 KiB ceiling.
