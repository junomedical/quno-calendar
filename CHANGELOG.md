# Changelog

All notable changes to the combined package are recorded here. `Unreleased` remains first.

## Unreleased

- Resolve the restored booking function-contract blocker: helpers and callbacks use named object payloads, with matching consumer adapters. See the booking migration guide.

- Approve a 10.75 KiB Datepicker JavaScript gzip ceiling (11,008 bytes) for the current 10,919-byte build. This resolves the previously recorded 167-byte size overage; the booking function-contract blocker remains.

- Push preparation: 363 unit and 120 Chromium tests pass; Preact/React 19 and packed exports pass. Remaining blockers: booking positional function contracts and Datepicker gzip 167 B over its 10,752 B budget. Firefox/WebKit executables are not installed. Formatting has been corrected.

- Add optional `padDayNumbers` (default false); scheduling pickers opt into two-digit date numerals. Page CSS retains control of date weight.

- Fix available spillover dates inheriting core outside-month gray in landing pages; booking availability now restores normal text color.

- Give bounded Datepicker arrows a dimmed, pointer-inert disabled state and configurable size; public booking consumers use 32px arrows.

- Mute unavailable off-month booking dates by default, preserving consumer color overrides and available spillover dates.

- Public-booking theme verification: scoped tests/style assertions, typecheck/lint, library/demo builds, packed React/SSR/CSS/types, Preact compatibility and dry-run pack pass. Initial unit/Chromium timing failures pass on isolated rerun. Existing blockers remain: positional booking callback contract violations, unrelated repository formatting, and Datepicker gzip 142 B above its 10.50 KiB ceiling.

- Remove the unreleased public-booking appearance theme; consumers own date/time colors and selected text. Generic off-month styling and bounded navigation remain shared.

- Restore the shared booking picker and source comparison panel, with consumer-owned theming.
- Add optional Datepicker chrome and bounded month navigation for booking embeds.
- Verification blockers: formatting reports five files; standalone Chromium cannot bind 127.0.0.1:5173 in the sandbox; isolated package/Preact dependency installation did not complete.
- Verification blocker: `check:architecture` flags restored booking-picker positional function/callback signatures under the newer named-object-only library contract. Module-size checks, typecheck and lint pass.

- Merge current main named-object APIs and pointer responsiveness with release 1 timezone/DST behavior.
  The combined Infinite Calendar build is 163.08 KiB raw / 38.59 KiB gzip; its ceiling is 39 KiB.

### Fixed

- Clicking an imported event with seconds or milliseconds opens it without submitting a rounded move. Compare absolute start minutes and elapsed duration, retaining real time/resource moves and DST-fold identity.
- Preserve elapsed event duration when moving across DST; reject ambiguous pointer times and cancel invalid drawn selections. Infinite Calendar remains below its 35 KiB gzip budget (34.29 KiB measured).

### Added

- Added optional Infinite Calendar `settings.timeZone`, absolute-time-preserving pointer/navigation behavior, a live timezone recipe, and cross-browser-timezone geometry coverage.
- Added inclusive Datepicker `limitDateFrom` and `limitDateTo` selection bounds. Out-of-window dates are disabled before
  `isDayDisabled` runs, allowing consumer availability loaders to skip dates whose result is already known.
- Added Infinite Calendar `getDayProps`, `getHourProps`, and `getDayCellProps` with typed date,
  clock-hour, weekday, Today/weekend, calendar, and orientation context. Date-wide presentation covers the complete day
  and its visible header; hour presentation covers time bands and labels; resource presentation can override matching
  horizontal rows or vertical columns—including resource labels and headers. A dedicated field-guide chapter
  demonstrates weekend, lunch-hour, and equipment treatments separately from whole-calendar theming.
- Added Datepicker `isDayDisabled`, typed `isDisabled` day-cell context, native disabled state, and endpoint guards for
  click, paint, resize, range movement, single-day selection, and outside-month navigation. The field guide now shows
  delayed parent-owned availability with loading and failure states kept unselectable.
- Added a packed React 19 compatibility fixture that typechecks and builds all public products, mounts the virtualized
  calendar in a development browser, and rejects console warnings, errors, and page exceptions.
- Added six package-wide guiding principles to the four-product home: Clean, Focused, Impressive, Unbundled, Natural,
  and Preemptive.
- Added a user-resizable event-card container lab that demonstrates the renderer's width and height container queries.
- Added a focused React-controlled Infinite Calendar exhibit showing visible-calendar selection and zoom flowing through
  product-owned state while the calendar preserves its date and loaded content.
- Added a concise four-card project home for Quno/Infinite Calendar, Quno/Datepicker, Quno/Date Input, and Quno/Date Parser. Each
  primitive now has a dedicated field-guide route and a focused demo route linked by a visible Demo button.
- Added an All components link to every field-guide header so readers can return directly to the four-component
  project directory.
- Added the headless `@quno/calendar/date-parser` entry point and focused parser guide/playground for formats, preferred
  order, relative dates, week starts, ranges, expected periods, languages, lexicon extensions, and tokenization.
- Added natural-input support for `previous day/week/month/year` and relative weekday phrases such as `last Monday`,
  `this Monday`, and `next Monday`. Weeks and named weekdays respect the same configurable `weekStartsOn` contract as
  the datepicker.
- Added `this week` as the complete configured calendar week containing the reference date. Date input and headless
  parsing accept the datepicker's `weekStartsOn` values from `0` (Sunday) through `6` (Saturday), defaulting to Monday.

### Changed

- Gave overlapping availability deterministic lanes independent from appointments in both calendar orientations.
  Resource rows and columns now grow to the greater layer depth, and availability renderers receive meaningful
  `lane`, `laneCount`, and `isOverlapping` metadata. This intentionally changes geometry for resources with parallel
  availability windows without changing `CalendarEvent` or adding public configuration.
- Coalesced Infinite Calendar pointer previews, Datepicker captured-pointer painting, and quick-jump virtual scrolling
  to one latest-value publication per animation frame while preserving synchronous release and commit behavior.
- Reused unchanged event-bucket snapshots and date preparation, memoized static Datepicker structure, compiled Date
  Input analysis per configuration, and deferred ordinary recognition decoration without changing parser or input
  commit contracts.
- Updated measured ESM artifacts and accepted ceilings for the added responsiveness machinery: Infinite Calendar is
  37.56 KiB gzip with a 38 KiB ceiling, Datepicker is 10.47 KiB with a 10.5 KiB ceiling, and Date Input remains within
  its 8 KiB ceiling at 7.82 KiB.

- Accepted the cumulative object-contract and responsiveness tradeoff: Infinite Calendar's gzip budget is now 38 KiB
  (previously 34 KiB), Datepicker's is 10.5 KiB, and Date Input's is 8 KiB (previously 7 KiB); the other JavaScript and
  stylesheet budgets are unchanged.

- **Breaking:** Standardized public and private library functions on named object arguments, with native callback
  signatures preserved. Unified `formatters`, `renderEvent`, presentation getters, and `isDayDisabled`; moved timeline
  locale/formatting to component props, changed selection/zoom notifications to named payloads, and retained only
  `parserLanguages`. See `docs/shared/migration.md` for replacements; no deprecated aliases remain.
- Moved parser implementation and types into Date Parser, separated relative arithmetic from recognition and picker
  actions from shared date primitives, and gave shared runtime helpers one root entry point. Removed parser-private
  exports, duplicate input formatter types, repeated formatting/class-name helpers, and unused picker input CSS.
- Added function-contract and dependency-direction guards plus public consumer type tests; grouped input and parser
  tests under their owning products and updated all four live guides and compatibility fixtures.

- Raised the Infinite Calendar JavaScript gzip ceiling from 32 KiB to 34 KiB for the new presentation callbacks; the
  measured ESM artifact is now 136.83 KiB raw and 33.44 KiB gzip after composing day, hour, and cell presentation.
- Replaced the event-card resize lab's width and height sliders with one browser-native draggable corner. The demo's
  resize behavior, dimension limits, and responsive content changes are now fully CSS-defined.
- Removed the vague Public API at a glance row from all four production chapters and the redundant How we design
  eyebrow above the project home's Guiding principles section. Replaced the Datepicker contents label “Understand and
  ship the model” with the concrete state responsibility it links to.
- Repositioned the Datepicker field guide around direct range selection and clarified that its long-distance month
  navigator groups months by season while sticky year labels preserve context during fast scrolling.
- Reframed the project home and Infinite Calendar guide around an opinionated approach to date and scheduling UI, and
  simplified the calendar guide headline for complex schedules.
- Updated the Infinite Calendar field-guide exhibits so scrolled dates receive events immediately, Date Input Arrow
  Up/Down changes navigate without Enter, and the motion exhibit begins with New draft before Add or Cancel are enabled.
- Split the Datepicker field guide’s single-day chapter into a picker-only `selectionMode="single"` demonstration and
  a dedicated range-enabled Date Input composition. In the composition, the input replaces the selected-period summary
  and Clear action, the picker appears only while the control has focus, and typed ranges move the visible picker month.
- Unified the four field-guide production chapters around the same exact JavaScript, optional CSS, raw-size, budget,
  runtime, dependency, entry-point, and public-API presentation. Removed ambiguous combined gzip totals and replaced the
  Datepicker's repository-only reference with a browser-readable public API summary.
- Reorganized maintained documentation around Quno/Infinite Calendar, Quno/Datepicker, Quno/Date Input, Quno/Date
  Parser, and a shared package layer. Every product now owns a `README.md` and `decisions.md`, and repository rules
  require future decisions to be filed with their owning product.
- Kept the independently exported `dist` stylesheets formatted and readable instead of minifying them during the
  library build. JavaScript optimization and the separately built demo remain unchanged.
- Replaced the Datepicker single-day exhibit's duplicated standalone editor and read-only selection summary with one
  editable Selected day field that both typing and calendar picking update. The explicit-state cards now use a readable
  two-by-two layout instead of four narrow columns.
- Unified all four field guides on the warm Infinite Calendar editorial theme, shared page rhythm, product names,
  numbered contents, Try it callouts, and collapsible Implementation recipes. The Infinite Calendar guide keeps its 26
  focused topics as independently numbered chapters so unrelated demos are never grouped under one apparent task.
- Renamed the public surfaces to `@quno/calendar/infinite-calendar` and `@quno/calendar/datepicker`, and renamed the
  calendar facade to `QunoInfiniteCalendar`, `QunoInfiniteCalendarProps`, `QunoInfiniteCalendarHandle`, and
  `QunoInfiniteCalendarSettings`.
- Limited `@quno/calendar/date-input` to the component surface; parser functions and parser-specific types now come
  from `@quno/calendar/date-parser`.
- Replaced all parent-directory module imports with stable public, internal, demo, API, e2e, unit-test, and project
  aliases, and extended architecture enforcement across source and test code.
- Split the former combined `/guide` experience into feature-owned guides. `/guide`, `/story`, and the former
  integration-walkthrough route now preserve old bookmarks by forwarding to the infinite-calendar guide.
- Rebuilt the date-input field guide around single/range mode, flexible formats, relative dates, keyboard controls,
  range entry, expected periods, localization, date-picker composition, library size, and dependency contracts. Each
  topic now has a focused live example, Try it guidance, and a copyable recipe. Dedicated preferred-date-order and
  simultaneous multilingual-recognition chapters make ambiguous numeric and mixed-language input explicit.
- Replaced the infinite-calendar demo and field-guide date/time jump controls with the shared `QunoDateInput` in
  single-date mode. A committed date now navigates immediately without a separate time or Go control.
- Kept theme selection in the dedicated field-guide styling chapter instead of repeating it in the final demo.
- Prepared the combined package locally. Publishing and deprecating former package names remain separately authorized release actions.

### Removed

- Removed the redundant Import Date Input and Import Date Parser implementation accordions from their production
  chapters; the production facts continue to show entry points, optional CSS, runtimes, and public APIs directly.
- Removed the explanatory footer and main-demo link from the end of the Infinite Calendar field guide.
- Removed the old `timeline` and `date-picker` package subpaths and the old `QunoCalendar` facade names without
  compatibility exports.
- Removed the infinite-calendar demo sidebar's time input and Add event button. New appointments in the demo now begin
  by drawing directly on the calendar.
- Removed the Default, Compact, Planner, and Availability variant strip from the primary infinite-calendar demo. The
  dedicated styling chapter remains the place to try calendar themes.

### Fixed

- Prevented settled Infinite Calendar recentering from briefly painting uniform-height placeholder dates over already
  measured variable-height days, which could make availability-expanded rows jump and then return.
- Kept compact overlapping availability labels inside their card bounds by using a single-line lane label and removing
  secondary content at mini-lane sizes.

- Kept the native virtualizer item-key adapter stable across renders during the object-contract migration, preserving
  navigation and dense-layout anchoring. Made five existing browser scenarios independent of the machine clock by
  fixing their browser date/time to a working-day morning; the same five failures were reproduced on unchanged HEAD.

- Kept focused Date Input calendar popups open when their off-screen Start or End shortcuts are clicked. Popup
  compositions now retain internal pointer intent while classifying the blur before the clicked shortcut navigates.
- Kept external create drafts anchored to their drawn date while the participant list is empty; the demo now shows its
  normal calendar set, hides the unassigned preview, and preserves checkbox focus until a participant is selected.
- Removed React 19's synchronous virtualizer-update warning by using TanStack Virtual's queued notification path, and
  aligned internal refs with both React 18 and React 19 type contracts.
- Kept parent-reviewed moves to another visible date or resource at their viewport-relative row instead of snapping the
  row to the top, and restored the original event and view when a proposal is cancelled.
- Made every English, German, and product-vocabulary sample in the Date Parser language exhibit resolve to a different
  visible day or range, so switching examples now demonstrates the parser output instead of repeating the same date.
- Kept the Datepicker range-summary Clear action compact in the Acid and Candy field-guide themes instead of inheriting
  the editorial 20px type scale and expanding to roughly 50px high.
- Restored the Datepicker field guide's selected-period input that opens the range picker and edits the same controlled
  range through typing or picking. Its composition example recognizes the documented `12 juni – 18 juni` phrase
  through simultaneous English and German parsing.
- Kept visible Infinite Calendar days, resource rows, and committed events mounted through every painted frame when a
  drawn appointment is cancelled. Programmatic anchor corrections now publish the matching virtual range before the
  browser can paint an empty intermediate viewport.
- Made the focused Date Parser demo recognize its English and German sample phrases together by default. The visible
  `12 June 2026 – next Monday` sample now resolves as a range instead of becoming invalid under a mismatched language
  setting.
- Vertically aligned the shared All components and Demo actions with each field guide's eyebrow and added deliberate
  breathing room between that header row and the guide title.
- Restored full chapter spacing after Infinite Calendar preview exhibits. The familiar date-navigation example now
  relies on its accessible input name instead of a visible "Go to date" label and renders the entered date at a
  readable 13px size.
- Kept the Datepicker's month and year controls at their component-defined type sizes inside field-guide exhibits. The
  shared editorial heading scale is now limited to direct guide headings instead of cascading into live components.
- Focused the date range picker on the changed date when a composed date-input update modifies only one range endpoint.
  Multi-endpoint updates retain the nearest-off-screen fallback.
- Kept the first event drawn immediately after opening a React Strict Mode calendar at its pointer position. Strict
  Mode effect replay no longer clears the mounted viewport geometry registry before the parent can capture the draft
  slot anchor.
- Made the normal showcase load events immediately so a quick fresh-open create/cancel flow is not followed by the
  former one-second bulk event paint. Delayed API modes remain available as explicit loading demonstrations.
- Prevented a pending idle virtual-window recenter from rebuilding the visible calendar while an appointment draw or
  drag remains held. Interaction start now cancels the old deadline, and the callback reads live gesture ownership.
- Reused loaded date buckets when a calendar selection narrows to an already covered participant subset and then
  returns. Active-draft row filtering also retains the settled warm window while keeping the draft and navigation-anchor
  dates prefetched, so drawing and cancelling no longer triggers redundant event API requests or a delayed cache
  repaint while preserving intentional participant-only draft projection and real navigation loading.
- Isolated the single controlled-draft shell as its own paint and opacity-compositor boundary before cancellation. The
  draft can still fade out, but its delayed removal no longer repaints the restored calendar surface.
- Kept overlapping appointments in stable caller order when they share a start time and one is dragged or edited.
  Same-date cache patches now retain the event's existing slot, and changing its duration no longer changes its lane.
- Kept visible workday and event nodes mounted when weekend exclusion replaces the virtual date sequence. Calendar-count
  changes now retain the visible resource-local position instead of snapping to the date header and sweeping unrelated
  event rows through the viewport.
- Kept the visible date, resource rows, and event nodes mounted when idle maintenance resets the bounded scrollbar
  around its center. The equivalent scroll position and replacement month-window anchor now commit without a painted
  intermediate date tree.
- Kept an in-progress controlled single-date input draft intact across unrelated parent rerenders.

## 0.6.0 - 2026-08-24

### Added

- Added independent `@quno/calendar/timeline`, `@quno/calendar/date-picker`, and `@quno/calendar/date-input` UI entry points, their optional stylesheet subpaths, and a headless shared root.
- Added React and packed-package Preact compatibility coverage, independent feature budgets, a canonical `/guide`, composition exhibit, migration guide, and unified usage guide.

### Changed

- Consolidated the existing calendar, picker, and natural input into one React-authored package while preserving timezone-free picker behavior and timestamp-based event semantics.
- Renamed the timeline facade to `QunoCalendar`, `QunoCalendarProps`, `QunoCalendarHandle`, and `QunoCalendarSettings` with no legacy exports.
- Standardized scoped timeline, picker, input, and shared token/class naming.

### Documentation

- Preserved calendar history below and the former datepicker’s accepted `QDP-*` decision record in `docs/date-picker-decisions.md`. The former datepicker `0.1.0` development record is represented by its migrated picker, input, parser, story, and test contracts in this release.

## 0.5.0

- Renamed the public package and product to Infinite Calendar. Consumers now install and import
  `infinite-calendar`, including its `infinite-calendar/styles.css` stylesheet subpath.
- Renamed generated library artifacts and the UMD global to match the new package identity, and removed obsolete
  repository metadata tied to the former name.

## 0.2.0

- Centralized calendar-library defaults in one internal palette and exposed inherited semantic CSS-variable overrides,
  allowing consumers to theme both orientations through a scoped class, ancestor, or the type-safe `CalendarStyle`
  inline contract without repeated color literals in rendering code.
- Replaced Prettier with OxFmt for project formatting. The existing line-width, trailing-comma, and ignore rules now
  live in the checked-in `.oxfmtrc.json` configuration; `npm run format` checks formatting and `npm run format:write`
  applies it.
- Replaced deeply nested internal library imports with the explicitly private `#calendar-internal/*` source alias and
  added architecture enforcement so cross-domain imports no longer depend on directory traversal depth. The mapping
  avoids deprecated `baseUrl`, and Vite ambient types now cover source CSS imports in strict editors.
- Exported the canonical `CalendarView` orientation type so consumers do not
  duplicate the library-owned horizontal/vertical view union.
- Made controlled Shift-wheel zoom and virtual scrolling avoid synchronous React updates during active render work.
- Fixed dense 5,000- and 20,000-events/year calendars jumping to another day after weekends were hidden and a drawn
  appointment was cancelled. Weekend filtering now restores the semantic date after the virtual sequence settles, and
  draft collapse/expansion keeps the draft date until exact row anchoring completes.
- Fixed Vercel deployments by building and publishing the runnable `dist-demo` application instead of the library-only
  `dist` artifact, added SPA route fallback, and added a production `POST /api/demo-events` function for hosted demos.
- Reframed the walkthrough’s closing package-size chapter around the 32.53 KiB gzip transfer payload, with raw sizes
  secondary and external runtime and peer dependencies explicitly excluded from the package total.
- Rewrote the 25-chapter walkthrough with plain, benefit-led titles and direct problem statements before behavior or
  implementation details. The introduction now presents Infinite Calendar as an existing simple, fast solution for
  businesses with complex schedules, names the real scheduling problems it was built to solve, and gives the guide a
  more realistic 20-minute reading estimate. The final narrative now begins with why Infinite Calendar exists, moves from its
  vertical/infinite foundation through rendering and interaction features, and closes with the full demo, dependencies,
  and package size.
- Fixed the walkthrough parent-owned mutation exhibit so drawing uses the draft-only callback. Reviewing a new
  appointment no longer inserts a local fallback event, and accepting it now produces exactly one committed card.
- Removed completed rewrite and refactor plans, the superseded initial project brief, empty retired example/test
  directories, and local generated artifacts. Maintained architecture guidance remains in `docs/architecture.md`,
  `docs/domains`, and `docs/flows`.
- Added locale-aware horizontal and vertical date labels through `settings.dateLocale`, plus the exported
  `DayNameGenerator` contract and `settings.dayNameGenerator` override for complete product-defined date labels.
- Added a walkthrough localization chapter comparing English and Japanese labels with interactive human-relative and
  binary robot generators while preserving the live calendar instance.
- Removed the redundant day/month and day/month/year choices from the walkthrough localization exhibit.
- Fixed the walkthrough availability lab so appointment mode creates appointments, availability mode visibly marks and
  creates availability, and availability drag/drop completes through parent-owned state. Active/status labels now
  precede their related example buttons.
- Reworked the walkthrough mutation exhibit into an explicit review flow: dragging or drawing stages a visible
  parent-owned draft, then Accept commits it while Cancel restores the untouched saved data.
- Aligned both orientations in the walkthrough overlap-lane comparison to the same collision window, keeping the dense
  13:00 events visible when switching to vertical mode.
- Enlarged the walkthrough motion exhibit around its active 09:00–14:00 range with higher zoom and a taller event lane,
  making appearing and cancelled card treatments easier to see.
- Added a walkthrough custom-card chapter where the same treatment events can promote product group, patient name, or
  room number without moving or remounting their calendar shells.
- Fixed the walkthrough mutation review transitions: Cancel now releases the staged draft with its fade-out animation,
  while Accept clears the draft before committing the saved card with its appearing renderer status.
- Added a visible loaded-events strip to the walkthrough preloading lab, showing the prefetched event and its date/time
  before navigation places its shell in the calendar viewport.
- Sharpened the walkthrough’s horizontal-first rationale around time-of-day placement, denser simultaneous visibility
  for people/resources/rooms, and low-effort vertical navigation through mouse-wheel and touchpad scrolling.
- Reframed the walkthrough zoom chapter around smoothly moving between daily context and precise placement when needed,
  while preserving the visible time instead of referring abstractly to “the product.”
- Fixed calendar show/hide relayout to preserve the top visible date and align its date header after resource geometry
  settles.
- Gated drawing and dragging by their parent callbacks, preventing orphan interactions in read-only, vertical planner,
  responsive sizing, and create-only availability examples.
- Added declarative and imperative event focus coordinated by `QunoCalendar`, automatic requests to reveal known
  participant calendars, local `focused` renderer status, and cancellation on manual navigation.
- Refined event focus as a visibility guarantee: fully visible shells are highlighted without scrolling, while clipped
  or offscreen shells are brought into the uncovered calendar viewport.
- Fixed event focus with excluded weekdays so a hidden target resolves unavailable without jumping to the next
  included date or reporting a false focused state.
- Fixed repeated focus of an already-visible preferred participant so it anchors from that local instance rather than
  repeatedly translating another participant’s position and drifting the target out of view.
- Changed the default demo status pane into a bounded six-entry activity log and added popup-cancel scroll-reset
  requested/skipped entries plus coalesced viewport scrolled/repositioned telemetry.
- Removed the `View example source` link from the default and preset showcase sidebars.
- Placed dataset size and simulated API delay controls on one shared row in every showcase sidebar.
- Consolidated the former standalone example routes into the editorial integration field guide, added a 14-chapter
  table of contents, and linked the guide from the main demo. Rewrote the article narrative to lead with the product
  value of stable memory, explicit data ownership, renderer extensibility, safe interaction layers, and visual
  continuity before explaining each live control.
- Populated the single-doctor creation exhibit across adjacent weekdays so narrowing to one doctor reveals more of that
  doctor’s schedule instead of leaving later dates empty.
- Made article add/draft actions navigate their newly inserted event into view, and raised the sticky time-scale context
  above per-day marker segments so the current-time line begins below its circular pin instead of showing a stem above
  it.
- Stopped article event-card spans from clipping their own line boxes. Short shells now remove time and subtitle lines
  progressively, preserving complete visible lines inside the card.
- Added selectable TSX syntax coloring to the article code blocks while preserving plain-text clipboard output.
- Moved the progressive time-precision label to the left of its overview, quarter-hour, and five-minute controls.
- Expanded the editorial field guide to 25 chapters with a four-to-hundreds-of-events performance design envelope,
  60–120fps scrolling target, CSS-native sticky-chrome exhibit, dedicated current-time reference, immediate date/time
  inputs with previous/next/Today controls, progressively revealed time-label precision, three settings-plus-CSS
  styling presets, and a final composed calendar combining navigation, zoom, overlap, mutations, animation, theming,
  and full-screen use. Added a closing production-footprint summary with raw and gzip ESM/CSS sizes plus direct, peer,
  and bundled dependency counts.
- Added a chapter 00 overview explaining why the primary calendar maps time and event text horizontally while days and
  resources move vertically: denser readable cards, local overlap growth, and lower-effort day navigation.
- Expanded the event-card chapter with CSS container-query guidance and a live comparison of the same renderer in
  roomy, horizontally squeezed, and vertically squeezed event shells.
- Renamed the progressive time chapter to “Progressive time reveal” to describe the visible behavior more directly.
- Made long-distance table-of-contents navigation jump directly to its chapter so lazy exhibits mounted along a smooth
  scroll cannot displace the requested destination.
- Added `removeVisibleEvent(eventId)` for immediate multi-calendar cache deletion without a range refresh.
- Replaced the eight-step integration walkthrough with a Medium-style interactive article covering settled infinite
  scrolling, external event cards, controlled and pointer-anchored zoom, overlap lanes and hover handoff, delayed stable
  loading, single-doctor creation, progressive React usage, and renderer-owned add/cancel motion. The route is
  unchanged, legacy `?step=` parameters are ignored, date labels are compact and single-line, a settlement chip reports
  scrolled/repositioned state, and every live calendar expands without remounting through a shared viewport overlay.
- Expanded the editorial field guide with replayable added-event and cancelled-draft card specimens, a live
  availability-layer switch that makes normal cards inert during availability editing, and an event-focus lab that
  keeps saved cards visible through draft replacement and five-lane overlap recomputation without unnecessary scroll.
- Fixed narrow event shells in the editorial examples so short-duration events switch to a wrapped title-only
  presentation instead of clipping four metadata lines inside the shell.
- Embedded read-only and drag/create recipes directly in the editorial guide, added a delayed warm-window preloading
  lab with visible request ranges, and changed the covered-event hover exhibit to the horizontal resource-row
  direction.
- Prevented transient white/missing availability tiles during rapid zoom by coalescing direct slider projection to one latest-value update per animation frame and replacing broad calendar paint containment with stacking isolation plus the existing overflow clip. Availability shells and renderer content now have explicit minimum-zoom DOM/layering regression coverage.
- Removed repeated source ownership banners and retired source-text policy scripts in favor of folder-owned domains plus executable type, unit, browser, and architecture checks. Shared availability/draft/preview projection now uses one state layer with small orientation geometry adapters. Runtime behavior and the public API are unchanged.
- Changed the default event prefetch window from an adaptive rendered-day buffer to seven calendar days before and after the rendered dates; custom `eventPrefetchPolicy` behavior is unchanged.
- Isolated controlled demo zoom projection from the sidebar readout, coalesced raw mouse-wheel/touchpad bursts to one accumulated projection per display frame, and deferred native slider/text updates until the gesture tail settles. Replaced full-sidebar paint containment with a stable sidebar compositor layer plus narrow zoom-control and stats child layers, stabilized time scales with always-mounted tick nodes on percentage tracks, and hardened horizontal and vertical zoom-out anchoring against pre-commit browser/virtualizer clamping. Vertical zoom now retains the semantic visible-date window while measurements settle, preventing a blank or wrong-date frame. Zoom no longer redraws surrounding settings UI or inserts a burst of tick elements when fine cadence activates. Added a repository zoom-stability check and Playwright child-list/DOM-identity regression coverage.
- Moved the demo application and examples out of `src/`; `src/` is now library-only. The historical per-recipe catalog
  has since been consolidated into one documented editorial field guide with public-package imports.
- Rebuilt visible-range loading as a non-blocking stale-while-refresh pipeline with abort signals, out-of-order response protection, finite retries, a 120-date LRU, and indexed single-event patches.
- Added policy-driven adjacent-date prefetching, public `eventPrefetchPolicy` customization, loaded/in-flight deduplication, and separate requests around cached gaps.
- Replaced repeated overlap scans with deterministic `O(n log n)` prepared cells shared by metrics and horizontal/vertical projection.
- Added cross-axis resource virtualization so 50-resource dates mount only visible rows or columns plus two-resource overscan while preserving full scroll geometry and pinned drafts.
- Replaced selector polling and restore timeout ladders with an instance geometry registry and one cancellable animation-frame restore scheduler.
- Consolidated mouse/pointer interaction paths into Pointer Events with explicit pointer-cancel, Escape, callback-failure, and rejected-drop cleanup.
- Split horizontal/vertical wheel zoom, interaction state, layout primitives, cache coordination, styles, demo controls, presets, routes, and external-draft responsibilities into focused modules.
- Added `signal?: AbortSignal` to `LoadEventsArgs`; existing loaders remain source-compatible.
- Removed `date-fns` from the shipped library runtime and replaced it with tested local-date and `Intl` helpers.
- Changed packaging to emit explicit CSS without JavaScript style injection; Node/SSR ESM and CommonJS imports no longer access `document`.
- Externalized the declared React virtualizer dependency from the library artifact, reducing ESM output below the 32KiB gzip budget without duplicating an installed runtime dependency.
- Replaced repeated demo route/variant implementations with declarative route registries and shared preset shells while preserving all public examples and routes.
- Added a copyable delayed/cancellable API example that demonstrates immediate grid rendering before events resolve.
- Added focused cache, cancellation, membership-index, prepared-layout, resource-window, native-date, package-consumer, and SSR verification.
- Made participant-driven draft anchor restores yield synchronously to manual pointer, wheel, touch, or scroll-key intent.
- Pinned active restore targets across resource virtualization and normalized draft/date pins and demo range filtering through local calendar dates instead of raw timestamp prefixes.
- Changed Pointer Events hit identity to use mounted date/resource grid metadata, preventing async variable-row measurement from targeting a neighboring resource.
- Applied the interaction selection lock through standard and WebKit properties so drag/draw suppression is consistent in Safari.
- Made horizontal slider/external zoom preserve a visible current-time marker before paint, falling back to the visible grid-center time after horizontal scrolling (or the left edge at the timeline origin); retained prepared event models across zoom-only changes and isolated product-card rendering from event-shell geometry updates.
- Added an explicit late-data layout anchor: unloaded date navigation keeps the date header fixed, mid-date scrolling keeps the same resource/local-row point fixed as overlap rows grow, and newly arriving events never steal focus.
- Added decomposed runtime flow guides with detailed diagrams for async loading and cache commits, semantic focus during metric changes, virtual scrolling/recentering, pointer interactions, and zoom subflows.
- Reorganized the runtime into responsibility-owned `scroll`, `events`, `anchors`, `interactions`, `rendering`, and `views` domains; removed the generic hooks/utilities/component buckets without changing the public API.
- Added domain ownership documents with a complete source-file map and source backlinks, plus an architecture check that rejects missing documentation, retired folders, and invalid dependency direction.
- Added a local `POST /api/demo-events` mock transport, an abort-aware API-delay selector, and pending-request status to the main and preset demos. The main demo starts with a visible 1-second HTTP response; instant, 250ms, 1s, and 3s options demonstrate non-blocking rendering and cancellation.

## 0.1.0

- Renamed the package to `infinite-calendar`, added MIT licensing metadata, package exports, peer dependency declarations, ESM/UMD library build output, generated TypeScript declarations, and the `infinite-calendar/styles.css` stylesheet subpath.
- Narrowed the public package entrypoint to `QunoCalendar`, public types, `defaultQunoCalendarSettings`, and event membership/move helpers.
- Added `className`, `style`, `ariaLabel`, and `initialDateKey` props to the shared calendar surface.
- Split shared timeline setup, hit-testing, wheel zoom anchoring, drag lifecycle, and draft lifecycle into focused hooks.
- Split reusable infinite-calendar CSS into shell, horizontal layout, event-shell, and vertical layout files while preserving the existing import path.
- Added release quality tooling for typecheck, ESLint, Prettier, library/demo builds, package verification, and GitHub Actions CI.
- Added release-facing README, rewritten usage recipes, a trimmed architecture overview, and the public integration
  field guide under `/guide/timeline`.
- Added Playwright coverage for the integration field guide and its link from the main demo.
- Added parent-controlled external create/edit support with `activeDraft`, `onEventDraftRequest`, and `onEventActivate`.
- Added public viewport-anchor helpers on `QunoCalendarHandle` so parent forms can preserve event or slot position without demo-owned DOM anchoring.
- Added `releaseActiveDraft` on `QunoCalendarHandle` so parent forms can clear a controlled draft while the calendar fades out the last draft shell in place.
- Added `commitVisibleEvent` on `QunoCalendarHandle` so parent-owned saves can patch one committed event into the loaded visible cache without a range reload.
- Added an `appearing` event renderer status for newly committed visible events and a demo save glint that sweeps a hard-edged diagonal white reflection across the card.
- Added `appearingEventIds` so parent-owned save reloads can highlight only the committed event instead of every previously unseen created record in the reloaded range.
- Changed released draft fadeout so `durationMs` controls the visual fade duration for cancelled controlled drafts.
- Changed external save to patch the saved event directly into the visible cache instead of invalidating and reloading the range, preventing duplicate save glints and follow-up jumps. The demo appearing glint now sweeps in 485ms.
- Added a default-demo external event popup that edits title, date/time, duration, and participants while keeping the calendar scrollable.
- Added active-draft dragging through `onActiveDraftMoveRequest`; popup time fields update during drag and multi-calendar drafts move as one participant block.
- Changed drawn creation in the default demo to delegate to the external popup before saving, while preserving immediate-create fallback through `onEventCreateRequest`.
- Refined the external popup participant flow so empty participant lists keep the previous calendar set visible and disable save, while edit popups do not filter calendars until participants change.
- Changed empty active-draft participant filtering to retain hidden inert placeholder rows or columns instead of showing fallback calendars or collapsing the draft layout.
- Preserved the loaded event cache across selected-calendar filter changes so draw-to-popup handoff does not briefly blank calendar content while the filtered range reloads.
- Kept the default demo's full selected-calendar event range warm while an external draft filters visible rows, preventing empty expanded rows and a follow-up position correction on cancel.
- Raised the default external create/edit popup above the current-time marker.
- Changed accepted drag/drop moves in the default demo to update parent data without bumping `eventVersion`, avoiding a full visible-range redraw after drop.
- Blocked drawing a separate grid range while an external popup draft is active.
- Preserved drawn draft position when the external popup opens and hides other calendars, and kept saved or cancelled events anchored when the popup closes.
- Smoothed the drawn-create handoff so the controlled external draft takes over without a one-frame position jump.
- Changed popup field edits so visible drafts update without scrolling, while offscreen drafts are restored to their last seen viewport position.
- Fixed same-anchor date navigation so popup field edits can focus an active draft even after the user scrolls elsewhere inside the current virtual window.
- Fixed edit popup cancel anchoring so cancellation restores focus to the original first person's event instance and preserves its viewport-relative position even after draft participant changes.
- Changed bounded virtual scrolling to recenter after a 1.2s idle delay and to schedule that recenter even when the immediate scroll event fires before new virtual items are mounted.
- Reduced bounded-window recenter delay by 80% at the absolute scroll top and bottom, from 1.2 seconds to 240 ms, while
  preserving the ordinary interior delay and exact visible-date offset.
- Fixed dense 5,000-events/year draw-to-popup handoff so participant filtering does not move the controlled draft out of focus.
- Fixed viewport-anchor restore so missing mounted targets navigate to their date/time immediately, preventing a visible wrong-date flash before delayed recenter correction.
- Added simulated delayed external saves in the default demo, including deterministic validation failures that keep the popup editable with a bottom error message.
- Fixed visible-calendar changes so reducing the calendar list keeps the active day visible instead of letting the old row offset jump into later dates.
- Pinned the active draft date during virtual relayouts without replacing the current scroll anchor, so visible participant-row changes no longer park the draft in the viewport center.
- Fixed create popup cancel anchoring so closing a draft preserves the drawn calendar row's viewport-relative position while internal virtualizer relayout scrolls are ignored.
- Fixed create popup cancel anchoring after participant additions so the originally drawn calendar row remains the restore target instead of the first visible participant instance.
- Fixed future-date create cancel after adding several participants so the viewport does not briefly jump to earlier dates before returning to the drawn date.
- Fixed repeated draw-after-cancel anchoring so a new draft on the same date/calendar row does not inherit a stale cancel restore and jump upward.
- Changed `Shift` + wheel zoom to anchor around the rendered time-grid node closest to the mouse in both horizontal and vertical timeline views.
- Fixed vertical `Shift` + wheel zoom burst handling so the first focused time node remains anchored, stale delayed restores are ignored, immediate trackpad wheel momentum after releasing Shift is captured, and normal wheel scrolling resumes after the brief tail.
- Fixed vertical `Shift` + wheel zoom near the bottom of a day so the anchor clamps to the configured timeline end instead of an off-hours node.
- Added a horizontal render-time viewport-fill zoom floor so the timeline board does not become narrower than the available screen area even when the controlled zoom value is lower.
- Added `/demo1`, `/demo2`, and `/demo3` demo routes with compact horizontal, wide vertical, and availability-first event-card treatments.
- Kept the additional demo routes fully interactive, including calendar orientation and availability-mode switching.
- Added vertical column sizing settings for base width, overlap-lane capacity, overlap growth, and hover minimum height.
- Added `view="infinite-vertical"` with calendars as left-to-right columns, vertical time zoom, sticky left time pane, today's horizontal current-time marker, and full event interaction parity.
- Named the horizontal orientation `view="infinite-horizontal"` and the vertical orientation `view="infinite-vertical"`.
- Added a demo calendar-type switch and vertical column growth for dense overlaps.
- Changed the vertical view to keep per-day date and doctor-name headers top-sticky, keep date/time labels left-sticky, format vertical hour labels as `H:00`, use a 240px base calendar-column width, fit three parallel events before +80px overlap growth, and expand hovered appointments to full column width.
- Removed synchronized vertical header switching and changed the vertical time pane to sticky-left only, so headers pin naturally and time labels scroll vertically with events.
- Changed vertical hover hit-testing so expanded appointment cards do not block focusing underlying overlapped events.
- Changed vertical date labels to smaller two-line text with weekday on the second line.
- Changed the vertical date/time pane to 30% narrower than the horizontal label width, added 8px top/bottom time padding, and kept hovered card typography from inheriting compact line-height reductions.
- Fixed vertical zoom changes so the current visible date stays anchored instead of jumping when the day height changes, including gesture zoom that would otherwise restore stale scroll pixels.
- Changed standard demo event-card backgrounds to use a muted version of the same color as the left accent border.
- Added greenfield Vite React TypeScript PoC.
- Added reusable `QunoCalendar` and `InfiniteTimelineView` components.
- Added async range loading, virtual date rows, fixed row labels, horizontal timeline zoom, current-time line, overlap layout, drag/drop previews, and drawn new-event drafts.
- Added deterministic demo datasets from 100 to 20,000 events per year.
- Added usage, architecture, decision, brief, and test documentation.
- Added Vitest and Playwright coverage.
- Added a single sticky top time scale, CSS-sticky per-day date labels, all-day current-time markers with one top pin, date navigation controls, scroll anchoring across calendar-count changes, larger virtual overscan, and row-position-based overlap hover behavior.
- Updated the demo event renderer to own its internal height with CSS container queries, hiding lower-priority details before reducing title font size in short event cards.
- Changed drag rendering so the original event remains as a shadow in the stable row layout while a separate time-width-correct preview card moves over the calendar.
- Changed sticky headers to use CSS sticky positioning inside the scroll container, and kept demo drag/drop event colors stable while still passing drag/drop status to renderers.
- Restricted create/move interactions to timeline grid space and disabled hover expansion under an active drag preview.
- Expanded deterministic demo treatment and patient-name pools, and made hover width expansion use shell-level CSS min/max sizing instead of JavaScript overflow measurement.
- Stabilized dataset scale changes by remounting the infinite calendar for new generated datasets, memoized event shells to avoid re-rendering unchanged external event components on drag end, and kept the demo event loader stable across move updates.
- Removed width caps from new-event draft rendering and allowed already-wide hovered events to use a wider max width than the standard 250px cap.
- Made per-day date labels sticky on the left during horizontal scroll, added controlled `onZoomChange` support, and wired `Shift` + wheel over the calendar viewport to zoom the horizontal time scale.
- Added repository-level agent notes requiring behavioral/API changes to update project Markdown documentation.
- Inserted newly created drawn events into the loaded visible cache after `onEventCreateRequest`, so the created appointment remains visible after mouse-up.
- Changed day headers to full-width gray day bands with sticky-left date labels, matching the reference layout more closely.
- Kept the current-time red line and top pin on the same natural timeline column so the marker moves with horizontal timeline scroll and connects visually through the time scale.
- Added optional multi-calendar event membership with `calendarIds`; demo events now render as doctor plus room appointments.
- Synchronized drag/drop-preview status across every visible instance of the same multi-calendar event.
- Removed colored calendar-row strips and moved color coding to a thicker event-card left accent border.
- Limited multi-calendar hover expansion to the row instance under the pointer while keeping drag/drop-preview shared across related rows.
- Removed event resize/focus transitions so event size changes apply immediately.
- Cancelled native scrolling during `Shift` + wheel zoom and kept the current-time marker on the same natural timeline coordinate as the grid.
- Added row-height growth when loaded overlap depth exceeds three lanes.
- Restored the time scale as the top sticky layer above day date bands.
- Allowed dense overlap mini-lanes to continue shrinking when row height is still too constrained.
- Changed hover expansion to grow from the event's original row slot so dense-dataset cards do not disappear under sticky day bands.
- Distributed deterministic demo events across every demo calendar to avoid large-dataset hot spots and keep the 5,000 and 20,000 events/year scales visible.
- Changed overlap-driven row growth from one global loaded maximum to per-date/per-calendar row heights, so a dense row no longer inflates every day in the virtual list.
- Switched variable day sizing to cheap base estimates plus measured rendered day elements, avoiding expensive date walks across the full virtual range.
- Changed the demo current-time source from a hard-coded timestamp to live system time, and raised the current-time marker layer so the red line renders above events and connects to the sticky header pin.
- Added `kind: "availability"` support as a full-row, half-transparent background event layer that does not affect overlap row height and allows draft/new events to be drawn on top.
- Changed overlapped hover expansion to fill the row from the top, so bottom-lane events can expand to a larger readable card.
- Pushed known variable day heights into the virtualizer so the last calendar row does not overlap the next date row while measurements settle.
- Added an `interactionMode` API and demo "Availabilities" switch. Availability mode makes availability blocks draggable/creatable and renders appointments as inactive background context.
- Changed demo generation so provider availability repeats by weekday window and generated appointments are scheduled inside the primary calendar's availability window.
- Moved the sticky date label into the same top row as the time scale and raised left-label stacking so active availability blocks cannot cover calendar names.
- Added a third event-card line showing the event time range in `H:mm–H:mm` format.
- Changed compact event cards to hide the time line first when three lines do not fit, revealing it again when hover expansion gives the card enough height.
- Changed vertical virtual scrolling to a recentered two-month window around the visible date, with one month above and one month below the current anchor.
- Preserved the intra-day pixel offset during scroll-end recentering so the page no longer visibly jumps back to the date header.
- Added adaptive time labels that drop 15/45 minute labels first and then all minute labels at dense zoom levels.
- Added native `scrollend` handling and same-anchor reset logic so dragging the scrollbar thumb recenters the scrollbar after release.
- Added demo sidebar rendering stats for average redraw frame time and visible event DOM-node count.
- Replaced zoom stepper buttons with a `0.5-8` zoom slider and aligned wheel/settings clamps to that range.
- Changed high-zoom row grid cadence to 5-minute columns when zoom is greater than `6`.
- Added high-zoom 5-minute time labels while keeping hour labels as plain numbers.
- Decomposed `InfiniteTimelineView` into focused render components and hooks for event loading, virtual scroll windows, row/day metrics, time scale rendering, and event shell rendering.
- Added `docs/refactor-plan.md` to track remaining module splits toward the 100-200 line target.
- Grouped source files into responsibility folders under `src/lib/core`, `data`, `date`, `interaction`, `layout`, `time`, and `infinite`.
- Added JSDoc to public/helper functions and code-to-doc `@see` links for the rendering architecture.
- Reworked architecture data flow into grouped rendering, virtualization, async loading, layout, interaction, sticky header, and zoom sections with Mermaid diagrams.
- Changed day header bands to continue their gray background across the timeline while staying below the sticky top time scale.
- Restricted draft creation and drag/drop hit-testing to row-grid cells only, so clicks on time labels, day headers, date labels, and calendar labels do not interact with the calendar.
- Added an 8px left timeline gutter and centered time labels on their grid lines.
- Rendered minute labels as superscript, clipped the time header away from the sticky date label, and hid 15/45 minute labels below zoom `2`.
- Changed time labels to left-align from their grid line instead of centering over it.
- Added Playwright visual-layer assertions for sticky date headers, full-width day bands, time-scale clipping, and current-time marker z-index/geometry.
- Made the time-scale clipping boundary follow horizontal scroll so timeline labels cannot slide under sticky date labels.
- Added `scrollToDateTime(dateKey, time)` navigation and a demo time input beside the date jump control.
- Filled the left timeline gutter with the same grid-cell styling and fixed availability widths so timeline-start availability does not lose the gutter width.
- Split global CSS into base app styles, demo shell styles, demo event-card styles, and reusable infinite-calendar library styles imported by the owning modules.
- Added explicit bottom borders to sticky date/calendar-name labels so horizontal scroll cannot show through 1px transparent seams.
- Moved Vitest unit tests out of `src` into a mirrored `tests/unit` tree.
- Narrowed scroll-aware clipping to the time-label layer and separated current-time marker layering from time-label clipping.
- Changed current-time marker stacking so sticky date/calendar labels render above the red cursor while the cursor remains above timeline grid data and event cards.
- Moved body current-time lines into row grids and render sticky day headers after rows, preventing row labels from painting into the top sticky date/header band.
- Normalized calendar shell, sticky labels, row dividers, and timeline grid lines to the same 1px gray border token, with Playwright coverage for the shared border color and marker clipping.
- Removed duplicate parent row/day borders so sticky label cells and timeline grid cells each draw one shared edge, including horizontal dividers across the calendar timeline zone.
- Changed the compact calendar-row default height to 50px and added stepped local row growth for dense overlapping appointments: two lanes stay compact, three lanes use 75px, four lanes use at least 96px, then grow with lane density.
- Changed hovered compact single-lane event shells to take the full row height without exceeding it, while the demo card uses a compact hover state to reveal its time line.
- Changed overlap lane geometry to derive event shells from row-local lane slots, and kept demo card typography stable on hover.
- Clamped dense overlap lanes to at least 24px, leaving 20px resting event shells plus a 4px mini-lane gap, and kept compact title icons visible in short event cards.
- Changed hovered overlapped event shells to expand to the full calendar row lane height, kept demo event-card text vertically centered in both normal and hovered states, and added Playwright coverage for the visible full-height expansion.
- Added `docs/taxonomy.md` as the canonical interface vocabulary for calendar surface, headers, rows, lanes, shells, cards, availability, and interaction statuses.
- Changed `Shift` + wheel zoom handling to use a native non-passive capture listener so two-finger trackpad gestures zoom without scrolling the calendar viewport or browser window.
- Removed scroll-synchronized time-header clipping and changed sticky layering so date headers/date labels overlay the top-only sticky time scale with native CSS.
- Adjusted sticky layering so only the left date label sits above the time scale; the full-width day band stays below hour/minute labels, with Playwright coverage that time labels remain visible.
- Added high-zoom horizontal-scroll Playwright coverage to verify date labels and calendar row labels stay above scrolled timeline content while time labels remain visible in the timeline board.
- Moved the day gray band to an absolute non-layout layer below the sticky time scale, keeping the left date label sticky above the scale without adding a visual row.
- Added a demo sidebar stat for total rendered calendar DOM nodes alongside visible event nodes.
- Reduced mounted virtual day sections to the visible viewport plus five day sections of overscan, while keeping the one-month scroll spacer window.
- Suppressed browser text selection during event drawing and drag/drop interactions.
- Suppressed other event hover effects while drawing a new event or drag/dropping an existing event.
- Changed new-event drafts to render as row overlays without recalculating committed row heights or overlap lanes until the event is created.
- Extended the current-time marker through each gray day-header band in the timeline zone while keeping sticky date/calendar labels above it, with Playwright layering coverage.
- Made drawn draft cards opaque and kept their time range visible while drawing.
- Added explanatory comments to the demo event-card stylesheet.
- Fixed calendar-count changes to keep the same top visible day and intra-day scroll offset even when the day is already the virtual window anchor.
- Split oversized timeline, demo, and Playwright files by responsibility: shared timeline gestures moved to `useTimelineInteractions`, external popup demo state moved to `useExternalEventDrafts` plus `ExternalEventPopup`, vertical day rendering moved to its own component, and e2e coverage moved into behavior-focused spec files.
- Fixed external popup date edits so moving a draft to a future or past date refocuses the preview on the first date change instead of only after a second edit.
- Fixed popup cancel positioning so visible create/edit cancels restore from the last event or draft anchor without falling back to date/time centering.
- Fixed quick manual scrolling after popup cancel so delayed restore corrections no longer pull the viewport back to the cancelled event.
- Fixed active edit draft layout so the replaced source event is excluded from row-height and vertical column-width metrics; draft previews no longer add another overlap lane while the popup is open.
- De-duplicated async loaded event buckets by event id so popup handoff range reloads cannot duplicate committed events and grow overlap rows.
- Kept two overlapping events at the compact row height; overlap-driven row growth now starts at three lanes.
- Refined popup date-edit focus: visible destination dates now move naturally without scrolling, offscreen destination dates keep the last screen position, and manual scrolling cancels delayed restore corrections after popup handoff.
- Cancelled stale delayed offscreen restore corrections when a later popup edit moves the draft back to a visible date, preventing the draft from being thrown to an old edge position.
- Delayed bounded vertical-scroll recentering after scroll stop or scrollbar release, so the scrollbar correction no longer fires immediately.
- Added `eventVersion` cache invalidation for broad dataset changes and later replaced external popup save reloads with single-event visible-cache commits, fixing saved vertical create drafts disappearing after the popup closes without forcing a range redraw.
