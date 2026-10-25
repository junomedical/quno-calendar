# Changelog

All notable changes to the combined package are recorded here. `Unreleased` remains first.

## Unreleased

- Move the contextual All demos button between Previous and Next in every demo guide footer and remove its back
  arrow. Keep its full label visible on narrow phones, with 44 px mobile controls and the title beside fullscreen
  and collapse controls.
  Verification: all 725 unit tests and 52 affected Chromium tests pass, including centered footer geometry at
  desktop, landscape, 320 px and 280 px across all five products. Formatting, architecture, typechecking, lint,
  Preact compatibility, demo build, package verification, size reporting and pack dry-run pass.

- Remove Read the recipe links from all demo popups; implementation recipes remain in Documentation through
  the shared header. Explain how the horizontal timeline fits more calendars and gives appointment text more room
  in the Infinite scroll chapter.
  Verification: all 725 unit tests and 29 affected Chromium checks pass, including popup text bounds at desktop
  and 320 px, drawer disclosure and fullscreen. Formatting, architecture, types, lint, Preact compatibility, demo
  build, package verification, size reporting and pack dry-run pass. No unresolved verification blocker remains.

- Remove Try it notes from guide statistics blocks. List actual `react` and `react-dom` peer dependencies for UI
  products and omit the dependency-free parser’s empty row. Retain interactive example instructions.
  Verification: all 725 unit tests pass with two workers, and 22 affected Chromium checks pass, including
  desktop/mobile statistics geometry and guide section order. Formatting, architecture, types, lint,
  Preact/React 19 compatibility, demo build, package verification, size reporting and pack dry-run pass.
  No unresolved verification blocker remains.

- Fit the Timepicker concept at 320 px. Constrain the inner product-card grid so the 360 px clock can shrink to
  its card, and use 12 px Timepicker phone gutters so all three cadence controls retain 80×44 px targets on one
  row. Extend mobile bounds checks to Timepicker, all cadence choices and actual minute selection. The regression
  reproduces the original control extending to x=403 on a 390 px viewport before the fix.
  Verification: all 725 unit tests and 24 affected Chromium checks pass, including 320×667 cadence geometry,
  real minute selection, rotation/fullscreen bounds and other product cards. Formatting, architecture, types, lint,
  Preact/React 19 compatibility, demo build, package verification, size reporting and pack dry-run pass.
  Public library assets and sizes are unchanged; no unresolved verification blocker remains.

- Fix the sticky-header browser fixture’s wall-clock dependency: freeze a working-hour clock before mounting,
  preserving its real horizontal-scroll and pin-alignment assertions. A late clock left the calendar at its right
  scroll limit, so adding 60 px could not move the pin (467/468 full Chromium cases passed; this fixture then
  reproduced the same unchanged-x failure three times). The corrected fixture passes five repeated Chromium runs.

- Keep the main demo’s Datepicker, Calendar and bottom drawer inside narrow mobile layout viewports. Remove its
  inherited 320 px body floor and use shrinkable content/product grids. Add touch-enabled mobile Chromium geometry
  checks across rotation, month navigation, both Calendar orientations, drawer states and fullscreen at 280–844 px.

- Address the subsequent Chromium CI failures: allow the mobile product menu’s intended internal scrolling while
  checking reachable tabs and page containment; reserve enough height for all three participant drafts in the
  cancellation fixture; flush captured native observations before layout changes instead of reading an uncommitted DOM position,
  preserving the date through row filtering and idle recentering. Disable native scroll anchoring in the virtual
  viewport so the browser cannot apply a competing correction. The previous run had 463/466 passes, failing menu scroll-width equality,
  a week-shift after row contraction, and a three-draft assertion with only two rows mounted. The main run repeated
  the menu/draft failures with 464/466 passes. Focused verification passes all 725 unit tests, 24 affected Chromium
  cases and 20 consecutive sixfold CPU-throttled row-filter runs.

- Fix CI’s unit-test startup failure (`Could not resolve #quno-api/demo-event-service` with no generated
  `build/demo-api/events.js`). Give Vitest a separate React/source-alias configuration instead of loading the demo
  server middleware. Share the alias definitions with Vite and retain all CI checks in their existing order. An
  isolated-checkout regression reproduces the failure before the fix and runs actual API tests without generated
  server or library assets afterward.
  Local verification: all 724 unit tests and 12 affected Chromium checks pass, including the isolated startup and
  clean deployment regressions. Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build,
  package verification, size reporting and pack dry-run pass.

- Fix oversized, wrapping dates in Keep busy schedules fast by isolating the embedded calendar’s typography from
  article body styles. Use compact single-line dates with ellipsis and retain the smaller phone labels.
  Verification: all 723 unit tests and 12 affected Chromium checks pass, covering date text bounds, computed
  typography and all density choices on desktop/phone in light/dark browser modes. Formatting, architecture,
  types, lint, Preact/React 19 compatibility, demo build, package verification, size reporting and pack dry-run pass.
  Published library sizes are unchanged; no unresolved verification blocker remains.

- Start the Datepicker guide’s Six weeks, every month example without a selected period. Keep its six-week frame,
  month navigation and interactive selection. Other examples and public defaults retain their existing values.
  Verification: all 723 unit tests and five affected Chromium checks pass, including empty initial selection,
  month-navigation geometry, real selection, prefetch/cache interaction and guide section layout. Formatting,
  architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run
  pass. No unresolved verification blocker remains.

- Shorten the preloading guide’s Try it note to the jump, return and distance controls. Keep cache, request and
  loading details in the section’s main explanation.

- Put current guide Implementation recipes after each section’s demos. Bottom-align a single Try it note with the
  complete desktop description and stack it before the demo on smaller screens. Consolidate duplicate Calendar
  instructions and keep performance verification in prose. Remove the Explore the interactions panel and per-section
  Watch demo links across all five current guides; retain Demo in the shared header, live examples and archive sources.
  Verification: all 723 unit tests and 66 affected Chromium checks pass, including every guide's note count,
  full-description alignment, DOM/visual recipe order, removed-link absence and lazy example interactions.
  Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package verification, size
  reporting and pack dry-run pass. No unresolved verification blocker remains; published library sizes are unchanged.

- Share the demo product header with current documentation and its index. Keep desktop tabs and the
  Documentation/Demo link together on the left, preserve active-product return links and keep the header above
  lazy guide loading. Follow live browser light/dark appearance across documentation and its empty placeholder.
  Left-align guide content, place chapter links and Try it notes in a smaller desktop column, and stack them on
  smaller screens. Keep authored example palettes, wide calendar exhibits, deep links and archive presentation.
  Verification: all 724 unit tests, the complete 457-case Chromium run and nine final shell/theme checks pass.
  Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package verification, size
  reporting and pack dry-run pass. Published library sizes are unchanged; no unresolved verification blocker remains.

- Fix Vercel builds after shared overlap filtering added a runtime import from the package root. Bundle headless
  shared helpers from source and resolve the private demo service through separate source-type/compiled-runtime
  package conditions. Prepare the service before development startup; remove the conflicting TypeScript path
  override. Site/function builds no longer depend on existing library `dist` assets. The regression test reproduces
  the original resolver failure and verifies both clean builds plus native service execution in two timezones.
  Verification: all 724 unit tests and 16 affected Chromium checks pass. Clean development startup and HTTP queries
  work without `dist`. Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package
  verification, size reporting and pack dry-run pass; published library and demo bundle sizes are unchanged.
  No unresolved local verification blocker remains.

- Zoom/touch verification: all 724 unit tests, 139 final affected Chromium checks and five WebKit zoom checks pass.
  The complete 449-case Chromium attempt passed 433; it included 12 playback timeouts while implementation was
  still changing, a clock-dependent route-width assertion, outdated zoom copy/top-date assertions and the custom
  minimum handoff regression. The final source-stable reruns cover every failed case, native pre-hold scrolling,
  held drag/drawing geometry, both zoom limits, pauses, iPad-emulated slider focus and dense frame alignment.
  Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package verification, size
  reporting and pack dry-run pass. No unresolved verification blocker remains. Infinite Calendar is 35.24 KiB
  JavaScript and 1.96 KiB CSS gzip within its 50/2 KiB budgets; the demo main chunk is 448.16 kB.

- Preserve the exact first Shift-pointer time and screen coordinate through zoom pauses, limits and rejected
  requests. Slider/external zoom focuses the current clock in both orientations, revealing it when offscreen and
  retaining its original point through reversals. Native bounds can temporarily displace focus until space permits.
- Require a stationary 350 ms touch hold before event dragging or empty-grid drawing. Pre-hold swipes scroll
  normally, quick event taps activate, and empty-grid taps create nothing. Mouse and pen remain immediate.

- Reuse the shared field-guide event card in the overnight/multi-day exhibit, including its availability and
  interaction-state styling. Retain clipped segment clocks and continuation arrows without a separate inline design.
  Verification: all 701 unit tests and 65 affected Chromium checks pass, including computed-style comparisons
  against the existing read-only cards in both orientations. Formatting, architecture, types, lint, compatibility,
  demo build, package verification, size reporting and pack dry-run pass. No unresolved blocker remains.

- Overnight/multi-day verification: all 701 unit tests pass. The complete 438-case Chromium run passed 437 checks;
  its sole failure expected the previous 26 guide chapters. Update that expectation to 27; all 104 affected Chromium
  checks pass on the final rerun, including the ten new multi-day scenarios and editor/anchor/drag regressions.
  Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package verification, size reporting
  and pack dry-run pass. No unresolved verification blocker remains. Infinite Calendar measures 33.90 KiB JavaScript
  and 1.97 KiB CSS gzip, within its 50/2 KiB budgets; the demo's main chunk is 444.08 kB.

- Support overnight and multi-day Infinite Calendar events in both orientations with half-open daily segments,
  overlap loading, independent daily lanes and complete-event renderer/callback data. Add optional renderer
  `segment: CalendarEventSegment`, activation `renderedDateKey` and continuation/date shell attributes.
- Move complete events using the grabbed date/time as anchor, preserving elapsed duration across midnight and DST.
  Same-day events can cross displayed-hour/date boundaries; parent rejection and single-day drawing remain intact.
  Update all retained date instances on edits/moves/removal and deduplicate projected events. Add the interactive
  overnight/multi-day field-guide exhibit, overlap recipes and focused geometry/cache/timezone regression coverage.

- CI scroll verification: all 679 unit tests, all 428 Chromium checks and 12 single-worker repeated scroll checks
  pass. Delayed startup with 4× CPU slowdown passes; shortening the pause to one second is correctly rejected.
  Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package verification, size
  reporting and pack dry-run pass. No verification blocker remains; library and demo bundles are unchanged.

- Stabilize the concept scroll motion check by sampling until the required travel and two-second stationary pause
  are observed, bounded by a 10-second deadline. Retain the travel, intermediate-position, nine-frame and frame-step
  thresholds, and measure the full pause against one fixed position. Demo playback and public APIs are unchanged.

- Directory/loading verification: all 679 unit tests and 67 affected Chromium checks pass, including reload,
  history, direct/shared paths, old-query conversion, archive-link removal and a deliberately delayed silent guide
  load with computed surface/height assertions. Formatting, architecture, types, lint, Preact/React 19 fixtures,
  demo build, package verification, size reporting and pack dry-run pass. An initial concurrent unit run exceeded
  the dense-layout timing ratio (26.30 versus 25); the final complete unit rerun passes. Library sizes are unchanged;
  the main demo chunk is 440.92 kB.

- Replace concept query URLs with product/chapter directories such as `/calendar/zoom` and `/datepicker/paint`,
  keeping `/` for the Calendar introduction. Convert earlier query links and retain history, reload and tab memory
  through the existing server rewrite. Remove archive links from current navigation while retaining direct archive
  access. Load documentation on a silent light surface rather than flashing a loading message.

- Homepage/docs verification: all 671 unit tests pass. The complete 426-case Chromium run passed 413 checks;
  13 checks used pre-update `/guide` link expectations and all 13 pass on a fresh rerun after correcting them.
  All seven final homepage/docs checks pass, including direct chapter links for every product, mobile geometry,
  archive separation, lazy-guide anchors and light density styling under a dark OS. No unresolved verification
  blockers remain. Formatting, architecture, types, lint, Preact/React 19 compatibility, demo build, package
  verification, size reporting and pack dry-run pass. Library sizes are unchanged; lazily loaded guides reduce
  the demo's main JavaScript chunk from 594.88 kB to 440.76 kB.

- Make the concept the main `/` page, retaining `/concept`, remove the corner logo, and persist product/chapter
  navigation in shareable URL queries with reload/history and per-product last-chapter restoration.
- Serve current documentation at `/docs` with lazy product guides, consistent product navigation and direct links
  to matching live demos. Preserve all distinctive API examples and focused sandboxes. Keep an independent
  20 October 2026 guide source snapshot at `/docs/archive`; legacy `/guide/*` links and anchors remain supported.
- Start the busy-schedule documentation exhibit in light mode regardless of OS preference. Fix newly drawn
  availability being treated as a faded inactive foreground event by assigning its explicit availability layer.

- Cadence/copy verification: all 658 unit tests and 23 affected Chromium checks pass, including desktop/phone button
  geometry, keyboard/mouse selection, slot counts, preserved clocks and exact introduction copy. Formatting,
  architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run
  pass. Library sizes are unchanged; the demo retains its non-blocking 594.88 kB main-chunk warning.

- Shorten the Timepicker concept’s Minute cadence label to Cadence and enlarge its 5/15/20 minute buttons to at least
  80×44 px with 14 px text. Clarify the Calendar introduction’s navigation and interaction-focus wording.

- Final demo verification: all 658 unit tests and 53 focused Chromium checks pass. The full Chromium run passed
  416/417 checks; `e2e/specs/calendar-row-filter.spec.ts:20` timed out during its initial October 15 navigation
  (`:17`, expected 2026-10-15, received 2026-10-08) under four workers. Three isolated single-worker reruns pass.
  Formatting, architecture, typechecking, lint, Preact compatibility, demo build, package verification, size reporting
  and pack dry-run pass. An earlier concurrent unit run exceeded the mixed-layout timing ratio (25.15 versus 25);
  the complete final unit rerun passes. The full-run navigation timeout remains a verification caveat.
  Infinite Calendar is 33.07 KiB gzip within its 50 KiB budget; other library sizes are unchanged. The demo retains
  its non-blocking 594.84 kB main-chunk warning.

- Quiet, Busy and Packed now compare 4, 20 and 60 appointments per day with repeatable shuffled starts across the
  working day. The density exhibit uses separate fixtures without forced overlaps; ordinary concept tours retain
  their reference appointments. Guide cards, controls, autoplay and the copyable recipe use the same presets.

- Restore the Keep busy schedules fast guide exhibit’s full 560 px calendar and mobile density controls by isolating
  its embedded layout from the concept shell. Scroll demos now use seven included dates per side through optional
  settings.dateWindowRadius; normal consumers keep the month-based default. The demo’s 22-event persistent baseline
  is separate from its density fixture source, so hidden packed days cannot distort ordinary scrollbar centering.

- Mobile explainer collapse/expand taps, header/chevron swipes and Enter/Space disclosure now preserve the current
  demo playback state. Running demos continue and paused demos stay paused; contents, fullscreen, working controls
  and desktop guide interactions retain their existing pause behavior.

- Ambiguity demo verification: all 655 unit tests and all 401 Chromium checks pass, including all three short-date
  interpretations, repeated playback and manual editing on desktop/phone. The initial concurrent unit run exceeded
  the dense-layout timing ratio (27.61 versus a limit of 25); its isolated recheck and the full unit rerun pass.
  Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and
  pack dry-run pass. Library sizes are unchanged; the demo retains its non-blocking 592.05 kB main-chunk warning.
  No current verification blocker remains.

- Resolve ambiguity now cycles `10-11-12`, `01/02` and `feb 11 80`, with readable pauses and explanations of numeric
  order, missing years and abbreviated years. The scene uses existing parser behavior and restores its first example.

- Parser copy verification: all 655 unit tests and 70 affected Chromium checks pass. Formatting, architecture,
  types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run pass.
  Library sizes are unchanged; the demo retains its non-blocking 591.86 kB main-chunk warning. No new blocker remains.

- Renamed the concept’s top Date Parser tab to Parser. Its Date parser introduction now explains text tokenization
  and interpretation as meaningful dates. Product IDs, public imports, routes and the ready parser example retain
  their existing contracts; optional manifest tabLabel keeps the short menu name separate from the introduction.

- Overlay verification: all 655 unit tests and all 401 Chromium checks pass, including full-height stage geometry,
  real drawer overlap and stable product placement through disclosure/contents/fullscreen on phone and landscape.
  The prior concurrent loading-test caveat did not recur. Formatting, architecture, types, lint, Preact compatibility,
  demo build, package verification, size reporting and pack dry-run pass. No current verification blocker remains.
  Library sizes are unchanged; the demo retains its non-blocking 591.69 kB main-chunk warning.

- Removed the mobile concept drawer's reserved product-stage space. The drawer now overlays the full-height demo
  canvas, with fixed content placement through collapse, expansion and contents. Native scrolling, fullscreen,
  drawer gestures and desktop layout remain intact.

- Mobile label verification: all 655 unit tests pass. The full Chromium run passed 395/398 checks before the
  orientation-return fix. Both affected phone tour checks now pass; eight repeated orientation/shared-time checks
  and four final label/zoom/phone-tour/loading checks pass. One unrelated full-run caveat remains:
  `e2e/specs/calendar-row-filter.spec.ts:95` timed out waiting for offset -12 in Load later under four workers;
  the same check passes with one worker. No library sources changed. Formatting, architecture, types, lint, Preact,
  demo build, package verification, size reporting and pack dry-run pass. Library sizes are unchanged; the demo
  retains its non-blocking 591.69 kB main-chunk warning.

- Mobile horizontal concept calendars now give the names column 30% of the viewport, reduce names by 25% and date
  labels by 40%. Responsive geometry and zoom limits update together through resize/fullscreen; desktop typography,
  238 px desktop labels and the separate vertical time pane retain their existing dimensions. The orientation tour
  now returns to the starting day’s measured header before revealing its virtualized appointment.

- Drawer verification: all 655 unit tests and the full 395-check Chromium run pass. All 37 focused drawer/layout
  checks also pass after the swipe-settling fix, including one additional frame-continuity check. Formatting,
  architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run
  pass. No verification blocker remains; library sizes are unchanged. The demo retains its non-blocking main-chunk
  warning (591.41 kB).

- The concept explainer becomes a bottom drawer on mobile, with chevron taps, header swipes, independent contents
  scrolling and reduced-motion support. Fullscreen now sits beside the chevron on mobile and desktop, including
  collapsed guides. Calendar scene controls clear the mobile drawer and remain at bottom right on desktop.

- System-theme/zoom/contrast verification: all 655 unit tests and 163 concept Chromium checks are verified. The broad
  concept run passed 111 checks before its reused test server closed; all 48 remaining checks pass on a dedicated
  server, and four additional light/dark draft contrast checks pass. Formatting, architecture, types, lint, Preact,
  demo build, package verification, size reporting and pack dry-run pass. No new verification blocker remains.
  Library artifacts retain their previous sizes; the demo has a non-blocking 589.26 kB main-chunk warning.

- Fixed dark-mode creation drafts using a pale fill behind light text. The dark Calendar palette now supplies a dark
  green draft surface and light dashed border; light drafts and saved/cancelled animations retain their styling.

- Concept shell/canvas now follow live system light/dark appearance. Ordinary Calendar chapters use that default;
  explicit theme choices and the Theming cycle stay authored. Explainers and other product controls retain their
  existing light styles on bright panels. Demo zoom controls now use the viewport-fitting minimum, update on resize
  and orientation changes, disable boundary buttons and preserve wheel reversal at the minimum.

- Increased the Infinite scroll concept pause between its 900 px steps from 350 ms to two seconds in both orientations.
  All 655 unit tests, focused loop/motion checks and repeated timing checks in both orientations pass. Formatting,
  architecture, types, lint, Preact, demo build, package verification, size reporting and pack dry-run pass. The demo's
  existing 588.15 kB chunk warning and previously recorded full-run calendar verification caveats remain unchanged.

- Verification for stable time selection and concept updates: all 655 unit tests pass. The full Chromium run passed
  377/380 checks: one older control test expected the removed legends; its updated accessible-group assertions and
  all four checks in that file pass. Two existing calendar checks failed intermittently under six-worker load:
  `e2e/specs/calendar-row-filter.spec.ts:20` changed October 15 to October 22 after compaction, and
  `e2e/specs/participant-focus.spec.ts:46` did not open the external draft at 20,000 events/year. All nine checks
  across those two files pass with one worker. These full-run failures remain verification caveats; timeline library
  sources were not changed. Formatting, architecture, types, lint, Preact compatibility, demo build, package
  verification, size reporting and pack dry-run pass. The demo retains a non-blocking 588.15 kB main-chunk warning.

- Fixed shared Timepicker/Datepicker time-option reveal jumping the selected hour to the top on every selection.
  Visible choices now retain their position; offscreen choices reveal only as needed, and equivalent enabled-hour
  arrays no longer reset scrolling. Initial selected-hour reveal and controlled/uncontrolled behavior remain intact.
  The shared reveal adds 96 gzip bytes to Datepicker; its JavaScript ceiling is now 12.75 KiB (measured 12,858 bytes).

- Enabled dragging controlled concept drafts before Save. The editor follows the moved time and retains its title;
  Save commits the moved slot and Cancel discards it. Removed small view/density/theme/zoom labels while preserving
  accessible groups, and matched all control docks to fullscreen’s 40 px height.
- Simplified floating-guide footers to Previous/Next without a counter or duplicate title. Contextual contents actions
  such as All calendar demos now match the collapse control’s 34 px height.

- Date Parser now opens with 12/01 10:00 already typed and resolved. Optional scene chapterOnly metadata keeps the
  ready introduction idle while chapter arrival starts playback. Resolve a phrase now cycles six varied examples,
  including a clock, rolling duration, written date and explicit range, with readable 1700 ms result holds.

- Parser cleanup verification: all 654 unit tests and all 370 Chromium checks pass, including desktop/phone control
  absence, visible tokens/endpoints, typed ambiguity fallback and overnight recognition. Formatting, architecture,
  types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run pass.
  No verification blocker remains. Shipped library sources/sizes are unchanged by this cleanup; the demo retains
  its non-blocking 587.61 kB main-chunk warning.

- Removed Structured result/copy, clock-recognition and date-order controls from the Date Parser concept. Kept live
  tokens and resolved dates; scene JSON owns parsing options. Ambiguity now compares numeric inputs by typing rather
  than clicking removed controls, and Cross midnight retains clock recognition.

- Concept verification: all 654 unit tests pass. The full Chromium run passed 363/368 checks; four Timepicker checks
  in an already-running worker still expected the removed output/old placeholder while these edits arrived. All four
  pass with the updated native-summary assertions on a fresh run, and the focused desktop/phone semantic-token,
  separator/year-boundary, composition and layout checks pass. The existing Load later case at
  `e2e/specs/calendar-row-filter.spec.ts:80` timed out after 5000 ms; all seven checks in that file pass when rerun
  with one worker. Keep that intermittent full-run timing failure as a verification caveat; calendar runtime sources
  were not changed. Formatting, architecture, types, lint, Preact, demo build, package verification, size reporting
  and pack dry-run pass. The demo retains a non-blocking 587.42 kB main-chunk warning; shipped size limits pass.

- Parser token labels now identify colon time separators and 61–9999 numeric years, with duration-count and clock
  context preserved. Public token types and parser behavior remain unchanged.

- Marked known parser vocabulary green with semantic labels for relative words, weekdays, month names and units;
  unknown words stay neutral. Kept raw token types inspectable and shared the displayed lexicon with parsing.
- Simplified standalone Timepicker chapters: cadence follows the clock; removed duplicate Selected time output and
  the business-hours toggle while retaining authored hour configuration.

- Added a Timepicker Works with datepicker chapter that chooses days and times in one control and restores its
  starting pair. Synthetic click focus handoffs stay inside playback, while deliberate user actions still pause it.
- Date Parser now displays live token text/types and resolved endpoints directly below its input, before preferences.

- Applied Date Input conceptual copy and added Format guessing. Renamed the composition Works with datepicker,
  opening it on field focus without a toggle and synchronizing typed months and picker selections. Hide its duplicate
  picker summary, leaving the selected range in the input. Natural typing
  now supports ranges; single-date fields no longer offer automatic range-prefix completion.
- Doubled Access months scrolling to 1980 from 4420 to 8840 ms, preserving the same selection and cancellation.

- Natural-input verification: all 650 unit tests and the focused desktop/phone example, submission-delay and takeover
  checks pass. The full Chromium run passed 357 of 358 checks; the existing pending-update navigation case at
  `e2e/specs/calendar-row-filter.spec.ts:141` briefly reported October 29 instead of October 22. All seven checks in
  that file, including the failed case, passed when rerun with one worker. This intermittent full-run failure remains
  a verification caveat; calendar runtime sources were not changed. Formatting, architecture, types, lint, Preact,
  demo build, package verification, size reporting and pack dry-run pass. The demo retains its non-blocking 583.34 kB
  main-chunk warning; shipped bundle sizes are unchanged.

- Expanded Type naturally to four examples: tomorrow, yesterday, 22 July 1980 and next Friday. Each complete phrase
  stays visible for 1200 ms before Enter, followed by a 1700 ms hold on its formatted result. Relative dates still
  use today, and manual interaction interrupts the sequence.

- Datepicker copy/choreography verification: all 358 Chromium checks and all 650 unit tests pass. Formatting,
  architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and pack dry-run
  pass. A concurrent browser/build run caused the existing layout-scaling timing ratio to measure 51.36 against its
  25× ceiling; the full unit suite passed after those jobs finished. No blocker remains. Library sources/bundle sizes
  are unchanged; the demo retains its non-blocking 582.72 kB main-chunk warning.

- Made Datepicker painting alternate two ranges, endpoint adjustment return to its original end, and range movement
  return after a pause, all without clearing or remounting between cycles. Intent now simulates hover to show the
  upcoming interpretation. Slowed the year scroll to 4420 ms (1.7× its previous duration).

- Applied the approved Datepicker introduction and seven conceptual chapter descriptions. Access months now scrolls
  back to July 1980 and selects 22 July in single-day mode, using measured virtual-year geometry and cancellable motion.
  Step validation is separated from product/document validation; existing scenes and recipes retain their identities.

- Shared concept verification: all 648 unit tests and all 350 Chromium checks pass, plus focused bottom-anchor and
  keyboard-proof checks. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification,
  size reporting and pack dry-run pass. Shipped library sources and bundle sizes are unchanged. The demo retains its
  non-blocking 580.92 kB main-chunk warning; no verification blockers remain.

- Unified all five concept products around a draggable/collapsible floating guide and live canvas, with introductions,
  contents and footer navigation. Anchored resizing at bottom left, restored a 24 px bottom inset, moved fullscreen to
  bottom right and scene controls immediately left. Other products sit right of the guide or above it on phones.
- Added four Datepicker scenes for seven ordered interactions, removing the extra mode switch, below-picker hint and
  raw result. Date Input uses today, omits its reference/output, waits 300 ms before Enter and shows repeated day-down,
  month-up edits. Timepicker minutes are smaller and top aligned. Calendar closes overlap cards between cycles,
  tags Shift-scroll and retains saved glint/cancellation fading.

- Concept copy/focused-editing verification: all 644 unit tests and all 326 Chromium checks pass, including selected
  doctor filtering, draft visibility, save/cancel restoration, both orientations, phone loops and long-copy geometry.
  Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting and
  pack dry-run pass. Library bundles remain unchanged. The demo retains its non-blocking 580.28 kB main-chunk warning.

- Replaced Calendar concept copy with the author's design rationale across the introduction and eight chapters.
  Renamed the introduction Calendar and allowed three paragraphs for Calendar scenes. Creation now focuses only
  the edited doctor, retaining load coverage and session data; save/cancel restore participants with slot anchoring.

- Final concept verification: all 642 unit tests and the full 321-check Chromium suite pass. After the final panel
  placement/disclosure refinements, all 93 concept browser checks and the focused contents-toggle geometry check
  pass. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting
  and pack dry-run pass. Library bundles remain unchanged. The demo retains its non-blocking 579.86 kB main-chunk warning.

- Placed the explainer at bottom left by default and made Home restore that corner. Collapse/expand retains the
  button’s 34 px size and position, together with the panel width.

- Simplified the collapsed Calendar floater to its title and expand button, retaining its responsive width.
  All demos, chapter navigation and explanations return when expanded.

- Left-aligned Calendar contents titles with consistent number columns, and removed Back from the Calendar demos
  contents screen. Chapters and introduction retain All demos.

- Kept the collapsed Calendar floater at its expanded responsive width for readable titles. Renamed its contents
  action to All demos and retained the label when collapsed.

- Removed the concept calendar’s corner Saved/Moved confirmation. Appointment changes show their own result.
  Rescheduling reveals each source clear of sticky labels before dragging on narrow screens.

- Closed Calendar demo loops through visible actions: Theming ends in Light, density returns to Quiet, and view/zoom
  sequences return to their starting position without a reset flash. Reschedule moves three different appointments
  and then moves them back in reverse order before repeating. Manual takeover preserves the current result.
- Fixed Event density inheriting vertical orientation and leaving an appointment preview expanded after the virtual
  pointer moves away to scroll. Rounded both the cursor body and its white outline with round-joined strokes.

- Rounded the shared demo cursor, tilted it 15° counterclockwise around its tip, and removed the text sign beneath
  it across all products. Movement, click pulses, held-drag cues, and control alignment remain.
- Filled ordinary Calendar demos with 22 appointments across morning and afternoon, including 32 varied additional
  titles across the shared fixture. Preserved reference appointments, canonical overlaps, IDs and the creation gap.
  Raised ordinary/density zoom to 2× and lengthened generated regular appointments to one hour for readable titles;
  Quiet/Busy/Packed retain their exact 4/40/400 counts.

- Added next-day scrolling after each Horizontal / vertical demo switch: vertical advances into October 20, then
  horizontal advances into October 21. The same calendar, loop, expanded guide and manual takeover remain active.

- Kept Calendar animation running through mouse movement and hover. Click or drag starts manual takeover; wheel,
  keyboard, focus and hidden-tab cancellation remain. Native overlap hover stays usable after deliberate takeover.

- Made Calendar demo loops livelier: downward scrolling advances 900 px per one-second eased step with a 350 ms
  pause. Zoom quickly travels from maximum 8 to minimum 0.5, scrolls through the wide view, zooms back in, then
  explores the detail. Both remain on the selected chapter, keep expanded text, and yield immediately to manual input.
- Calendar loop/pacing verification: all 639 unit tests pass. The full 309-check Chromium run passed before the
  final pacing adjustment; all 12 affected motion/loop regressions and all 20 final presentation/motion checks pass
  afterward, including 800+ px travel, pauses, both zoom directions, expanded text, footer navigation, bounded creation,
  looping, and manual cancellation. Formatting, architecture, types, lint, Preact compatibility, demo build, package
  verification, size reporting, and pack dry-run pass. Library bundles remain unchanged. The demo retains its
  non-blocking 576.95 kB main-chunk warning.

- Looped Calendar playback on the selected scenario without advancing chapter navigation. Infinite scroll now moves
  continuously downward without pauses or date resets. Other chapters repeat from a session checkpoint, bounding
  automatic creations while retaining pre-run edits. Manual input stops future cycles and preserves the current
  result. Expanded guide text remains usable; synthetic Calendar gestures exclude only the information overlay
  during synchronous hit testing, restoring native pointer behavior immediately.

- Kept Calendar descriptions expanded during Previous/Next and contents navigation. Each reached chapter starts its
  demo automatically, with reduced-motion and manual-interruption guards. Removed Play tour, Replay scene, Try it,
  Reset, and Pause from the Calendar floater; revisiting a chapter runs it again while retaining appointments.

- Moved Calendar Previous/Next navigation into the floating guide's bottom footer, including a compact collapsed
  state. Navigation moves with the panel and stays outside its scrollable explanation/contents. Removed the separate
  bottom bar so the calendar fills the remaining viewport in normal and fullscreen views.

- Added a dedicated About this demo page as the Calendar floater's first screen. It explains the live schedule and
  chapter sequence while the calendar starts in the background. Next enters the first chapter; Previous and contents
  return to the introduction. Recipes and playback controls remain on chapter pages; navigation counts nine pages
  without changing the eight-scene catalog or remounting the calendar.
- Introduction verification: all 639 unit tests and all 306 Chromium tests pass, including introduction navigation,
  inline contents, autoplay, persistent calendar identity, and responsive guide geometry. Formatting, architecture,
  types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass.
  Library bundles remain unchanged. The demo retains its non-blocking 575.86 kB main-chunk warning.

- Made Calendar's full-width floating-guide layout the default, including interactive mobile use. Added a corner
  fullscreen toggle, bottom previous/next navigation, and Back plus all demo titles inside the floating panel.
  The entire panel drags with mouse/touch except its buttons/links; chevrons collapse/restore it and keyboard movement
  remains available. Removed the dotted handle, top playback controls, See demo, and interaction/idle instructions.
  Scenes autoplay on entry/navigation with reduced-motion and manual-takeover guards. Calendar state and edits survive.
- Default-guide verification: all 639 unit tests and all 13 final interface checks pass, covering five viewport sizes,
  whole-body and touch dragging, resize clamping, collapse/restore, inline contents, bottom navigation, fullscreen,
  autoplay and manual takeover. Both orientation hover checks pass. Formatting, architecture, types, lint, Preact,
  demo build, package verification, size reporting, and pack dry-run pass. Library bundles remain unchanged.
  The complete Chromium run passed 302/305: the initial autoplay probe clicked Collapse after automatic collapse
  (corrected to Expand; the final 13-check rerun passes), `calendar-row-filter.spec.ts:28` settled on October 22
  instead of October 15, and `calendar-viewport-loading.spec.ts:17` observed September's initial request instead of
  the expected October range. Both unchanged loading checks pass in an isolated single-worker rerun; full-suite
  loading timing remains a caveat. The demo retains its non-blocking 574.60 kB main-chunk warning.

- Added a floating scene guide to the Calendar fullscreen concept, with JSON-authored title/description,
  previous/next demo arrows, and See demo to hide the guide and start playback. Top navigation keeps Back,
  playback, scene navigation, and Show description available. Manual input immediately takes over; Back/Escape
  preserve the mounted calendar and edits and restore the selected inline section and launch focus.
- Fullscreen-guide verification: all 639 unit tests and all nine new fullscreen browser checks pass, including
  desktop, phone and landscape containment/layering, stable calendar bounds/identity, scene navigation, manual
  takeover, Back/Escape, and focus restoration. Formatting, architecture, types, lint, Preact compatibility, demo build,
  package verification, size reporting, and pack dry-run pass. The full Chromium run passed 300/302: unchanged
  `e2e/concept-motion.spec.ts:75` sampled exactly 400 px against >400, and unchanged
  `e2e/specs/calendar-row-filter.spec.ts:152` settled on October 29 instead of October 22 after a pending update.
  Both pass in an isolated single-worker rerun; these timing-sensitive checks remain a full-suite caveat.
  Library assets and size budgets are unchanged. The demo retains its non-blocking main-chunk warning (571.69 kB).

- Keep at least one adjacent included day warm on every enabled side of screen prefetch. A viewport showing only
  a tenth of a dense day still preloads its next/previous included dates. Preserve per-side zero opt-outs, fractional
  screen distances, larger pixel buffers, excluded weekdays, bounded date edges and explicit day-based policies.
- Adjacent-day verification: all 639 unit tests pass; the 135-calendar browser regression requests both neighbors
  with less than a tenth-day visible and reuses those reads while scrolling within the date. Formatting,
  architecture, types, lint, Preact, demo build, package verification, size reporting and pack dry-run pass.
  JavaScript is 33,710 B gzip (32.92 KiB), +68 B; CSS stays 2,018 B. The demo retains its non-blocking 568.82 kB
  main-chunk warning. Full Chromium passed 291/293: the horizontal concept scroll measured 400 px against >400
  because its resource-cell reference mounted after scrolling began; sampling the mounted date section preserves
  the threshold and passes both orientations. `calendar-row-filter.spec.ts:45` expected October 15 but received
  October 8 during setup and passed isolated. The affected-file rerun passed 19/20; `calendar-row-filter.spec.ts:95`
  timed out awaiting the pre-update -12 px offset and also passed isolated. Row-filter timing remains an intermittent
  full-suite verification caveat; its fixture uses the unchanged explicit calendar-day policy.

- Changed Infinite Calendar's default event prefetch from seven calendar days to one screen on each side of the
  viewport. Configure fractional or zero distances with `beforeScreens`/`afterScreens`; explicit day policies remain
  supported. Coverage follows actual date geometry, density, zoom and viewport size. Added a live Prefetch distance
  guide control and geometry-based regression coverage. See the screen-prefetch migration note.
- Screen-prefetch verification: all 636 unit tests pass. The first full Chromium run passed 286/293; seven checks
  assumed the former week buffer or retained the previous bundle-size value. After explicitly scoping the late-data
  fixture's week buffer, waiting for the visited date before zoom sampling, scrolling Thursday's row into view, and
  updating the payload assertion, all seven checks and all 61 tests in their affected files pass. Formatting,
  architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run
  pass. Infinite Calendar JavaScript is 33,642 B gzip (32.85 KiB), +337 B; CSS stays 2,018 B. The demo retains its
  non-blocking main-chunk warning (568.52 kB); package size limits pass.

- Improved the preloading guide with shared concurrent-request tracking and Back to starting date. Loading remains
  active until every read settles, including failures and aborts. Added cached-return and control-geometry coverage;
  participant-edit and save checks now measure visible date/card stability through compensated recentering.
- Prefetch-guide verification: all 631 unit tests and 292 Chromium tests pass, including out-of-order request
  completion, failures/aborts, immediate cached navigation, return-request counts, 1280/390 px control containment,
  and participant-edit/save geometry. Formatting, architecture, types, lint, Preact compatibility, demo build,
  package verification, size reporting, and pack dry-run pass. Library assets are unchanged. The demo retains its
  non-blocking main-chunk warning (566.85 kB); package size limits pass.

- Removed abbreviated concept text placeholders: complete titles, paragraphs, and actions now remain mounted with consistent layout through scrolling and activation. Inactive sections are inert. Playback reserves its pause/status space so starting or stopping a demo cannot shift centered copy.
- Text-stability verification: all 628 unit tests and 292 Chromium tests pass. New frame-sampled checks retain heading nodes, font sizes, and text/action bounds through scrolling, activation, playback, and pause at 1440, 950, and 390 px. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (566.51 kB); package size limits pass.

- Kept the concept calendar fixed while scenario explanations scroll, retaining one mounted calendar and shared appointment dataset. Scenario settings reset without deleting session edits; density projects subsets of the same source. Widened date/time labels by 70%, moved JSON-selected scenario controls to the bottom right, and removed the bottom date/count stats row.
- Fixed-calendar verification: all 628 unit tests and 289 Chromium tests pass, including stable viewport geometry and identity through desktop/mobile section navigation, 238/167 px label widths, bottom-right control selection, retained edits and repeated creation, fullscreen, and playback. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (566.65 kB); package size limits pass.

- Merge verification: the first GitHub run passed 282/285 Chromium tests. The new horizontal scroll check sampled an already-running initial preview and observed 386 px against >400 px; it now explicitly replays and samples the complete first scroll gesture. All 18 repeated motion checks pass locally. Existing `external-cancel.spec.ts:172` saw two draft cards instead of three, and `participant-focus.spec.ts:40` timed out opening the editor for 20,000 events/year; all 11 tests in those two files pass unchanged locally. The final complete Chromium rerun passes all 285 tests. Formatting, types, and lint pass after the test correction.

- Rebuilt concept navigation around viewport-sized scenario screens with JSON-authored explanations, a persistent horizontally swipeable title rail, and smooth section navigation. Fullscreen launches below the paragraphs and shows only the live demo/playback controls while preserving state. Mobile inline previews are inert; interaction is available only in fullscreen.
- Navigation verification: all 626 unit tests and 285 Chromium tests pass, including native touch swipes, screen fit for every mobile scenario, smooth section positions, fullscreen state/focus restoration, mobile input exclusion, and existing playback outcomes. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (564.98 kB); package size limits pass.

- Separated all nineteen concept scenarios into individual JSON files. Product manifests now hold only product metadata and ordered scenario/preview IDs; scene discovery is automatic, so adding a supported scenario needs no TypeScript registry edit.
- Per-scenario verification: all 624 unit tests pass. Chromium passed 276/277, including every concept check; `e2e/specs/calendar-row-filter.spec.ts:95` timed out waiting for the -12 px row offset in “Load earlier and owners” and passed unchanged in isolation. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (557.79 kB); package size limits pass.

- Split concept scenarios into five independent product JSON files, with a small shared manifest for startup, tab order, version, and reference dates. Preserved all nineteen scenes and existing validation/playback; file IDs and cross-file assembly are checked before use.
- Separate-JSON verification: all 600 unit tests and 277 Chromium tests pass, including independent file edits, manifest ordering, missing/mismatched files, and live Date Input customization without changing Calendar. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (555.45 kB); package size limits pass.

- Kept concept appointment titles, clocks, and hover details on single unwrapped lines with ellipsis and intact line heights. Short cards prioritize the title; hover restores details and targets a 240 px width within the calendar's existing bounds.
- Card-text verification: all 590 unit tests and 277 Chromium tests pass, including zoom-level text geometry, minimum-zoom packed cards, hover expansion, and restored dimensions in both orientations. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains its non-blocking 556.07 kB main-chunk warning; package size limits pass.

- Made concept overlap previews reveal underlying appointments continuously as the unpressed pointer crosses their lanes, using actual browser hit targets. Real mouse movement over the calendar takes over immediately; hover playback emits no press or click and does not open an editor.
- Hover-demo verification: all 590 unit tests pass. Chromium passed 272/273, including all concept checks and four new tests for unpressed movement, covered-lane reveal, and real-pointer takeover in both orientations. `e2e/specs/external-cancel.spec.ts:537` observed one event request against an expected zero; it passed unchanged in isolation. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (556.07 kB); package size limits pass.

- Animated concept scrolling and target reveals with cancellable eased frame updates. The zoom demonstration now holds and drags a live slider through continuous calendar geometry. Scroll/slider duration and easing remain JSON-controlled; manual takeover stops motion immediately.
- Animated-demo verification: all 590 unit tests and 269 Chromium tests pass, including frame-sampled zoom/scroll geometry and cancellation in both orientations. The first browser run passed 267/269: the new cancellation probe incorrectly queried a virtualized-out appointment (corrected), and `calendar-row-filter.spec.ts:95` timed out waiting for a -12 px offset in “Load earlier” (passed unchanged in the final full rerun). Formatting, architecture, types, lint, Preact, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking 555.54 kB main-chunk warning; package size limits pass.

- Moved concept scenarios into versioned, validated JSON controlling product copy, docs links, initial state, preview order, and playback actions. Replaced scene-specific playback branches with one shared interpreter; adding a scene with existing interactions requires only a JSON edit.
- JSON-scenario verification: all 585 unit tests pass with one worker and all 263 Chromium tests pass, including a new JSON-only scene and reset check. The initial concurrent unit run passed 584/585: `tests/performance/layoutScaling.test.ts:61` measured 25.1253× against a <25× limit; its isolated rerun and the complete single-worker suite passed. Formatting, architecture, types, lint, Preact, demo build, package verification, size reporting, and pack dry-run pass. The demo retains a non-blocking main-chunk warning (554.13 kB); package size limits pass.

- Implemented nineteen live `/concept` scenarios with actual control interactions, cancellable pointer/keyboard playback, replay/reset, manual takeover, one-pass previews, expanded mode, lazy product stages, and a shared density guide exhibit/recipe. Calendar demos now include views, themes, 4/40/400-event density, real drawing/saving, and rescheduling.
- Live-scenario verification: all 569 unit tests and 262 Chromium tests pass, including 35 concept checks for interaction outcomes, cursor geometry, mobile layouts, both calendar orientations, cancellation, and replay. Formatting, architecture, types, lint, Preact compatibility, demo build, package verification, size reporting, and pack dry-run pass. The demo build emits a non-blocking 541.34 kB main-chunk warning; package size limits pass and library assets are unchanged.

- Softened the concept cursor’s triangular outline with small curves at the tip, outer corners, and tail notch; retained its compact size and non-interactive overlay.
- Rounded-cursor verification: concept geometry checks pass. Full runs passed 564/565 unit tests and 229/230 Chromium tests. `tests/performance/layoutScaling.test.ts:61` measured 39.25× against a <25× limit; `e2e/specs/participant-focus.spec.ts:40` (20,000 events/year) timed out waiting for the external editor. Both passed isolated reruns. Formatting, architecture, types, lint, Preact, demo build, package verification, size reporting, and pack dry-run pass.

- Specified interaction choreography for every Calendar simulation: visible control clicks, scrolling, Shift-wheel zoom, hover, held drags, typing, and saving, with intermediate feedback and manual-interaction parity. Planning documentation only.

- Expanded the demo plan with first-class horizontal/vertical view, theming, and event-density scenarios, including shared-content comparisons and combined playground controls. Planning documentation only.

- Rethought the demo concept plan around distinct visible outcomes: three Calendar preview scenes, two opt-in editing scenes, focused product scenarios, and target-aware cancellable playback. This revision changes planning documentation only.

- Planned the concept’s main tours and advanced scenarios across all five products; refined its simulated pointer to a triangle with a small tail notch.
- Follow-up verification: all 230 Chromium tests and 565 unit tests pass, including pointer fill/notch and input-pass-through checks. Formatting, architecture, types, lint, Preact, demo build, package verification, size reporting, and pack dry-run pass.

- Added an isolated `/concept` demo approach with an immediately visible live calendar, gradient introduction, five product tabs, scenario pointer tour, guide recipe links, and expanded playground.
- Demo concept verification: Chromium full run passed 228/229; existing `calendar-row-filter.spec.ts:141` (navigation during a pending update) expected `2026-10-15` but received `2026-10-08`. The isolated rerun passed. All three concept checks passed separately; the full-suite run retains this intermittent verification caveat.

### Follow the current Shift state immediately - 2026-10-18

- Remove momentum capture and gesture-mode latching. Shift-wheel zooms; unshifted wheel scrolls immediately,
  accepting that remaining touchpad momentum can switch modes when Shift changes. Drop the restart-detection experiment.
- Restore native scrolling on Shift keyup. Cancel pending zoom on ordinary wheel input or window blur. If keyup
  was missed, deliver the first unshifted delta exactly once through the viewport adapter so hidden overflow does
  not swallow it. Preserve commit pacing, the 0.20 step and native-scroll suspension during Shift zoom.

- Verification: 565 unit tests and 30 selected Chromium/WebKit tests pass. Update the old vertical test's tail-capture
  expectation to immediate ordinary scrolling. Formatting, architecture, types, lint, Preact, demo build, package,
  size and pack checks pass. JavaScript is 33,305 B gzip (32.52 KiB), +206 B versus the prior gesture latch; CSS stays
  2,018 B. Firefox retains the recorded standalone startup blocker: sandbox extension `Operation not permitted`,
  SWGL framebuffer failure and 15-second timeout. No new Firefox retry or performance profile is claimed.

### Keep scroll and zoom gestures stable through Shift changes - 2026-10-18

- Latch scroll or zoom mode until 300 ms without wheel input. Pressing Shift during native scrolling no longer
  converts its momentum into zoom; a new gesture after quiet can zoom.
- Renew the 300 ms quiet period and native-scroll lock for every captured unshifted wheel sample after Shift release.
  Long touchpad inertia no longer outlives a timer anchored to the last Shift-wheel sample; it does not request zoom.
- Keep the one-second controlled-request timeout separate from ongoing momentum capture. Ordinary scrolling resumes
  after input is quiet, or on explicit viewport takeover. Preserve the 0.20 zoom step.

- Verification: 562 unit tests and 26 selected Chromium/WebKit tests pass. Formatting, architecture, types, lint,
  Preact, demo build, package verification, size and pack dry-run pass. JavaScript is 33,099 B gzip (32.32 KiB),
  up 54 B from the preceding 0.20 build; CSS is unchanged at 2,018 B. Physical testing confirms the Shift-release
  fix; the reverse transition has automated coverage and awaits physical confirmation. Firefox retains its recorded
  standalone startup blocker: sandbox extension `Operation not permitted`, SWGL framebuffer failure and 15-second timeout.

### Tune Shift-wheel zoom sensitivity - 2026-10-18

- Set the Shift-wheel/trackpad increment to 0.20 in both orientations, between the earlier 0.15 and 0.30 steps.
  Preserve commit pacing, pointer anchoring, limits and native-scroll suspension.
- Update accumulation, delayed/rejected-parent and zoom-detail expectations. Earlier matched performance measurements
  below describe commit `9add7ce` with a 0.30 step, not this sensitivity adjustment.
- Verification: 559 unit tests pass. The selected Chromium/WebKit run passed 84/92; the eight failures used old
  step expectations or a geometry probe below the horizontal effective-scale floor. After correcting those tests,
  all 10 affected/rechecked cases pass. Formatting, architecture, types, lint, Preact, demo build, package verification,
  size reporting and pack dry-run pass. JavaScript is 33,045 B gzip (32.27 KiB); CSS remains 2,018 B (1.97 KiB).

### Coordinate zoom requests after commit - 2026-10-18

- Accumulate Shift-wheel samples behind one unexpired controlled request. Wait for current DOM geometry and
  scroll correction before scheduling the next target; retain the 0.30 step, pointer anchor and zoom limits.
- Cancel pending intent on viewport/external takeover and teardown. Expire unacknowledged requests after one second
  without retrying abandoned input. This acknowledges DOM/scroll commit, not GPU presentation.
- Retain native-scroll suspension: the physical Chrome touchpad experiment reproduced rectangular gaps when the
  lock was disabled despite commit-aware pacing. Remove the temporary query switch.
- Defer ordinary-wheel takeover classification until native event dispatch finishes, preserving captured momentum
  tails in browsers that checkpoint microtasks between listeners.
- Add delayed/rejected-parent browser coverage, commit-order and timeout unit coverage, and matched production profiling.
- Three matched production rounds against `d6ac965`: responsive p95 CPU +7.2% horizontal and -4.4% vertical,
  at 5.238/7.883 ms. Comparative and absolute performance gates pass. Delayed-parent callbacks fall 64 → 16
  per run, with p95 input-to-commit latency increasing to 377.2/391.5 ms. Keep the PR draft as requested.
- JavaScript is 33,047 B gzip (32.27 KiB), up 503 B from `d6ac965`; CSS stays 2,018 B (1.97 KiB).
- Verification: 559/559 unit tests and 37/37 focused WebKit zoom tests pass. Full Chromium passes 222/223;
  the pending-update navigation case in `calendar-row-filter.spec.ts` fails its final settled-date assertion
  (October 29 rather than October 22), then passes 3/3 unchanged focused reruns. No clean full-suite pass is claimed.
  Formatting, architecture/contracts, types, lint, package verification, Preact, React 19, demo build, size and pack checks pass.
- Firefox retry remains blocked at standalone startup: `sandbox_extension_issue_file_to_process ... Operation not permitted`
  and `RenderCompositorSWGL failed mapping default framebuffer, no dt`, followed by a 15-second launch timeout.

### Increase Shift-scroll zoom responsiveness - 2026-10-17

- Double the Shift-wheel/trackpad zoom step from 0.15 to 0.30 in both orientations. Preserve pointer anchoring,
  frame coalescing, zoom limits and the native-scroll suspension that prevents inertial white gaps.
- Update controlled-wheel accumulation and browser zoom expectations for the increased sensitivity.
- Verification on 2026-10-18: all 549 unit tests pass. The overnight Chromium run passed 213/219; all six affected
  cases now pass focused reruns after updating two zoom expectations and accepting inclusive half-pixel native
  scroll rounding. Four unrelated guide/editor failures pass unchanged on rerun. WebKit passed 27/28, with its
  navigation timeout passing on rerun; both updated anchor scenarios also pass in Chromium and WebKit.
- Formatting, architecture/contracts, types, lint, demo build, package verification, Preact, React 19, size reporting
  and pack dry-run pass. JavaScript is 32,544 B gzip (31.78 KiB); CSS is unchanged at 2,018 B (1.97 KiB).
- Firefox remains blocked at standalone startup with `sandbox_extension_issue_file_to_process ... Operation not permitted`
  and `RenderCompositorSWGL failed mapping default framebuffer, no dt`, followed by timeout.

### Prevent blank patches during inertial touchpad zoom - 2026-10-17

- Temporarily suspend native scrolling during captured Shift-wheel/touch gestures while preserving programmatic
  anchor positioning. Restore the viewport's original overflow declarations after the 300 ms settling tail,
  on observed external takeover and on unmount.
- The affected Chrome session confirms this removes the rectangular grid/card gaps during physical-touchpad inertia.
  Preserve the original zoom sensitivity and render bounds; unsuccessful compositor/input-sensitivity experiments
  were removed.
- Add settling/style-restoration unit coverage and extend real-wheel Chromium/WebKit checks with computed overflow
  assertions alongside native-position, resumed-scrolling and existing per-frame zoom geometry checks.
- Verification: all 549 unit tests pass. The full Chromium run passes 218/219; its only failure used the old
  31.53 KiB guide expectation while the displayed measurement was updated. The corrected guide assertion and
  Shift-input tests pass all 10 focused Chromium/WebKit cases; 40 focused frame/input cases also pass.
  Formatting, architecture/contracts, types, lint, package verification, Preact, React 19, demo build, size reporting
  and pack dry-run pass. JavaScript is 32,543 B gzip (31.78 KiB), up 255 B; CSS remains 2,018 B (1.97 KiB).
- Firefox remains blocked at standalone startup with `sandbox_extension_issue_file_to_process ... Operation not permitted`
  and `RenderCompositorSWGL failed mapping default framebuffer, no dt`, followed by timeout.

### Keep Shift input from scrolling at zoom limits - 2026-10-17

- Capture Shift-wheel before zoom-limit and anchor checks in both orientations. Mouse-wheel and horizontal/diagonal
  trackpad input stay reserved for zoom at 0.5/8 without redundant controlled requests.
- Capture Shift-touch panning without requesting zoom or cancelling viewport ownership. Preserve ordinary input
  when zoom is disabled and resume ordinary wheel scrolling after the existing 300 ms momentum tail.
- Add seven unit cases and four real-wheel browser regressions checking unchanged native scroll coordinates at both
  limits and resumed scrolling after Shift release.
- Verification: 545 functional tests plus both isolated scaling tests pass; all four new real-wheel cases pass in
  Chromium and WebKit. The full Chromium run passes 218/219 cases; the row-filter restoration case times out waiting
  for `row-134` after expansion, then passes all five isolated repeats unchanged. All 20 focused WebKit cases pass.
  Formatting, architecture/contracts, types, lint, package verification, Preact, React 19, demo build, size reporting
  and pack dry-run pass. JavaScript is 32,288 B gzip (31.53 KiB); CSS remains 2,018 B (1.97 KiB).
- Firefox remains blocked at standalone startup with `sandbox_extension_issue_file_to_process ... Operation not permitted`
  and `RenderCompositorSWGL failed mapping default framebuffer, no dt`, followed by timeout.

### Integrate current main for runtime PR - 2026-10-17

- Merge main `edc6f38` and preserve its immediate full-opacity labels and 15/five-minute grid cadence in both new
  renderers. Disambiguate the runtime branch's Decision 116 as `116-runtime`, retaining the original record in Git
  and main's published Decision 116; Decision 117 retains its identifier.
- Keep the external-editor drag regression's destination on the exposed calendar instead of under the popup.
  The original destination hit the editor's date input; five focused repeats and the final full browser run pass.
- Integrated verification: 538 functional unit tests plus both isolated scaling tests, all 215 Chromium scenarios,
  and 24 focused WebKit scenarios pass. Formatting, architecture/contracts, types, lint, package verification,
  Preact, React 19, demo build, size reporting and pack dry-run pass.
- Integrated JavaScript is 32,224 B gzip (31.47 KiB), with CSS at 2,018 B (1.97 KiB). Prior performance comparisons
  remain explicitly historical: they precede this main integration and were not rerun for the merged runtime.
- Firefox remains blocked at standalone startup: `sandbox_extension_issue_file_to_process ... Operation not permitted`
  and `RenderCompositorSWGL failed mapping default framebuffer, no dt`, followed by timeout. Firefox acceptance remains open.

### Reuse viewport presentation and zoom layout - 2026-10-17

- Keep live native position in the engine while React reuses its frame when geometry and visible/mounted identities
  are unchanged. Memoize the horizontal time scale and cache date-label formatting.
- Reuse indexed resource metrics, prepared maps, date sequences and stable axis extents during zoom; project resource
  rectangles only when requested. Skip unneeded pin scans and repeated snapshot comparisons.
- Consume captured native observations for acknowledged wheel zoom without a redundant post-render DOM read.
  Discard observations superseded by a programmatic commit, and commit the current matching revision after pin-only
  updates so editor, focus and navigation restoration remain correct.
- Add seven focused work-count, projection and observation-order regressions. All 541 unit tests, 223 Chromium
  scenarios, 200 repeated frame/seeded cases and 18 focused WebKit cases pass. Architecture/contracts, typechecking,
  lint, formatting, package verification, Preact, React 19, demo build, size reporting and pack dry-run pass.
- Three rotating production rounds compare main, the initial rewrite and the optimized runtime across 3,006 samples.
  Horizontal scroll/zoom p95 CPU improves 20.0%/32.6% against the initial rewrite; scrolling is at main parity and
  zoom is 17.6% below main. Vertical zoom meets the 10 ms target at 9.112 ms. Vertical scroll p95 rises from
  3.534 to 4.179 ms despite a lower median; retain this profiling follow-up. Raw evidence and limitations are in
  `docs/infinite-calendar/performance-comparison.md`.
- JavaScript is 32,555 B gzip (31.79 KiB), 809 B above the initial rewrite and below the unchanged 50 KiB budget.
  Optional CSS remains 1,996 B gzip. The guide's displayed payloads and assertions match the measured artifacts.
- Firefox remains blocked at standalone browser startup with
  `sandbox_extension_issue_file_to_process ... Operation not permitted` and
  `RenderCompositorSWGL failed mapping default framebuffer, no dt`; complete cross-browser acceptance remains open.

### Unified Infinite Calendar runtime - 2026-10-17

- Rebuild both orientations around one mathematical viewport engine, immutable event repository and bounded date/resource windows.
- Preserve semantic event/participant/time anchors through zoom, async loading, editor changes and recentering. One adapter owns programmatic scroll writes.
- Preserve public API, styling, consumer rendering and controlled behavior. Remove the old runtime and unused TanStack dependency.
- Add model, request-race, public-handle, controlled-input and seeded browser coverage, with a repeatable dense-calendar profiling fixture.
- Compare production builds against main `3138b28` with three alternating rounds and 2,004 sampled operations.
  Vertical scroll/zoom p95 CPU falls 28.5%/40.6%; cached navigation medians fall 56.7%/61.1% in horizontal/vertical.
  Horizontal scroll/zoom p95 CPU rises 22.9%/26.0%; vertical zoom remains 10.299 ms against the 10 ms target.
  Keep these performance follow-ups open. Record raw samples and host-contention limitations in `docs/infinite-calendar/performance-comparison.md`.
- Infinite Calendar JavaScript is 31,746 B gzip, down 25.7% from 42,719 B; optional CSS remains 1,996 B gzip.
- Verification: 532 functional tests and both isolated scaling checks pass, as do all 223 final Chromium scenarios,
  200 sensitive repeats, 140 post-memoization zoom/seeded repeats, and 18 final focused WebKit scenarios. Formatting,
  architecture/contracts, typechecking, lint, demo/package builds, Preact, React 19, size reporting and pack dry-run pass.
  An earlier complete unit run passed 534 tests; the final combined run had one noisy mixed-layer scaling ratio
  of 27.42 against 25, with both isolated performance checks passing unchanged. A row-filter setup timeout passed
  five isolated repeats and final full runs; the final guide assertion was updated to the measured bundle size.
- Firefox verification remains blocked before any application test: standalone browser launch times out after
  `sandbox_extension_issue_file_to_process ... Operation not permitted` and
  `RenderCompositorSWGL failed mapping default framebuffer, no dt`. Cross-browser acceptance remains open.

### Remove zoom transparency - 2026-10-17

- Remove the zoom transparency feature, including opacity ramps, fade styles and the extra grid-detail layer.
  Restore immediate full-opacity time labels, original readability thresholds and direct grid-cadence changes.
- Retain stable tick nodes, zoom anchoring and the standalone Timepicker's minute font weight of 400.
- Replace transparency tests with immediate visibility, grid geometry and no-animation regressions in both orientations.
- Verification in an isolated checkout: all 543 unit tests and all 213 Chromium scenarios pass. Formatting,
  architecture/contracts, typechecking, lint, library/demo builds, package verification, Preact and React 19
  compatibility, size reporting and pack dry-run pass. Infinite Calendar is 42,332 B gzip JavaScript and 2,018 B gzip CSS
  (Node 23.10), within unchanged budgets. No verification blockers remain.

### Immediate wheel zoom detail - 2026-10-17

- Replace the 160 ms time-detail transition with opacity derived from committed zoom. Shift-wheel/trackpad reversals
  update detail and geometry together and leave no fade catching up after input stops. Keep anchor scheduling unchanged.
- Retain semantic nodes while hiding zero-opacity labels and grid layers from layout. Preserve reduced-motion support.
- Add dense wheel/slider regressions for immediate intermediate opacity, reversals, stable nodes and geometry,
  hidden-detail display and no animation tail, plus current-scale opacity unit coverage.
- Verification: all 544 unit tests and all 221 Chromium scenarios pass. Formatting, architecture/contracts,
  typechecking, lint, library/demo builds, package verification, Preact and React 19 compatibility, size reporting
  and pack dry-run pass. Infinite Calendar measures 42,719 B gzip JavaScript and 1,996 B gzip CSS within unchanged budgets.
- A shared-preview restart interrupted the initial browser run. An isolated run reproduced the previously recorded
  3,345px dense-editor reopening jump; three focused repeats and the final full four-worker run pass without further
  source changes. No verification blockers remain.

### Regular-weight Timepicker minutes - 2026-10-17

- Set `.quno-time-picker-minute-option` to font weight 400. Update its desktop/mobile computed-style assertions
  and presentation documentation.
- Verification: all 543 unit tests and all 213 Chromium scenarios pass, including standalone desktop/mobile typography.
  Formatting, architecture/contracts, typechecking, lint, demo build, package verification, Preact and React 19
  compatibility, size reporting and pack dry-run pass. Timepicker CSS is 803 B gzip within its unchanged budget.
  No verification blockers remain.

### Fade progressive zoom detail - 2026-10-17

- Fade time labels and extra five-minute grid lines in and out over 160 ms in both orientations. Retain nodes and
  update geometry immediately; rapid reversals continue from current opacity. Respect reduced-motion preferences.
- Add Chromium checks for intermediate/final opacity, reversals, accessibility, stable nodes and grid geometry.
- Keep the steady quarter-hour grid separate from its fading detail layer; update existing geometry and sticky-label
  checks to distinguish retained hidden labels from visible ones. Refresh guide payload measurements.
- Verification: all 543 unit tests and all 213 Chromium scenarios pass. Formatting, architecture/contracts, typechecking, lint, demo build,
  packed-package verification, Preact and React 19 compatibility, size reporting and pack dry-run pass.
  Infinite Calendar measures 42,543 B gzip JavaScript and 2,000 B gzip CSS against unchanged budgets.
  No verification blockers remain.

### Vertical zoom paints its final layout directly - 2026-10-17

- Use one committed-layout wheel zoom coordinator for both orientations. Remove vertical nine-frame scroll retries;
  apply the pointer date/time anchor with actual geometry before paint, including synchronous date-model changes.
- Project retained and pinned vertical dates into final uniform geometry; publish actual scroll, visible-date and
  date/resource windows before paint. Use final canvas height immediately so abrupt minimum/maximum slider changes
  cannot clamp against the old spacer. Retain the saved semantic date while a structural target awaits its new model.
  Slider zoom keeps its existing top-date/time focus policy.
- Add dense 20,000-event per-frame wheel/slider coverage at two window sizes, including the full zoom range and idle
  recentering. Add delayed-parent, synchronous re-anchor, external takeover and uniform pinned-date unit coverage.
- Verification: all 543 unit tests and all 205 Chromium scenarios pass. Formatting, architecture/contracts,
  typechecking, lint, demo build, package verification, Preact and React 19 compatibility, size reporting and pack
  dry-run pass. Infinite Calendar measures 42,332 B gzip JavaScript and 2,018 B gzip CSS against unchanged budgets.
- The first full 205-scenario run passed 204; dense participant editor reopening reported 3,345px drift once.
  Three focused repeats and a clean full 205-scenario rerun passed without further source changes.
  No persistent verification blockers remain.

### Horizontal zoom without sideways correction frames - 2026-10-17

- Restore the first pointer-nearest time node in the same layout commit as horizontal wheel zoom, using actual
  effective settings. Remove predicted scroll writes and three-frame corrections that exposed sideways jumps.
- Let external zoom take over immediately during a wheel gesture; retain the current scroll snapshot for its anchor.
  Delayed controlled parents retain their old geometry until committing, and unmount drops pending notifications.
- Add dense 20,000-event per-frame marker/appointment assertions for wheel and slider reversals at two window sizes,
  plus controlled-commit, external takeover, intervening vertical correction and unmount unit regressions.
- Verification: all 541 unit tests and all 193 Chromium scenarios pass; the final wheel/slider/core refinement also
  passes all 12 focused Chromium scenarios. Formatting, architecture/contracts, typechecking, lint, demo build,
  package verification, Preact and React 19 compatibility, size reporting and pack dry-run pass. Infinite Calendar
  measures 42,276 B gzip JavaScript and 2,018 B gzip CSS, within the unchanged budgets.
- The first concurrent unit run exceeded a timing-sensitive layout-scaling threshold. The final isolated full unit
  suite passes without changing that benchmark or the layout implementation. No verification blockers remain.

### Server-owned demo range queries - 2026-10-17

- Replace browser-generated event uploads with `{ startDate, endDate, calendarIds, eventsPerYear }` queries. Vite and
  Vercel use one validated Web handler to generate/filter requested years, with a bounded server fixture cache.
  Build the server-only service behind a native private import so emitted Vercel functions resolve it without dev aliases.
- Generate appointments inside every participant's working hours and use host-independent local wall-clock fixture
  timestamps. Support leap days and distinct event identities across years.
- Keep session creates, edits and moves across refetches, including saves during pending reads and moved-source
  suppression. Preserve equal-start response ordering; dataset changes reset the local overlay.
- Add API validation/determinism, session-race and Berlin/New York request/geometry browser regressions.
- Verification: all 537 unit tests and all 189 Chromium scenarios pass. Four query/loading browser scenarios also
  pass after the deployment wiring change. Formatting, architecture/contracts, typechecking, lint, demo build,
  package verification, Preact/React 19 compatibility, size reporting and pack dry-run pass. A clean build with the
  Vercel Node builder returns filtered events; native Node runtime coverage protects the server import mapping.
  Library JavaScript/CSS artifacts and public API remain unchanged. No verification blockers remain.

### Coordinated draw and Cancel layout - 2026-10-16

- Batch drawn-create and Cancel draft changes with their restoration requests. Pin the restore date through create
  closure, then coordinate measured date positions, anchor correction and both virtual windows before paint.
- Add Chromium frame assertions at 1280px and 1800px for the October 17 Room 203 scenario: no displaced or missing
  row, horizontal drift or blank date gap through opening, fade-out, deferred measurements and restoration completion.
- Verification: all 520 unit tests and all 186 Chromium scenarios pass. Formatting, architecture/contracts,
  typechecking, lint, packed-package verification, Preact and React 19 compatibility, demo build, size reporting and
  pack dry-run pass. Infinite Calendar measures 42,101 B gzip JavaScript and 2,018 B gzip CSS against the unchanged
  50 KiB and 2 KiB ceilings.
- The first full Chromium run passed 185/186; dense participant editor opening reported 331px drift once. Three
  focused repeats and a clean full 186-scenario rerun passed without further source changes. No persistent blocker remains.

### Offscreen draft save anchoring - 2026-10-16

- Fix saving an October 20 draft for Marco Eggens after scrolling to December showing another day. Save uses a
  visible editor anchor or its retained last-seen position, then restores the horizontal participant slot through
  returning rows and deferred measurements. Manual scrolling still cancels restoration.
- Add sparse and dense Chromium regressions asserting the original row position, saved event and settled geometry.
- Verification: 520 unit tests and all 184 Chromium scenarios pass. Formatting, architecture/contracts, typechecking,
  lint, package verification, Preact and React 19 compatibility, demo build, size reporting and pack dry-run pass.
  Library artifacts and public API remain unchanged; no verification blockers remain.

### Stable resource highlights - 2026-10-16

- Fix alternating horizontal row highlights flipping as earlier rows leave the mounted window, including when
  October 30 is first visible and October 31 is second. Use the complete displayed resource order for parity,
  matching vertical columns. Update the field guide's night theme and add computed-color Chromium coverage.
- Verification: 520 unit tests, formatting, architecture/contracts, typechecking, lint, packed-package verification,
  Preact and React 19 compatibility, demo build, size reporting and pack dry-run pass. Infinite Calendar measures
  41,999 B gzip JavaScript and 2,018 B gzip CSS, within the unchanged 50 KiB and 2 KiB ceilings.
- Full Chromium run: 180/182 pass, including the new highlight regression. Both initial failures pass on a focused
  rerun: the guide-size check had loaded its old expectation before the refreshed figures, and the later-participant
  create/Cancel anchor check reported 500px drift once. No persistent verification blocker remains.

### Viewport request stability - 2026-10-09

- Load settled viewport dates independently of render overscan and offscreen editor pins. Coalesce fast scrolling
  before deriving requests. Keep adjacent boundary reads alive through row contraction without requesting extra dates.
- Add optional `loadCalendarIds` to keep read coverage independent of displayed rows, including an empty selection.
  Existing consumers default to selected IDs. Retain generation guards, bounded retries and late-data anchoring.
- Add Chromium coverage for 135-row filtering, zero-row reads, request boundaries, pending reads and fast reversals.
- Adapt the focused demo to use its base calendar selection for read coverage during participant editing. Verify
  calendar-count filtering alongside the existing editor, cancellation and vertical-view regressions.

### 0.6.3 upstream integration - 2026-10-08

- Merged upstream `b774e96`. Preserve the demo's resource-slot opening/Cancel policy, hover stability and active
  restore-date pin alongside late-data anchoring and date-only consumer editor outcomes. Each transition uses one
  restoration target. Onboarding retains the opening date on Cancel and the Save-click date on successful Save.
- Added frame-by-frame regressions for real 3-second demo responses during rapid wheel reversals with one and six
  calendars. Keep the last viewed date and row through delayed responses and idle recentering.
- Stabilized two existing browser checks: wait for today's loaded events before selecting empty drawing space, and
  use wheel input to test manual-scroll cancellation instead of a programmatic scroll assignment.
- Verification: 515 unit tests, all 175 Chromium scenarios and 348 onboarding calendar tests pass. Formatting,
  architecture/contracts, typecheck, lint, library/demo builds, packed modern/legacy TypeScript, ESM/CommonJS/SSR,
  Preact, React 19 and pack dry-run pass. The installed onboarding runtime and declarations match the rebuilt library.
- The merged Infinite Calendar measures 173,133 B raw and 41,248 B gzip (40.28 KiB), plus 2,035 B gzip optional CSS
  (1.99 KiB), within the unchanged 50 KiB/2 KiB budgets. Preserve both branches' accepted decision records and
  distinguish concurrent identifiers by their full title/anchor.

### 0.6.3 local package - 2026-10-08

- Date-only parent anchors keep the opening or Save-click day through editor completion and returning participant rows.
  They preserve horizontal scrolling, recover an unmounted date and yield to manual navigation. Deferred compact base
  measurements refresh once while the date restore owns focus. Event/resource anchors and drag behavior stay unchanged.
- Late offscreen overlap updates retain the displayed date and row through the scroll-area commit, then render the
  corrected virtual range before paint. This prevents both persistent jumps and a missing-row intermediate frame.
  Pending responses never override newer navigation. Coverage includes growth, shrinkage and changed participant rows.
- Horizontal row-count changes rebuild cached base date estimates and retain known dense-day measurements.
  Preserve the date and surviving resource offset after the new scroll spacer commits. This prevents distant
  date jumps and request churn when a consumer hides empty rows or expands a compact selection.
- Missing-resource anchors clamp inside an unloaded date's new base geometry, including an empty selection.
  The visible-date probe stays within the captured date. There are no new public calendar contracts.
- Verification: 515 unit tests and 166 Chromium scenarios pass. One existing external-editor scroll scenario needed
  an isolated retry after the full browser run. Formatting, architecture/contracts,
  typecheck, lint, library/demo builds, packed modern/legacy TypeScript, ESM/CommonJS/SSR, Preact and React 19 checks
  pass. The 135-row regressions verify geometry, idle settling and bounded request ranges; existing create/cancel and
  dense participant tests retain their positioning and no-refetch checks.
- Infinite Calendar measures 172,649 B raw and 40,967 B gzip (40.01 KiB). Optional CSS is 2,035 B gzip (1.99 KiB).
  Both remain within the 50 KiB JavaScript and 2 KiB CSS ceilings.

### Changes from latest main

- Fixed `/demo/infinite-calendar` jumping to the previous day when opening a compact overlapping appointment and
  shifting again on hover after Cancel. Horizontal editor transitions now restore the clicked participant's resource/time
  slot, retaining the original participant fallback and manual-scroll cancellation. Added October 8 Acne Therapy
  regressions at two desktop widths with repeated open/Cancel/hover and eight seconds of geometry/mutation checks.

- Fixed Cancel jumping to October 14 after removing Dmitry from the Acne Therapy draft. Horizontal restores now
  retain their target date through resource resizing, and edit Cancel queues the restore with the draft update. Creation retains its existing closing-range handling. Added three
  repetitions of the exact participant sequence at 1280 × 800 and 1440 × 900 with one and six calendars, plus a larger
  desktop case, including immediate hover and post-restore geometry checks.

- Editor stability verification: all 511 unit tests and all 160 Chromium scenarios pass. Formatting, architecture/contracts,
  typecheck, warning-free lint, demo build, package verification, Preact, React 19, size reporting, and pack dry-run pass.
  Refreshed guide measurements to 39.57 KiB gzip Infinite Calendar JavaScript and 1.99 KiB optional CSS against
  the unchanged ceilings. Final complete runs pass; no verification blocker remains.

- **Breaking:** Date Parser now returns top-level `start` and `end` objects containing `{ date: IsoDate, time: string | null }`
  for successful and partial-range results. Removed `value`, `times`, and `DateInputTimeRange`; export
  `DateInputParseEndpoint` from the parser subpath instead. Date-only and missing clocks are `null`; empty/invalid
  results remain status-only. Updated internal analyzers, Date Input, public demos/guides, package/type guards,
  and migration recipes together. Grammar, ranking, overnight rules, and UI value/callback shapes remain unchanged.

- Paired parser endpoint verification: all 511 unit tests and all 153 Chromium scenarios pass, including desktop/mobile
  endpoint output and containment checks. Formatting, architecture/contracts, typecheck, lint, library/demo builds,
  packed modern/legacy TypeScript, ESM/CommonJS/SSR, Preact, React 19, size reporting, and pack dry-run pass.
  Date Parser measures 23,178 B raw and 6,172 B gzip (6.03 KiB) against its unchanged 7 KiB ceiling; Date Input
  measures 35,547 B raw and 9,868 B gzip (9.64 KiB) against its unchanged 10 KiB ceiling. Guide measurements are refreshed.

- Additional browser verification: WebKit passes the time-selector typography/geometry checks but fails the existing enabled-day arrow focus assertion at 1280px and 390px (`Next enabled day` is inactive after a click). The Firefox probe was stopped while browser startup remained pending. Required Chromium verification remains the handoff baseline.

- Hour headings now stand out from minute numbers in standalone Timepicker and Datepicker time mode: 16px bold text in the normal text color, beside 13px/550 minute options. Desktop/mobile browser checks verify computed styles, rail fit, and sticky layering.

- Five-minute cadence now uses six choices per row in Timepicker and Datepicker time mode, producing two full rows per hour. Updated the guide, cadence table, and unit/browser geometry expectations.

- Omitted or empty `enabledHours` now enables all 24 clock hours in Timepicker, Datepicker, and forced Date Input validation/arrow edits. Nonempty lists continue to restrict choices. Updated both demos with an All (empty list) choice and covered midnight/boundary-hour selection and typing. See the migration note for consumers that previously used an empty list to disable time choices.

- Timepicker and Datepicker time selection now size minute rows by cadence: 1/2/3/4/6 minutes use five columns, 15 uses four, 5/10 use six, 20 uses three, and 30 uses two. Added 20-minute cadence to both selectors, demo controls, shared types, and forced Date Input validation/arrow edits. Full-row geometry and all supported cadence choices are covered on desktop and mobile.

- Added standalone `QunoTimePicker` through `@quno/calendar/timepicker` with optional scoped styles, controlled/uncontrolled HH:mm values, null clearing, disabled state, enabled hours, all ten minute cadences, sticky hour headings, and at most six minute choices per row. Datepicker reuses its private slot renderer while retaining existing behavior and customization names. Added `/guide/timepicker`, `/demo/timepicker`, a fifth home card, public API guards, packed compatibility coverage, and desktop/mobile geometry tests. Timepicker measures 1.59 KiB JavaScript and 0.78 KiB CSS gzip against separate 3 KiB and 1.5 KiB ceilings.

- Fixed omitted-year clock parsing such as `6 oct 2pm`: single and partial timed endpoints now rank one date rather
  than accidentally spanning two years. The Optional time mode demo accepts this as `6 October 2026 14:00`;
  explicit range endpoint ranking remains unchanged. Added parser, native-input, and both-guide browser regressions.

- Selecting an enabled day in single-day time mode now immediately opens time selection, including same-day reselection and keyboard activation. Removed the time button below the calendar and its `timeButton`/`time-button` customization surface and `chooseTime` label. The existing selection summary above the calendar shows the clock. Focus stays on the stable title when entering or leaving time selection; pointer compatibility clicks cannot carry through to minute options. See the migration guide.

- Clicking the full-date title in time mode now returns to day selection in the selected date’s month, preserving the day, clock, and title-button focus. Its accessible action uses the existing Choose a date label; the month title still opens month/year navigation from day mode.

- Time-view header arrows now select the previous/next enabled day while preserving the clock and keeping the time selector open. They skip disabled dates, respect date limits, and disable exhausted directions. The demo includes Skip weekends and preserves time mode across month boundaries. Accepted a 12.5 KiB gzip Datepicker ceiling for the enabled-day search and cancellation behavior; other limits remain unchanged.

- Time navigation now titles the picker with the selected full date (for example, `19 October 2026`) and restores the visible month when returning to days. Optional `formatters.timeDate` customizes the localized date title.

- Typed single-day clocks now ignore picker cadence and enabled hours by default. Add Date Input’s
  `forceCadence={true}` to enforce both on commits and clock Arrow edits. The date-time demo and guides expose the
  default-off setting; minute options now match calendar numbers’ 13px size and 550 weight.

- Added optional single-day `timeMode` to Datepicker and Date Input with separate controlled/uncontrolled
  `time`/`defaultTime` clocks, shared enabled hours and minute cadence, and `{ value, time }` changes.
  Datepicker advances from day selection to in-place time navigation with sticky hour labels and at most six minute columns; selecting a
  minute returns to dates and retains keyboard focus. Date Input recognizes familiar English/German clocks, optionally validates
  the shared time settings with `forceCadence`, preserves time during date spins, and edits clocks at the caret.
- Made the existing vertical draft browser assertion wait for its frame-scheduled geometry instead of reading the
  initial preview height.
- Added `/demo/date-time` and interactive public-entry-point compositions with copyable recipes in both guides.
  Date-only/range defaults and the headless parser grammar remain unchanged. Accepted the added time UI/parser bundle
  cost with Datepicker and Date Input JavaScript ceilings of 12.5 KiB and 10 KiB gzip; all other ceilings remain unchanged.
  Measured artifacts are 12.46 KiB gzip for Datepicker and 9.60 KiB for Date Input; picker CSS is 3.36 KiB.

### Added

- Optional synchronous `projectEvents` and its named types separate local preview rendering from persisted event loading. Both orientations prepare projected events without mutating cached data or invalidating requests; empty rendered dates support previews. The lazy guide example demonstrates preview movement with a stable load count.

- Exported `CalendarEventBase` from `@quno/calendar/infinite-calendar`. `CalendarEvent` inherits its `id`, `calendarId`, and `start` fields so consumers can share a named contract for an event identity and start position.

- Optional consumer-owned `isLoading`/`loadingFallback` for initial calendar loading. Resource selection can arrive before the hidden timeline mounts and loads events, avoiding the header-only startup layout. The prefetch guide demonstrates delayed context, a supplied skeleton and centered initial navigation.

- Restored `getVisibleDateKeys()` for creation defaults based on the actual viewport. Added optional `align: "center"`
  to horizontal resource-row navigation, including rows that are already visible. The navigation guide demonstrates both.

### Changed

- Merged Date Parser clock recognition and composed picker focus retention into the calendar improvements.
- Retained the accepted 50 KiB Infinite Calendar and 7 KiB Date Parser JavaScript gzip ceilings, leaving room
  for future changes. Refreshed production guide measurements for the combined implementation.

- The earlier 39 KiB Infinite Calendar ceiling for version 0.6.2 is superseded by the merged 50 KiB ceiling.
  Decision 099 preserves the original acceptance; Decision 100 records the combined branch budget.

- Corrected the local package version for `feat/more-improvements` to `0.6.2`. The manifest, lockfile, and current README use the same version. Earlier `0.6.3` and `0.6.4` local builds are verification history.

### Fixed

- Dense participant editing now preserves measured horizontal day heights when opening or changing a draft, restores
  the clicked event instance, and prevents idle recentering from competing with an explicit anchor restore. Required
  visible event captures reject missing/offscreen events instead of substituting resource slots. The 20,000-event
  create/save/edit regression includes 30 rapid toggles and eight seconds of stationary geometry with no late mutations.

- Accepted projected event drags now apply only proposed timestamps and participants to the persisted record. Clearing
  the projection restores saved metadata; projection-only events require an explicit commit or loader response.
- Raw date navigation, explicit restoration, and cancellation supersede queued horizontal row requests. Centered
  distant navigation follows the live row height when async collision layout grows it.
- Initial loading retains component dimensions before resource metadata exists. Percentage and minimum dimensions
  apply once to the loading shell and remain consistent after the timeline mounts.
- Multi-participant event anchors retain the captured participant. The external editor keeps a surviving visible instance
  fixed through repeated participant toggles and transfers only when needed, preserving checkbox focus, empty-selection
  behavior, manual scrolling, and the original first-person Cancel anchor.

- Pointer jitter within the four-pixel click tolerance now activates an event even when it crosses a snap boundary.
  A changed proposal requires movement beyond that tolerance before requesting a move or updating the event cache.

- Initial loading now waits for a selected ID that exists in `calendars` before mounting the hidden timeline. IDs
  arriving before resource metadata or matching no resource keep the fallback free of header-only geometry.

- Corrected the navigation guide to describe `calendarId` as an optional field in the `scrollToDateTime` options object.

- Resource-row navigation and viewport-anchor restoration now wait for committed parent layout. A selection or draft
  update followed by the existing handle call works without consumer `flushSync` wrappers. Batched navigation uses
  the latest request, and cancellation can discard a restore before it starts.

- A drag dropped back onto its original minute and calendar now neither activates the event editor nor sends a move request. The calendar tracks movement before frame coalescing; ordinary clicks still activate without consumer-side suppression.

### Verification notes

- PR 25 follow-up and participant anchoring: all 509 unit tests (four workers) and 153 Chromium scenarios pass.
  Browser regressions cover accepted projected drags in both orientations, explicit/percentage/minimum loading
  geometry, async collision centering, latest navigation, checkbox focus, and eight-second dense participant stability.
  The new browser fixtures also pass with generated `dist` removed. Formatting, architecture/contracts, typecheck,
  lint, demo build, packed-package verification, Preact, React 19, size reporting, and pack dry-run pass.
  Infinite Calendar measures 170,878 B raw and 40,417 B gzip (39.47 KiB); its CSS remains 2,041 B gzip.
  Both remain within the unchanged 50 KiB JavaScript and 2 KiB CSS ceilings.

- Drag click tolerance: all 432 unit tests pass. The full Chromium run passed 133 scenarios; the new jitter case
  passes after removing an unrelated cancel-scroll assertion, with all four drag scenarios passing on rerun.
  The 1–4 px unit cases and 1 px browser case reproduced the snap-boundary bug before the guard; 5 px still moves.
  Formatting, architecture/contracts, typecheck, lint, library/demo builds, packed React/package and Preact checks,
  size reporting, and pack dry-run pass. Infinite Calendar measures 168,202 B raw and 39,878 B gzip (38.94 KiB),
  within its 50 KiB ceiling. The guide's raw-size figure is refreshed.

- Loading resource intersection and navigation-guide correction: all 427 unit tests and all 133 Chromium scenarios pass.
  Both orientation regressions and the startup browser check reproduced premature mounting before the fix. Formatting,
  architecture/contracts, typecheck, lint, library/demo builds, packed React/package and Preact checks, size reporting,
  and pack dry-run pass. Infinite Calendar measures 168,189 B raw and 39,875 B gzip (38.94 KiB), within its 50 KiB ceiling.
  Guide figures and unit/browser payload expectations stay aligned.

- Version 0.6.2 with the accepted 39 KiB budget: aggregate `npm run verify:package` passes. Formatting, architecture, typecheck, lint, 13 affected unit tests, the Chromium payload-guide test, the demo build, and pack dry-run pass. The earlier size-gate failures below describe verification against the previous 38 KiB ceiling.

- Local event projection: all 351 unit tests and all 119 Chromium scenarios pass. Typecheck, lint, architecture, formatting, library/demo builds, packed Preact and React 19 compatibility, packed-package verification and pack dry-run pass. Infinite Calendar JavaScript is 39,858 bytes gzip, 946 bytes above the unchanged 38 KiB ceiling (358 bytes above the preceding 0.6.3 build). This existing size gate still blocks the aggregate `verify:package` command; its packed-package checks pass separately. Other artifact budgets pass.

- Committed-layout navigation: all 347 unit tests and all 118 Chromium checks pass, including batched resource selection, controlled draft restoration and the saved-event motion regression. Typecheck, lint, architecture and formatting pass. Final Infinite Calendar JavaScript is 39,500 bytes gzip, 588 bytes above the unchanged 38 KiB limit (123 bytes more than the preceding build). Other artifact budgets pass.

- After merging `0.6.1`, the corrected guide-size assertions pass: 341 unit tests, typecheck, lint, architecture, and formatting pass, and the library builds. The Infinite Calendar gzip result remains 39,377 bytes, 465 bytes over the 38 KiB budget; this pre-existing size gate still fails.

- Drag-back activation: all 14 focused interaction tests pass, including 8 new gesture regressions, and all 3 Chromium drag scenarios pass. The full Chromium run passed 117 of 118 scenarios; the one guide timeout passed when retried after building. Package typecheck, lint, architecture/contracts, library/demo builds, Preact compatibility and packed React/import/style verification pass. Full unit tests pass 336 tests with the same five documented stale guide assertions; repository formatting still flags the unchanged `OffscreenPills.tsx`. The final Infinite Calendar artifact is 39,377 bytes gzip, 465 bytes above its unchanged 38 KiB ceiling (259 bytes more than the previous build).

- Viewport navigation and startup loading: all 117 Chromium checks pass, including loading-fallback visibility, delayed-context initialization, centered resource-row geometry and middle-visible-date selection. Typecheck, architecture, lint, builds, Preact compatibility and packed-package verification pass. The full unit run has five existing stale guide-size assertions (`DemoStory.test.tsx`: one; `FieldGuideProduction.test.tsx`: four), with 328 tests passing. Repository-wide formatting flags the unchanged `src/lib/date-picker/OffscreenPills.tsx`; changed files pass. The Infinite Calendar bundle is 39,118 bytes gzip, 206 bytes above the existing 38 KiB ceiling; the ceiling remains unchanged. Calendar CSS remains within its 2 KiB ceiling at 2,035 bytes gzip.

## 0.6.1 - 2026-10-02

This package contains the current `feat/internal-calendar-core` contracts, including the headless root `singleDay` export used by onboarding. The new versioned archive gives consumers a distinct package identity for deployment.

### Added

- Added optional horizontal resource-row navigation through `scrollToDateTime({ date, time, calendarId })`, using the
  calendar's virtualized geometry and cancellation lifecycle instead of consumer DOM observers.
- Added `typesVersions` mappings for public subpaths so projects using legacy Node-style TypeScript resolution no longer need local declaration shims.
- Exported `CALENDAR_EVENT_KINDS`, `CALENDAR_RULE_KINDS`, and their types for the appointment, availability, and blocker domain.
- Added opt-in Date Parser clock recognition with `recognizeTime: true`: traditional 24-hour and AM/PM forms,
  time-only input anchored to the reference date, and time ranges with inherited dates and overnight rollover.
  Existing date values stay intact; optional `times` holds normalized `HH:mm` clocks. Tokenization can expose explicit
  clock tokens with original spans. The guide and focused demo demonstrate the opt-in; Date Input consumes it only
  when single-day time mode is enabled.

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

- Separated event identity from presentation: `kind: "availability"` is foreground and participates in overlap metrics
  unless `renderLayer: "availability"` explicitly selects the background treatment. Legacy `consultation`,
  `blocked`, and `draft` event-kind values are replaced by `appointment` or `blocker`; see the migration guide.
- Gave explicitly background-layered availability deterministic lanes independent from foreground events in both
  orientations. Resource rows and columns grow to the greater layer depth, and background availability renderers
  receive meaningful `lane`, `laneCount`, and `isOverlapping` metadata.
- Kept clock recognition outside Date Input's date-only analyzer and reused date-resolution/ranking logic without
  raising feature ceilings. Current ESM measurements are 6,143 B gzip for Date Parser (6 KiB ceiling), 7.70 KiB for
  Date Input (8 KiB ceiling), and 10.49 KiB for Datepicker (10.5 KiB ceiling); production guides report refreshed sizes.

- Gave overlapping availability deterministic lanes independent from appointments in both calendar orientations.
  Resource rows and columns now grow to the greater layer depth, and availability renderers receive meaningful
  `lane`, `laneCount`, and `isOverlapping` metadata. This intentionally changes geometry for resources with parallel
  availability windows without changing `CalendarEvent` or adding public configuration.
- Coalesced Infinite Calendar pointer previews, Datepicker captured-pointer painting, and quick-jump virtual scrolling
  to one latest-value publication per animation frame while preserving synchronous release and commit behavior.
- Reused unchanged event-bucket snapshots and date preparation, memoized static Datepicker structure, compiled Date
  Input analysis per configuration, and deferred ordinary recognition decoration without changing parser or input
  commit contracts.
- Updated measured ESM artifacts and accepted ceilings for the combined changes: Infinite Calendar is
  37.88 KiB gzip with a 38 KiB ceiling, Datepicker is 10.46 KiB with a 10.5 KiB ceiling, and Date Input remains within
  its 8 KiB ceiling at 7.80 KiB.

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

- A drag dropped back onto its original minute and calendar activates the event editor without sending a move request.
- Transferred Start/End shortcut focus to Datepicker's stable month heading before navigation removes the chip, keeping
  composed Date Input popups open and their selected range intact for pointer and keyboard activation, including reduced motion.
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

### Verification

- Additional Firefox check blocked locally: `browserType.launch` timed out after 180000ms. Firefox reported
  `sandbox_extension_issue_file_to_process ... plugin-container.app: 1 (Operation not permitted)` and
  `RenderCompositorSWGL failed mapping default framebuffer, no dt`. Chromium and WebKit endpoint-navigation checks pass.

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
