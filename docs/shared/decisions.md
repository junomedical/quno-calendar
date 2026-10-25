# Shared package decisions

This ledger owns decisions that affect more than one of the four products. Product-specific choices belong in the
matching product's `decisions.md`.

Infinite Calendar's immediate time-detail visibility is product-owned in
[Decision 116](../infinite-calendar/decisions.md#116---remove-zoom-detail-transparency).

Standalone Timepicker's regular-weight minute options are product-owned in
[QTP-002](../timepicker/decisions.md#qtp-002---use-regular-weight-minute-options).

The original consolidation record, `QUNO-001`, remains in the
[Infinite Calendar historical ledger](../infinite-calendar/decisions.md#quno-001---consolidate-calendar-picker-and-natural-input)
because that repository was the consolidation source. Its identifier and text remain unchanged.

Infinite Calendar's daily segments, overlap loading and grabbed-time movement are product-owned in
[Decision 160](../infinite-calendar/decisions.md#160---render-daily-event-segments-and-drag-by-the-grabbed-time).

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

## QUNO-014 - Retain focus through composed endpoint navigation

- Date: 2026-10-05
- Status: Accepted; refines QUNO-005 and QUNO-006
- Context: Focused Date Input/Datepicker popups can interpret a disappearing Start or End shortcut as focus leaving
  the control. Retaining pointer intent through the click does not provide a lasting keyboard focus destination.
- Decision: Keep the composed popup open through endpoint navigation, preserving the controlled range and input text.
  Use Datepicker's stable month-heading focus destination from QDP-124 before the shortcut exits. Continue closing
  on focus moving outside or an outside pointer action, and retain internal-pointer guards for other interactions.
- Consequences: Both public guide compositions support repeated Start/End jumps with pointer, Enter, and Space,
  with ordinary or reduced motion, while subsequent Tab navigation remains within the picker until focus leaves.

## QUNO-015 - Resolve public subpath types for legacy TypeScript consumers

- Date: 2026-09-24
- Status: Accepted
- Context: Modern TypeScript resolves declaration subpaths from package `exports`, but the onboarding monorepo still uses Node-style module resolution and required ambient declarations for Infinite Calendar and Datepicker.
- Decision: Keep the existing `exports` type conditions and add `typesVersions` mappings for every public JavaScript subpath. Do not add consumer-side TypeScript paths, which can affect runtime bundler resolution.
- Consequences: Legacy consumers can import the package's real declarations directly, remove local declaration shims, and keep runtime imports at public subpaths. No JavaScript or CSS payload changes.

## QUNO-015 - Compose a single day and a separate clock across picker and input

- Date: 2026-10-06
- Status: Accepted; extends QUNO-005, QUNO-006, and QUNO-012
- Context: A single-date booking field needs typed clock recognition and direct time selection without changing the
  existing timezone-free day model or coupling the independent UI products.
- Decision: Share headless `TimeSelectionOptions`, `MinuteCadence`, and `DateTimeSelectionChange` through the root.
  Enable `timeMode` only with single selection; keep date ranges unchanged and store `time`/`defaultTime` separately
  as `HH:mm` or null. Active time mode emits `{ value, time }`; default and range callbacks keep `{ value }`.
  Share enabled hours and cadence across the picker and input, keep controlled values authoritative when settings
  change, and demonstrate the composition through public imports in both guides and `/demo/date-time`.
- Consequences: Consumers own one date and one clock, with no timezone/timestamp conversion or range-time UI.
  Date Input consumes the existing synchronous clock-capable parser facade; Datepicker remains parser-free.
  Picker behavior belongs in QDP-125 and typed editing in QDI-002. These opt-in features increase feature bundle
  sizes, so the Datepicker JavaScript ceiling moves from 10.5 to 12 KiB gzip and Date Input from 8 to 10 KiB.
  Shared, Infinite Calendar, Date Parser, and optional stylesheet ceilings remain unchanged; guides report measured
  artifacts separately. This supersedes only those two current size ceilings in QUNO-012/QUNO-013.

## QUNO-016 - Separate picker choices from typed clock restrictions

- Date: 2026-10-06
- Status: Accepted; refines QUNO-015
- Context: Sharing picker cadence and enabled hours should not silently limit the precision of typed date-time values.
- Decision: Keep picker options constrained by their settings, while Date Input accepts any valid single clock by
  default. Its `forceCadence` prop explicitly enforces both cadence and enabled hours. Demonstrate the distinction
  through a default-off enforcement control and copyable recipes in both guides and the focused date-time demo.
- Consequences: Shared state still synchronizes exact typed clocks even when they have no corresponding picker slot.
  QDI-003 owns typed validation and arrow behavior; QDP-125 continues to own offered picker choices unchanged.

## QUNO-017 - Add an independent Timepicker and reuse its slot renderer

- Date: 2026-10-06
- Status: Accepted; extends QUNO-015 and the four-product boundary in QUNO-012
- Context: The existing calendar time selector is useful as a standalone clock control with its own public surface.
- Decision: Add `@quno/calendar/timepicker` and its optional stylesheet as a fifth product, with `QunoTimePicker`
  and product-owned props, labels, formatters, class names, and slots. Keep the root headless. Move the private time
  slot renderer into `src/lib/time-picker`; permit Datepicker to depend on that renderer while Timepicker depends
  only on shared headless contracts and its own domain. Preserve Datepicker's existing CSS/classes, slots, labels,
  focus behavior, and callbacks. Use `quno-time-picker-*`/`--quno-time-picker-*` names for the new standalone surface.
- Consequences: Both controls share option generation and selected-slot scrolling without bundling a calendar into
  Timepicker. Add an interactive guide, focused demo, home card, public guards, packed consumers, and visual coverage.
  Set separate Timepicker ceilings of 3 KiB JavaScript and 1.5 KiB CSS gzip; other accepted ceilings stay unchanged.
  QTP-001 owns the standalone value and interaction contract.

## QUNO-018 - Size time rows by minute cadence

- Date: 2026-10-06
- Status: Accepted; refines slot layout in QUNO-015/QUNO-017, QDP-125, and QTP-001
- Context: A fixed maximum-six-column layout leaves uneven last rows for fine cadences and gives different minute
  intervals the same density.
- Decision: Share cadence-specific columns across Timepicker and Datepicker: 1/2/3/4/6-minute steps use five columns,
  5/15 use four, 10 uses six, 20 uses three, and 30 uses two. Retain the existing 6-minute setting at five columns.
  Add 20 to the shared `MinuteCadence` contract and demo settings; forced Date Input validation and clock spins use it.
- Consequences: Each hour ends in a full row. Default cadence remains 15; minute values still start at 00 and stay
  below 60. Sticky hours, existing selected clocks, callbacks, disabled behavior, and unrestricted typing remain intact.
  Browser coverage asserts column counts and row geometry at desktop and mobile widths; size ceilings remain unchanged.

## QUNO-019 - Default omitted or empty enabled hours to all hours

- Date: 2026-10-06
- Status: Accepted; supersedes empty-list behavior in QDP-125/QTP-001 and forced validation under QDI-003
- Context: A missing or empty hour configuration should provide the full clock rather than an unusable selector.
- Decision: Both omitted and empty `enabledHours` enable all 24 hours in Timepicker and Datepicker. Use the same
  default in forced Date Input validation and clock spins. Nonempty lists continue to restrict hours; invalid and
  duplicate entries do not add options. Keep cadence, selected values, callbacks, and disabled behavior unchanged.
- Consequences: Demo settings expose the empty-list fallback as All (empty list). Regression coverage verifies full
  option groups, boundary-hour selections, forced commits, and midnight edits. Document the changed empty-list
  meaning in migration guidance; keep existing public labels and customization surfaces intact.

## QUNO-020 - Use six columns for five-minute cadence

- Date: 2026-10-06
- Status: Accepted; supersedes only the five-minute column count in QUNO-018
- Context: Twelve five-minute choices fit evenly into two rows of six instead of three rows of four.
- Decision: Render five-minute cadence with six columns in both Timepicker and Datepicker time mode. Keep every
  other cadence's column count and all minute values unchanged.
- Consequences: Both selectors use the shared renderer; guide examples and browser checks assert six columns and
  two complete rows per hour. Value ownership, callbacks, availability, and public styling names retain their contracts.

## QUNO-021 - Emphasize hours above minute options

- Date: 2026-10-06
- Status: Accepted; supersedes the retained hour-label typography in QDP-126 and refines QUNO-017
- Context: Small muted hour labels are less prominent than the minute choices they organize.
- Decision: Give sticky hour headings in Timepicker and Datepicker time mode 16px text, weight 700, and each
  component's normal text color. Keep minute options at 13px/550, matching calendar day numbers.
- Consequences: Hours anchor the minute grids without changing rail width, option geometry, or interaction.
  Existing scoped text tokens and hour-heading hooks remain available. Desktop and mobile browser checks cover
  computed typography/color, rail fit, sticky position, and layering in both controls.

## Concurrent decision records reconciled — 2026-10-06

The merged branches independently assigned QUNO-015 to [legacy TypeScript subpath resolution](#quno-015---resolve-public-subpath-types-for-legacy-typescript-consumers)
and [single-day clock composition](#quno-015---compose-a-single-day-and-a-separate-clock-across-picker-and-input).
Both accepted identifiers and texts are preserved; references distinguish these records by their full title/anchor.
New decisions continue after QUNO-021. The legacy TypeScript mapping also covers the new Timepicker subpath.

## Parser endpoint integration update — 2026-10-07

[QDPR-007](../date-parser/decisions.md#qdpr-007---return-paired-date-and-clock-endpoints) owns the parser-only public
result change to paired `{ date, time }` endpoints. Date Input and public demo compositions project endpoint dates
into the existing shared `DateRange`; the independent UI value/callback shapes under QUNO-015 remain unchanged.

## QUNO-022 - Isolate the live demo approach experiment

- Date: 2026-10-18
- Status: Accepted for the demo experiment
- Decision: Keep `/concept` in `demo/concept`, with the live calendar immediately mounted under a partial gradient introduction, five product tabs, guide links, expanded playground mode, and selectable calendar scenarios. An illustrative pointer accompanies real public navigation and zoom settings. Canvas interaction pauses the tour; reduced-motion visitors start paused.
- Consequences: Existing home, focused demos, and guides retain their routes. Fixtures are local and deterministic. No package API or product behavior changes. Browser checks cover geometry, layering, state, links, and mobile fit.

## QUNO-023 - Demonstrate live interactions with cancellable scenario playback

- Date: 2026-10-18
- Status: Accepted; supersedes the illustrative-only playback in QUNO-022
- Decision: Give `/concept` nineteen named scenes across five products. Calendar includes scroll, anchored zoom, overlap, horizontal/vertical views, themes, event density, drawing/saving, and rescheduling. A rounded notched pointer operates actual demo controls and component interaction handlers, including intermediate hover, press, drag, typing, and commit feedback. Scope synthetic pointer-capture adaptation to the demo and restore it on cancellation.
- Consequences: Replay and Reset remount deterministic scene state; Try it preserves the current usable result. Trusted input/focus and hidden tabs cancel pending work. Reduced motion starts paused, and previews end once. Product modules mount on selection. Fixtures and all playback remain in `demo/concept`; no shipped API changes. The density field-guide chapter adds a lazy live exhibit and copyable recipe. Browser checks assert scene outcomes, manual parity, takeover, geometry, themes, and mobile fit.

## QUNO-024 - Author demo scenarios as JSON

- Date: 2026-10-18
- Status: Accepted; refines QUNO-023's scenario ownership
- Decision: Keep product copy, scenario order, recipe anchors, expanded presentation, initial component state, preview sequences, and playback steps in `demo/concept/scenarios.json`. Validate the versioned document and references before use. One typed interpreter dispatches reusable actions; neither playback nor initial component configuration branches on scene identifiers.
- Consequences: Adding or changing a scene using existing actions requires only JSON edits. Product components retain public-entry-point wiring and the actor retains geometry-aware interaction mechanics, cancellation, and shared cursor pacing. Replay/Reset use JSON initial state. Unknown actions, fields, invalid values, duplicate IDs, or missing preview references fail explicitly. Adding a new interaction primitive requires a typed adapter and validation. Browser coverage injects a new JSON-only scene to prove the boundary. No public package changes.

## QUNO-025 - Animate demo scroll and controlled zoom

- Date: 2026-10-18
- Status: Accepted; refines QUNO-023 playback and QUNO-024 action data
- Decision: Use cancellable animation-frame interpolation for demo motion. Scroll and slider steps declare duration and easing in JSON. Demonstrate zoom by visibly pressing and dragging a real range control through intermediate native input events, instead of showing five discrete synthetic wheel increments. Keep manual Shift-wheel behavior available and unchanged. Animate target positioning as well as explicit scroll steps.
- Consequences: The calendar's actual controlled geometry changes every frame; shared scroll interpolation preserves requested travel despite integer pixel rounding. Cursor/pressed state follows the slider thumb. Manual takeover, hidden tabs, scene changes, and unmount cancel pending frames. Reduced-motion visitors start idle and may explicitly play demonstrations. Frame-sampled browser checks cover both orientations and cancellation; unit checks cover timing and exact travel. Changes are demo-only.

## QUNO-026 - Give each product demo its own JSON file

- Date: 2026-10-18
- Status: Accepted; supersedes QUNO-024's single-file storage while retaining its JSON authoring and playback contracts
- Decision: Store each product's copy, preview order, guide links, initial state, and scenario steps in its own `demo/concept/scenarios/<product-id>.json`. A small `demo.json` manifest owns schema version, tab order, startup product, and shared reference dates. The source registry assembles the catalog in manifest order and verifies each file's product ID before applying existing strict scenario validation.
- Consequences: Changing one demo needs only its own JSON file. Remove the old combined scenario document. Preserve all nineteen scenes, shared playback, motion timing, replay/reset, and public component contracts. Tests verify independent edits to every file, manifest ordering, mismatched/missing files, and live JSON-only customization without changing another demo.

## QUNO-027 - Store every scenario in its own JSON file

- Date: 2026-10-18
- Status: Accepted; supersedes QUNO-026's product-level scenario grouping following clarification of the requested granularity
- Decision: Store all nineteen scenes independently at `demo/concept/scenarios/<product-id>/<scenario-id>.json`. Each file owns its label, hint, guide anchor, initial state, expanded preference, and action sequence. Product manifests retain product copy, explore links, and ordered scenario/preview IDs. Shared startup and dates remain in `demo.json`.
- Consequences: Discover scene files automatically and resolve them in manifest order, validating filename/ID agreement and all existing contracts. Adding a supported scene requires only its JSON file and a manifest reference. Tests cover independent changes to every scene, new JSON-only scenes, missing/mismatched files, duplicate references, and browser customization of exactly one scene. Playback and public component behavior remain unchanged.

## QUNO-028 - Navigate demo screens with a bottom title rail

- Date: 2026-10-18
- Status: Accepted; refines QUNO-022/QUNO-023 presentation and QUNO-027 scenario data
- Decision: Keep product tabs above vertically scrollable, viewport-sized scenario sections. Each section shows its scenario title, one or two JSON-authored explanation paragraphs, and working demo. A persistent bottom rail lists scenario titles and supports horizontal touch scrolling; choosing a title scrolls to the matching section before playback begins. Manual section scrolling selects the nearest scene paused. Mount only the active working component.
- Fullscreen: Launch explicitly with the button below the paragraphs. Show only the working demo and playback/exit controls, preserve mounted state, and restore launch-button focus on exit. Remove automatic expanded-mode flags from scenes. Desktop inline interaction remains enabled; the first scene plays once, with multi-scene tours started explicitly.
- Mobile: At widths up to 850 px, make inline previews inert and pause simulations. Touch scrolls the page or title rail; interaction and replay are available only in fullscreen. Leaving fullscreen retains the current result in an inert preview. Reduced motion disables animated section navigation.
- Verification: Assert viewport containment, paragraph/button placement, real scroll positions and intermediate frames, title selection, touch swipes, inert input/focus behavior, fullscreen chrome/state/focus, resize handling, and existing scene outcomes. No package API or runtime changes.

## QUNO-029 - Preserve Scenario Text Layout During Scrolling

- Date: 2026-10-19
- Status: Accepted; refines QUNO-028's section presentation
- Decision: Keep the complete title, explanation paragraphs, docs/fullscreen actions, and playback area mounted in every scenario section. Use the same component and styles before and after activation. Remove the abbreviated placeholder with different heading typography, paragraph count, and centering. Inactive sections remain inert and hidden from assistive navigation; only the active launch button owns the focus-restoration ref.
- Consequences: Activation changes interaction availability and playback state without replacing text nodes. Reserve the Pause button's layout space and a fixed status area so starting/stopping playback does not recenter the copy. Heavy non-calendar demos still mount only when active; the Calendar canvas remains persistent. Browser tests sample relative text/action geometry throughout native scrolling and activation, plus playback/pause at desktop, narrow-desktop, and mobile widths.

## Calendar fullscreen presentation update — 2026-10-19

[Infinite Calendar Decision 131](../infinite-calendar/decisions.md#131---guide-fullscreen-calendar-scenes-with-a-floating-card)
supersedes QUNO-028's fullscreen chrome for Calendar only, adding a floating scene guide, See demo, previous/next
navigation, and top-navigation Back. QUNO-029's stable inline explanation layouts and other products remain unchanged.

## Calendar default presentation update — 2026-10-19

[Infinite Calendar Decision 132](../infinite-calendar/decisions.md#132---open-the-calendar-with-a-movable-guide-and-inline-contents)
supersedes Decision 131 and Calendar's scenario-page presentation under QUNO-028/QUNO-029. Calendar now opens full-width
with a movable/collapsible information panel, inline contents, bottom arrows, corner fullscreen, and automatic playback
with reduced-motion/manual-takeover guards. Other products retain their accepted presentation.

## Calendar introduction update — 2026-10-19

[Infinite Calendar Decision 133](../infinite-calendar/decisions.md#133---introduce-the-calendar-demo-before-its-chapters)
adds a dedicated introduction as the Calendar floating guide's first presentation page, before its existing scenes.
Background autoplay, the shared scene catalog, and other product presentations retain their accepted contracts.

## Calendar panel navigation update — 2026-10-19

[Infinite Calendar Decision 134](../infinite-calendar/decisions.md#134---keep-calendar-navigation-in-the-floating-guide-footer)
moves Calendar's previous/next controls into the floating panel footer, including its collapsed state. The calendar
uses the recovered viewport space. Other products retain their title rails.

## Calendar chapter playback update — 2026-10-19

[Infinite Calendar Decision 135](../infinite-calendar/decisions.md#135---start-calendar-chapters-without-hiding-their-explanation)
keeps chapter text expanded and starts its demo on arrival, removing the Calendar playback toolbar. Other products
retain their accepted playback controls.

## Calendar looping update — 2026-10-19

[Infinite Calendar Decision 136](../infinite-calendar/decisions.md#136---loop-the-selected-calendar-scenario-without-advancing-navigation)
keeps Calendar playback on the chosen chapter in a loop. Infinite scroll moves continuously downward. Other products
retain their finite scenes and short tours.

## Calendar motion pacing update — 2026-10-19

[Infinite Calendar Decision 137](../infinite-calendar/decisions.md#137---make-calendar-scroll-and-zoom-loops-lively) replaces steady scrolling with 900 px steps and short pauses, and zooms between both extrema with exploratory scrolls.

## Calendar pointer intent update — 2026-10-19

[Infinite Calendar Decision 138](../infinite-calendar/decisions.md#138---require-deliberate-pointer-input-to-take-over-playback) replaces hover takeover with deliberate pointerdown takeover. Other cancellation inputs and products retain their accepted behavior.

## Calendar orientation playback update — 2026-10-19

[Infinite Calendar Decision 139](../infinite-calendar/decisions.md#139---demonstrate-next-day-scrolling-after-each-orientation-switch) adds next-day pans after both view switches using existing JSON actions.

## QUNO-030 - Keep The Shared Demo Cursor Simple

- Date: 2026-10-19
- Status: Accepted; refines QUNO-023's shared cursor presentation and removes its text annotations
- Decision: Round the notched cursor's corners more visibly and rotate its SVG 15 degrees counterclockwise around the existing 3 px tip anchor. Do not show a caption, sign, or key/scroll label beneath the cursor in any product demo. Keep the pointer movement, click pulse, held-drag cue, actual interactions, and cancellation behavior. Existing JSON caption fields remain valid authoring metadata but are not rendered.
- Consequences: Remove caption markup, text mutation, and caption-specific styles/positioning. Keep SVG overflow visible so rotation is not clipped and leave the outer cursor's position untransformed so it stays aligned to controls. Browser coverage checks rounded/notched fill geometry, computed rotation, non-interception, absent caption nodes, and slider alignment. No public product contracts change.

## QUNO-031 - Round Both Layers Of The Demo Pointer

- Date: 2026-10-19
- Status: Accepted; refines QUNO-030's corner rendering
- Decision: Render the notched pointer body and white outline with thick, round-joined SVG strokes. Both visible contours must have rounded tips and corners at the actual demo size. Retain the 15-degree counterclockwise rotation, tip anchor, absent captions, non-interception and existing gestures.
- Consequences: Browser checks assert round joins and stroke coverage at the rounded tip as well as notched fill geometry and computed rotation. This shared demo-only asset changes no product contracts.

## QUNO-032 - Share The Floating Guide Across All Concept Products

- Date: 2026-10-19
- Status: Accepted; supersedes QUNO-028 and QUNO-029's section/rail, inert-preview and toolbar presentation
- Decision: Use a live full-window canvas with one movable, collapsible guide for all five products. Put introductions,
  All demos contents and previous/next navigation inside it. Chapters autoplay and loop in place unless reduced motion
  is enabled. Deliberate pointerdown, wheel, keyboard, focus and hidden tabs cancel playback; hover alone does not.
  Fullscreen sits at bottom right, with Calendar scene controls immediately left on the same bottom edge. Keep the
  guide 24 px from bottom left by default and store left/bottom offsets so height changes grow upward; preserve its
  width and 34 px toggle through collapse. Clamp to bounds and reserve clearance for narrow Calendar control docks.
  Non-calendar elements sit right of the explanation on wide screens and in a clipped scrollable area above it on
  phones. Introductions add presentation pages without synthetic scenes; only the active lazy product mounts.
- Consequences: Share ConceptTour, FloatingGuide, DemoContents and DemoNavigation. Remove obsolete section/rail,
  launch/fullscreen dock and toolbar modules. Non-calendar loops reset their active stage; Calendar retains its
  session and authored closed cycles. Verify geometry, hit targets, clipping, disclosure, keyboard/touch dragging,
  focus, loops and takeover across desktop/phone/landscape. All changes are demo-owned; no public migration.

## QUNO-033 — Keep Synchronous Demo Focus Handoffs Internal

- Date: 2026-10-19
- Status: Accepted; refines QUNO-032's deliberate-takeover contract
- Decision: Mark synchronous scripted pointerdown, pointerup and click dispatch as internal to playback. This includes
  any native focus handoff performed by the working component during those handlers, such as a day opening its time
  choices. Clear the marker immediately after dispatch; pauses and asynchronous movement remain interruptible.
- Consequences: Date/time composition can loop without treating its own focus changes as manual activity. Real
  pointer, wheel and keyboard input between actions still cancels pending work. Keep this behavior in the demo actor;
  package component focus, interaction and accessibility contracts remain unchanged.

## QUNO-034 — Allow A Ready Introduction Before Chapter Playback

- Date: 2026-10-19
- Status: Accepted; extends QUNO-032's chapter-arrival playback
- Decision: Add optional scene JSON chapterOnly. When the product introduction reuses that scene, preserve its initial
  working control and keep playback idle. Choosing the chapter starts its authored steps normally; returning to the
  introduction restores the ready value. Omitted metadata retains existing introduction autoplay behavior.
- Consequences: Check the introduction state through the shared tour container in the playback hook, without branching
  on product or scene IDs. The Date Parser opts in to show a recognized date/time immediately. Preserve reduced motion,
  loop cancellation and manual interaction. No public package API change.

## QUNO-035 — Keep Guide Navigation Direct And Contextual

- Date: 2026-10-19
- Status: Accepted; refines QUNO-032's floating-guide navigation
- Decision: Keep only Previous and Next in the guide footer, removing its counter/current-demo button. Use contextual
  top actions such as All calendar demos or All date parser demos to open contents. Match their 34 px height to the
  collapse/expand button. Retain contents titles, ordered chapter choices and existing previous/next behavior.
- Consequences: Reuse the existing product contents label for the action. Verify two footer buttons, absent counter,
  contextual names, equal button heights and contents/navigation/collapse across desktop, phone and landscape.
  Component/package contracts and the guide's bottom-left anchor remain unchanged.

## QUNO-036 — Preserve Visible Time Choices Through Selection

- Date: 2026-10-19
- Status: Accepted; refines QUNO-017's shared time-slot renderer
- Decision: Reveal the initially selected hour when time choices mount. Afterward, leave an already visible selected
  option in place; only scroll the minimum needed to reveal an offscreen option or its available hour heading.
  Equivalent enabled-hour arrays must not restart reveal work on unrelated parent renders.
- Consequences: Both standalone Timepicker and Datepicker use one private reveal hook with semantic hour-list
  dependencies. Native pointer/keyboard selection keeps geometry and focus stable, while external offscreen values,
  changed hour availability and reopening retain selected-slot reveal. No public names or styles change.

## QUNO-037 — Follow System Appearance Around Light Demo Panels

- Date: 2026-10-19
- Status: Accepted; extends QUNO-032's shared concept presentation
- Decision: Follow prefers-color-scheme at first render and on live preference changes for the concept shell and
  surrounding product canvas. Keep the floating explainer and non-calendar working controls in their existing light
  style, with bright panels and an explicit light color-scheme. Never recolor their parser tokens, selected dates
  or native input presentation. Calendar's system-default palette is defined in its own decision record.
- Consequences: A demo-owned media-query hook subscribes with cleanup. Appearance changes update in place without
  restarting playback, selection, editors or the mounted product. Scope all CSS to /concept; package styles and
  other routes retain their contracts. Verify both themes, live changes, bright surfaces and unchanged explainer
  colors on desktop, phone and fullscreen.

## QUNO-038 — Use A Mobile Explainer Drawer With Adjacent Fullscreen

- Date: 2026-10-20
- Status: Accepted; supersedes QUNO-032's mobile floating placement and corner fullscreen, and refines QUNO-035
- Decision: At widths up to 850 px, attach the shared explainer to the bottom edge as a full-width drawer with
  safe-area padding. Its downward chevron collapses; the upward chevron expands. Header/chevron swipes over 48 px
  perform the matching action, while short/cancelled gestures retain state and text/contents scroll natively. Animate
  drawer height over 240 ms unless reduced motion is enabled. Put fullscreen immediately left of the chevron on both
  desktop and mobile, retaining both controls and the title when collapsed. Use 44 px mobile targets and retain
  desktop's 34 px controls and draggable bottom-left guide. Keep Calendar docks at bottom right on desktop and above
  the drawer on mobile using its measured height.
- Consequences: Preserve contents/navigation, component mounts, calendar scroll, desktop position across breakpoints
  and fullscreen focus restoration. Verify native touch, cancellation, body scrolling, frame geometry/reduced motion,
  control hit targets and phone/landscape layouts for every product. Shared presentation remains in demo/concept;
  public exports, package styles and other guide routes do not change.

## QUNO-039 — Overlay The Full Mobile Canvas With The Explainer Drawer

- Date: 2026-10-20
- Status: Accepted; supersedes QUNO-032's mobile product-stage clearance and refines QUNO-038
- Decision: Keep each non-calendar product stage at the full canvas height on mobile, top aligned with fixed
  padding. The bottom explainer drawer overlays that content; never subtract its measured height, reserve a gap,
  or move/resize the working product when its explanation, contents or collapsed state changes. Keep native product
  scrolling, drawer gestures, adjacent fullscreen and the existing desktop composition. Calendar already fills its
  canvas and retains its floating control dock's clearance without adding a layout spacer.
- Consequences: Covered content remains behind the drawer. Collapse the drawer to reveal more of the working demo.
  Verify full canvas/stage geometry, stable card placement through disclosure/contents/fullscreen, retained mounts
  and actual top-layer hit testing at overlapping Datepicker coordinates on phone and landscape. Scope the change
  to demo CSS; public component layouts and styles remain unchanged.

## QUNO-040 - Keep Mobile Drawer Disclosure Independent Of Playback

- Date: 2026-10-20
- Status: Accepted; refines QUNO-032's manual takeover and QUNO-038's drawer gestures
- Decision: Mobile header/chevron gestures and chevron disclosure change only presentation. Preserve the running
  scene and actor through down/up swipes, short/cancelled drags, taps and Enter/Space activation with their associated
  focus. Leave already paused scenes paused. Keep contents, fullscreen, working controls, desktop guide interaction,
  ordinary keyboard/wheel takeover and hidden-tab cancellation unchanged.
- Consequences: Remove explicit mobile drawer stop calls and filter only presentation events in the shared playback
  listener. Verify all five products with native input, continuing cycle progression, retained canvas identity and
  paused-state preservation. This behavior belongs to demo/concept; public package contracts remain unchanged.

## QUNO-041 - Promote The Concept Homepage And Preserve Field Guides

- Date: 2026-10-20
- Status: Accepted; supersedes QUNO-032's isolated concept route and earlier overview/guide route placement
- Decision: Serve the concept at `/` and retain `/concept` as an alternate entry. Remove its corner logo. Record
  stable product and demo IDs in `?product=...&demo=...`, using `intro` for the product introduction. Validate links
  against the authored catalog, restore them on reload and browser back/forward, and remember each product's last
  chapter while switching tabs in the mounted visit. Presentation and playback state do not write navigation.
- Documentation: `/docs` owns the overview and `/docs/{product}` the current field guides. Keep legacy guide routes
  and hash anchors working. Copy the previous overview and all guide sources, recipes and exhibits before changing
  them, then expose the independent snapshot at `/docs/archive` and `/docs/archive/{product}`. The archive is dated
  20 October 2026 at source commit 9013d1c, and still uses current public package/demo infrastructure.
- Consequences: Load current and archived guides lazily. Current guides provide consistent product navigation,
  catalog-driven links to all concept chapters and matching chapter links alongside integration recipes. Retain
  distinctive API exhibits, including availability layers, loading/focus, localization, custom presentation and
  controlled/uncontrolled examples. Keep focused sandboxes accessible. Browser checks cover shared/reloaded links,
  invalid links, history, per-tab restoration, archive separation, deep links and phone geometry. No public API changes.

## QUNO-042 - Use Directory Routes And Quiet Documentation Loading

- Date: 2026-10-20
- Status: Accepted; supersedes QUNO-041's query URL representation and refines its documentation navigation
- Decision: Keep `/` as the Calendar introduction. Use `/calendar/{chapter}`, `/datepicker/{chapter}`,
  `/date-input/{chapter}`, `/timepicker/{chapter}` and `/parser/{chapter}`; omit the chapter for other product
  introductions. Normalize `/concept` and earlier `?product=...&demo=...` links to these paths, removing legacy
  navigation parameters while preserving unrelated queries and fragments. Path segments take precedence.
- Navigation: Keep history, reload, shared links and each tab's last chapter. Resolve client paths through the
  existing catch-all server rewrite. Product/chapter transitions retain the canvas and presentation state.
- Documentation: Remove archive links from the current docs index and product navigation. Retain the source
  snapshot and direct `/docs/archive/*` access. Keep guide chunks lazy, using an empty light placeholder with an
  accessible busy state instead of flashing “Opening documentation…” text. Preserve section-anchor restoration.
- Consequences: Verify path round trips for every authored scene, legacy query conversion, browser history and
  direct visits, desktop/phone geometry, absence of archive discovery links, and controlled delayed module loading
  with an empty full-height light surface. Package APIs and production library behavior remain unchanged.

## QUNO-043 - Share Left-Aligned Navigation And System-Themed Documentation

- Date: 2026-10-24
- Status: Accepted; extends QUNO-037 and QUNO-041, supersedes QUNO-042's always-light loading surface
- Decision: Use one product header for the concept, documentation index, and all current product guides. Keep
  desktop tabs and the destination link together at the left edge. Documentation opens the active product's guide;
  Demo returns to its concept introduction. Documentation tabs use links with an active-page state; concept tabs
  preserve their existing chapter memory. Keep the header visible above the independently scrolling guide, including
  while a lazy guide loads. Legacy `/guide/*` entries receive the same current shell.
- Appearance: Follow the browser's live light/dark preference for the shared header, documentation reading surface,
  index, supporting notes and empty loading placeholder. Authored interactive examples retain their explicit palettes.
  Preserve the independent archive snapshot and its presentation.
- Layout: Start current documentation at the shared header's left inset. At desktop widths of at least 1100 px, put
  live chapter links and Try it notes in a smaller 280 px right column with a 48 px gap beside the 720 px reading
  column. Wide Infinite Calendar examples extend rightward within the available viewport. Stack supporting content
  in reading order on smaller screens; retain copyable recipes, deep links and lazy calendar mounts.
- Consequences: Verify matching header geometry, links/active states, light/dark changes including delayed loading,
  persistent header/anchor geometry, right-column placement, mobile stacking, clipping and real example interaction.
  Public package names, classes, tokens, entry points and component behavior remain unchanged.

## QUNO-044 - Keep Guide Sections In Reading Order With One Instruction

- Date: 2026-10-24
- Status: Accepted; refines QUNO-043's supporting column and supersedes QUNO-041's current-guide chapter-link navigation
- Decision: Present each current guide section as a complete description with at most one Try it note, followed by
  its live demo and then its Implementation recipes. Align the note's bottom edge with the whole description on
  desktop, including sections with multiple paragraphs. Stack the note between the description and demo on smaller
  screens. Use a shared description row rather than floats or per-paragraph alignment.
- Editorial ownership: Keep performance verification details in ordinary prose and combine the React state and
  projection instructions into one note. Calendar sections group their description, instructions, exhibits and
  recipes explicitly so all implementations follow the section's demos in DOM and visual reading order.
- Navigation: Remove the Explore the interactions panel, its focused-sandbox link and all per-section Watch demo
  links from current guides. Keep Demo in the shared header as the return route, together with product navigation,
  All components and the section contents. Direct concept, focused-demo and archive routes remain available.
- Consequences: Verify every current guide on desktop and phone for single-note counts, full-description bottom
  alignment, demo-before-implementation order, absence of removed links, viewport fit and live lazy examples.
  Preserve browser appearance, copyable recipes, deep anchors, archive sources and public package contracts.

## QUNO-045 - Keep Test Startup Independent Of Demo Server Builds

- Date: 2026-10-24
- Status: Accepted; extends the clean-checkout verification around Infinite Calendar Decision 164
- Context: Vitest loaded the demo’s Vite configuration and eagerly bundled its server plugin before source aliases
  applied. CI ran unit tests before building the demo service, so the native package import’s generated JavaScript
  target was absent. Previously generated local files concealed the startup dependency.
- Decision: Give Vitest its own configuration with React, source aliases and the existing test settings. Keep the
  demo API middleware in the Vite configuration only. Share one project-alias factory between both configurations
  so public and private source imports retain their boundaries. Typecheck both configurations.
- Consequences: Unit and watch startup require no build, dist or dist-demo output, while dev/preview and deployed
  server builds retain their preparation steps. Keep every CI check and its existing order. Regress this with an
  isolated checkout that runs actual API tests and creates no generated output; retain clean deployment coverage.

## QUNO-046 - Keep The Main Demo Within The Available Mobile Width

- Date: 2026-10-24
- Status: Accepted; refines the responsive presentation in QUNO-038, QUNO-039 and QUNO-043
- Decision: Let the guided homepage shrink below the application’s legacy 320 px body minimum. Constrain its
  single grid column and product mount to the available width; give the content and product card zero automatic
  minimum width. Keep wide Calendar time/resource content scrolling inside its own viewport. The product menu
  may scroll inside its header when labels exceed the available phone width.
- Consequences: Verify actual document, visual viewport, canvas, component and drawer bounds in mobile Chromium
  through portrait/landscape resizing, month navigation, both calendar orientations, contents, disclosure and
  fullscreen. Include a 280 px layout viewport as well as standard phone widths. Keep public component styling,
  desktop presentation and the documentation/archive body minimum unchanged.

## QUNO-047 - Constrain The Inner Product Card Grid

- Date: 2026-10-24
- Status: Accepted; refines QUNO-046’s demo width containment
- Context: The outer card could shrink while its implicit grid column retained a child’s intrinsic width.
  Timepicker’s 360 px default then escaped a phone-sized card despite its public max-width: 100% rule.
- Decision: Give both direct and mounted concept product cards one explicit minmax(0, 1fr) column. Resolve child
  percentage limits against the available card content width rather than an expanding implicit track.
- Consequences: Check actual component and choice bounds inside the card as well as page bounds. Include
  Timepicker in mobile rotation, drawer and fullscreen checks, retain desktop component sizes and verify
  Datepicker, Date Input and Parser card geometry. Public component styles and contracts remain unchanged.

## QUNO-048 - Keep Statistics Free Of Instructions And List Actual Dependencies

- Date: 2026-10-24
- Status: Accepted; refines QUNO-004, QUNO-009 and QUNO-044
- Decision: Omit Try it notes from every current guide’s static production statistics section. Keep instructions
  on interactive examples. Represent dependencies as actual package names: React UI profiles list `react` and
  `react-dom` peers; the headless parser omits the Dependencies row because its list is empty. Keep Preact in
  Compatibility and retain the separate payload, stylesheet and runtime facts.
- Consequences: Verify all five statistics sections on desktop and phone for absent Try it notes, exact dependency
  names, an omitted empty row and contained description/statistics geometry. Public package behavior is unchanged.

## QUNO-049 - Keep Recipe Links Out Of Demo Popups

- Date: 2026-10-25
- Status: Accepted; refines QUNO-028's recipe navigation and QUNO-043's shared header
- Decision: Remove Read the recipe from every product's floating demo explanation and mobile drawer. Use
  Documentation in the shared header to reach the product guide and its implementation recipes.
- Consequences: Preserve chapter navigation, disclosure and playback. Verify desktop and phone popup bounds,
  reachable explanation text and header documentation links across all five products. Public APIs are unchanged.

## QUNO-050 - Put Demo Contents Between Previous And Next

- Date: 2026-10-25
- Status: Accepted; supersedes QUNO-035's two-button footer and header contents placement
- Decision: Place the contextual All demos button between Previous and Next in the shared guide footer. Remove
  its back arrow and keep its full product label visible on phones. Keep the title beside fullscreen and collapse
  controls. Hide the contents button while contents are open and hide the footer while collapsed.
- Consequences: Preserve contents selection, Escape dismissal, playback stopping and chapter navigation. Verify
  centered footer geometry, non-overlapping controls and 44 px mobile targets across all five products, including
  narrow phones and landscape. Public component contracts remain unchanged.
