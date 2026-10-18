# Demo concept

Open `/concept` with `npm run dev`. Each of the 19 scenarios has a viewport-sized section containing its title,
one or two explanatory paragraphs, and a live demo. Product tabs stay at the top. A horizontally swipeable title
rail stays at the bottom; choosing a title scrolls vertically to its section. Scrolling between sections selects
the nearest demo after settling. Only the active section mounts its working component.

The Full screen demo button sits below the explanation beside the recipe link. Fullscreen shows only the working
demo and compact playback/exit controls. Entering and leaving preserves the mounted component’s state and returns
focus to the launch button. Escape stops playback and exits. Scenarios never open fullscreen automatically.

Desktop demos remain interactive inline. The initial scene plays once unless reduced motion is enabled; Play tour
explicitly runs the product’s preview sequence and scrolls between its sections. Title selection replays that scene;
manual section scrolling opens it paused. Replay and Reset restore scene state; Try it preserves the current result.
Pointer, wheel, keyboard, focus, and real calendar hover stop playback; hidden tabs cancel pending work.

At widths up to 850 px, inline previews are inert, cannot take focus, and do not play simulations. Touch gestures
navigate the page or the title rail. Open fullscreen to interact or use replay controls. Leaving fullscreen restores
the inert preview while retaining its current state. Reduced motion uses immediate section navigation.

The slightly rounded triangular cursor has a small tail notch. Playback operates actual buttons and input fields,
dispatches demo-scoped pointer/key events through the component handlers, and scrolls the real viewport. Synthetic
drag capture is adapted only on the participating demo elements and restored on completion or cancellation.
No library internals or production runtime changes are needed. The event renderer formats timestamp clocks locally. The chosen orientation carries into other Calendar scenes and replay; the view-comparison scene explicitly demonstrates both orientations.

Each scenario has its own JSON file under `scenarios/<product-id>/<scenario-id>.json`, containing its label, hint,
guide anchor, one or two `paragraphs`, initial state, and playback steps. Product manifests in `scenarios/` contain
product copy, explore links, and ordered scenario/preview IDs. `demo.json` contains startup, tab order, schema version,
and shared dates. `scenarioSources.ts` discovers scene files automatically; validation checks file IDs and references
before assembling the catalog.

`PlaybackActor.ts` implements reusable interactions; `PlaybackHover.ts` routes unpressed movement through browser hit
targets; `playbackSteps.ts` interprets actions without branching on scene IDs. Product modules load lazily, with Calendar
mounted immediately. Fixtures, playback cancellation, and the shared density exhibit retain their existing behavior.

## Edit scenarios in JSON

| Demo        | Product manifest                                             | Example scenario file                                |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Calendar    | [infinite-calendar.json](./scenarios/infinite-calendar.json) | [zoom.json](./scenarios/infinite-calendar/zoom.json) |
| Datepicker  | [datepicker.json](./scenarios/datepicker.json)               | [paint.json](./scenarios/datepicker/paint.json)      |
| Date Input  | [date-input.json](./scenarios/date-input.json)               | [natural.json](./scenarios/date-input/natural.json)  |
| Timepicker  | [timepicker.json](./scenarios/timepicker.json)               | [time.json](./scenarios/timepicker/time.json)        |
| Date Parser | [date-parser.json](./scenarios/date-parser.json)             | [phrase.json](./scenarios/date-parser/phrase.json)   |

Edit a scenario’s file to change its copy, initial values, docs anchor, or actions. Its `id` must match its filename.
To add a scenario, create a new JSON file in the product folder, add its ID to the product manifest’s `scenarios`
array, and optionally include it in `preview`. Those arrays define order; filenames do not. No TypeScript registry
edit is needed for new scenarios using existing actions. Missing files, mismatched IDs, duplicate references, and
invalid actions fail validation before playback. Existing scenes can share an ID across different products.

Edit [demo.json](./demo.json) only for shared reference dates, tab order, startup product, or schema version.
Date selectors and explicit typed dates in steps must agree with its `context`. Each scenario declares `id`, `label`,
`hint`, `paragraphs` (one or two nonempty strings), `anchor`, `initial`, and `steps`. Its `anchor` names a
section in the product’s field guide. The old combined `scenarios.json` remains removed.

For example, a Date Input scene can be added entirely as data:

```json
{
  "id": "tomorrow",
  "label": "Plan tomorrow",
  "hint": "Enter tomorrow and commit the date.",
  "paragraphs": ["Type a relative date in the native field, then press Enter to commit it."],
  "anchor": "controlled-state",
  "initial": { "range": null, "selectionMode": "single", "picker": false, "label": "Appointment date" },
  "steps": [
    { "action": "type", "target": "[data-action=\"date-input\"]", "text": "tomorrow" },
    { "action": "key", "target": "[data-action=\"date-input\"]", "key": "Enter" },
    { "action": "wait", "ms": 1200 }
  ]
}
```

Supported actions are `find`, `wait`, `aim`, `click`, `hover`, `cue`, `type`, `key`, `scroll`, `scroll-to`, `scroll-day`,
`wheel`, `slider`, `drag-dates`, `draw-event`, and `move-event`. See `scenarioTypes.ts` for their fields and the existing JSON
for complete examples. Targets are CSS selectors scoped to the active canvas. Waits and wheel intervals are in
milliseconds; scroll amounts and move offsets are pixels. `scroll-to` centers its destination in the scroll area;
`scroll-day` adapts its distance to orientation. `draw-event` offsets are multiples of the reference appointment's
duration; `move-event` points to the destination resource grid. Scroll actions and `slider` require `durationMs` and `easing` (`linear` or `ease-in-out`). The default
scrolls take 1500 ms; the zoom slider takes 1800 ms. Playback uses cancellable animation frames, easing both ends
and preserving exact scroll distance across pixel rounding. `slider` dispatches native input events throughout a
visible held drag, so the calendar's controlled geometry changes continuously. Target reveals also scroll smoothly.
Shared movement/press pacing belongs to the actor. Reduced motion starts idle; explicitly playing a scene opts into
its demonstration motion. Any manual input or hidden tab cancels the next frame immediately.

Initial settings differ by product: Calendar view/theme/density/zoom/overlap; picker range/single-day mode; input
range/selection mode/picker/label; time value/cadence/business hours; parser text/date order/clock recognition.
Calendar view `preferred` preserves the visitor's chosen orientation. Explicit views override it for that scene.
Replay and Reset use the same JSON initial settings. No executable code belongs in JSON; a new interaction primitive
requires an explicit typed adapter. Invalid fields, actions, values, IDs, or preview references fail validation with
an actionable path. The existing 19 scenes remain the default content.

## Implemented scenario design

The following tables describe the implemented scenes and the presentation contract they follow.

### What makes a scenario

Each scenario answers one question with a visible before → action → after. Its short label names a recognizable
capability; its instruction describes something the visitor can try. Use a deliberate fixture that makes the result
obvious. End on that result long enough to inspect it, then offer Replay, Try it, and the matching docs recipe.

Infinite scroll, Zoom, and Overlapping events form a short Calendar preview. Editing scenarios are selected explicitly. All scenarios
remain individually accessible; visitors never need to wait for the tour to reach one. Calendar has eight first-class
shortcuts: six exploration scenarios and two editing scenarios. Use a compact wrapping rail on narrow screens.
Other products have their own smaller scenario list.

### Calendar: explore, understand, then act

Use one recognizable appointment schedule with named people, rooms, and appointments. Avoid generating the same
three overlapping cards in every row and every day. Each scene starts with the minimum data needed to explain it.

| Shortcut              | Starting scene and simulated action                                                                                                                                                                                                                    | Visible payoff / visitor instruction                                                                                                                               | Recipe                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Horizontal / vertical | Begin with the same named appointment and resources in horizontal view. Point at the view control, switch to vertical, and briefly highlight that appointment in its new position.                                                                     | See how the same schedule works in both layouts. Preserve the selected date and keep the reference appointment visible. “Switch the view.”                         | `/guide/infinite-calendar#horizontal-first`; supporting `/guide/infinite-calendar#calendar-cell-styling`   |
| Infinite scroll       | Start on a legible, moderately busy day. Move continuously across a day boundary, settle on the next day, then continue. Keep a visible date readout.                                                                                                  | The schedule continues without paging. “Scroll to the next day.”                                                                                                   | `/guide/infinite-calendar#infinite-view`                                                                   |
| Zoom                  | Begin with a broad schedule containing a short appointment. Press the visible zoom slider and drag it continuously from 1.3× to 2.3×, then release.                                                                                                    | The appointment and time divisions gain readable detail through continuous controlled zoom. “Drag to zoom”; Shift-wheel remains available manually.                | `/guide/infinite-calendar#zoom`                                                                            |
| Event density         | Keep date, resources, zoom, and theme fixed. Change a deterministic fixture from Quiet (4) to Busy (40) to Packed (400) events per day, then scroll through the packed schedule. Preserve a few named appointments at every level.                     | Inspect how the calendar lays out and navigates increasing event counts. Show the actual events/day and resource count. “Try a busier schedule.”                   | `/guide/infinite-calendar#performance`; includes the live density exhibit and its copyable fixture recipe. |
| Overlapping events    | Start with three appointments at the same time for one person, already laid out in separate lanes. Move between their cards to reveal compact details.                                                                                                 | Every appointment is reachable despite the shared time. “Hover each appointment.” Keep overlap geometry visible before hover.                                      | `/guide/infinite-calendar#overlap-lanes`; supporting `/guide/infinite-calendar#hover-reveal`               |
| Theming               | Keep the same appointments, orientation, density, and geometry. Switch between Light, Dark, and a distinct branded palette using the visible theme control. Restyle headers, resource labels, grid, event cards, selection, and focus states together. | Show that the whole calendar can fit a product's visual language while retaining the same interaction and content. “Choose a theme.”                               | `/guide/infinite-calendar#styling`; supporting `/guide/infinite-calendar#event-cards`                      |
| Create an appointment | Start with a clearly empty slot. Point, press, drag, and release. Show the external draft editor, enter a short title, and save.                                                                                                                       | A real saved appointment occupies the drawn interval. “Drag an empty slot.” Use fullscreen for more space while editing; on mobile it is required for interaction. | `/guide/infinite-calendar#drag-create`                                                                     |
| Reschedule            | Start with one named appointment and an obvious empty destination on another person's row. Drag the appointment, show its snapped preview, release, and hold the final state.                                                                          | Its time/person changes without losing its identity. “Drag the appointment to another person.”                                                                     | `/guide/infinite-calendar#drag-create`                                                                     |

The automatic preview plays Infinite scroll → Zoom → Overlapping events once, around 20–25 seconds total, and
stops with Try it available. It must not loop endlessly or open an editor while a visitor reads the introduction.
Horizontal / vertical, Event density, Theming, Create, and Reschedule run when selected. Selecting a scenario prepares its starting state and plays its demonstration;
Try it stops automation and leaves a useful working state. Replay restores that scene's fixture before playing again.

Horizontal / vertical, Theming, and Event density are dedicated demonstrations with their own shortcuts and docs
links. Their controls also remain available for manual experimentation in the expanded playground. Let visitors
combine vertical view, a dark theme, and packed data. The demonstrations introduce one change at a time so its
effect is clear. Exercise scrolling, zoom, overlaps, creation, and movement in both orientations where supported.

Event density means the number of appointments in the schedule. Keep event-count controls separate from visual
compactness settings such as row height or card padding. Keep the overlap scene small enough to inspect each lane;
the density scene shows many events across multiple resources. Report fixture counts honestly, and do not infer
frame-rate guarantees from a simulated cursor. Theme switching must not quietly change event counts or zoom.

### Datepicker: direct manipulation

| Shortcut       | Demonstration and payoff                                                                                                                   | Recipe                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Paint a range  | Drag from the 19th to the 23rd; show the provisional band, then committed endpoints on release. Hold a small “19–23 Oct · 5 days” summary. | `/guide/datepicker#paint`        |
| Adjust the end | Start with that range and drag its end to the 25th; the start remains fixed and duration becomes seven days.                               | `/guide/datepicker#paint`        |
| Move the range | Drag the selected band one week later; both endpoints move and the seven-day duration remains visible.                                     | `/guide/datepicker#segment-drag` |

These form a coherent three-step preview using the same selection. Selecting any step directly restores its own
starting range. Single-day mode and month/year navigation stay available as playground controls. The composed
Date Input example below owns the fuller typed-date-to-picker story.

### Date Input: fast entry, precise correction

| Shortcut               | Demonstration and payoff                                                                                                                                          | Recipe                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Type naturally         | Type “next Friday”, show the text while editing, press Enter, and show the committed date beside the field. Display the fixed reference date used by the example. | `/guide/date-input#controlled-state`                                               |
| Edit with the keyboard | Start with a formatted date, place the caret in its day, and show ↑ then Enter. Only the intended date part changes; show focus/caret and the pressed keys.       | `/guide/date-input#keyboard-controls`                                              |
| Type, then pick        | Enter a range, open the composed picker, extend its end, and close it. The same value updates in both places.                                                     | `/guide/date-input#picker-composition`; supporting `/guide/date-input#range-input` |

Preview only Type naturally automatically. The keyboard and composed examples start on selection. This avoids a
long typing animation and keeps the field available quickly. Invalid input, partial ranges, and clear/reset remain
manual examples in the guide until they warrant a distinct user-facing story.

### Timepicker: two useful demonstrations

| Shortcut              | Demonstration and payoff                                                                                                                                                           | Recipe                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Choose a time         | Scroll from one hour to another at a fine cadence, keeping the sticky hour visible, then choose a minute. Show the selected HH:mm value.                                           | `/guide/timepicker#time-selection` |
| Keep an existing time | Begin with 10:35 at five-minute cadence, then switch to fifteen-minute cadence. The summary stays 10:35 although that minute is not offered; explicitly choosing 10:45 changes it. | `/guide/timepicker#ownership`      |

Preview Choose a time automatically. Keep an existing time is an opt-in behavior explanation. Cadence and enabled
hours are visible controls. Be explicit that they control offered choices and do not round an existing value.
Do not imply that this standalone control determines appointment availability or performs booking validation.

### Date Parser: make interpretation inspectable

Use a small sentence-to-result workbench. Show readable start/end dates and clocks first, with copyable structured
output available below. The UI belongs to the demo; the package product remains headless.

| Shortcut          | Demonstration and payoff                                                                                                               | Recipe                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Resolve a phrase  | Parse “next Friday” beside a fixed, visible reference date. Replace it with “next month” to show a period with two endpoints.          | `/guide/date-parser#relative-dates`       |
| Resolve ambiguity | Keep “03/04/2026” unchanged while switching DMY ↔ MDY. Highlight the result changing between 3 April and 4 March.                      | `/guide/date-parser#preferred-date-order` |
| Cross midnight    | With clock recognition enabled, parse “tomorrow 23:00–01:00”. Show the end on the following day, with each date paired with its clock. | `/guide/date-parser#time-parsing`         |

Preview Resolve a phrase automatically. Other scenes start on selection. Expected-period ranking, multilingual
recognition, tokenization, and invalid results remain directly linked guide topics rather than additional tour stops.

### Keep deeper exploration within reach

Use a compact Explore more area with links to existing live guide chapters, separate from the scene shortcuts:

- Calendar: availability, asynchronous loading, event rendering, date navigation, localization, and deeper performance details. View orientation, theming, and event density have primary scenario shortcuts above.
- Datepicker: quick month/year navigation, hidden-week dragging, week starts, and optional time selection.
- Date Input: range entry, parser configuration, localization, accessibility, and native editing details.
- Timepicker: enabled hours, cadence, clearing, disabled state, and controlled/uncontrolled recipes.
- Date Parser: expected period, language configuration, range normalization, and token inspection.

Resource filtering, rejected moves, editor cancellation, and additional stress cases remain in the existing focused
demos and verification coverage. The primary Event density scene provides the visible busy-schedule comparison. Add a new scenario only when it teaches a distinct interaction with an obvious outcome.
Do not turn every prop, edge case, or test into a presentation scene. All docs links must target an actual chapter
with its live exhibit and copyable recipe; fill a documentation gap before promoting a new shortcut.

### Interaction choreography

The simulation teaches how to operate the live component. Each scenario must show the input that causes the
result: approach the target, perform the gesture, show its immediate feedback, then hold the resulting state.
Selecting a scenario only sets up playback; it must not skip straight to the final configuration.

| Scenario              | Visible interaction sequence                                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Horizontal / vertical | Move to the Vertical button → show press and release → the button becomes selected and the calendar rearranges → move to the recognizable appointment and hover it → click Horizontal to compare.                             |
| Infinite scroll       | Move into the scrollable grid → show a small wheel/trackpad cue while the actual viewport scrolls continuously → cross a date boundary → stop the cue and hold the new date. The cursor stays over the grid during scrolling. |
| Zoom                  | Move to the zoom slider → press its thumb → hold and drag while actual calendar geometry interpolates → release → hold the readable appointment.                                                                              |
| Event density         | Move to the density control → click Busy → wait for the appointments to settle → click Packed → scroll and hover an appointment in the dense schedule. Keep the chosen preset and actual count visible.                       |
| Overlapping events    | Move onto the first overlapping card → dwell until its hover detail appears → move to the next card → the previous hover clears and the new target responds. The highlighted card must match the pointer location.            |
| Theming               | Move to the theme control → click Dark → wait for the whole calendar to restyle → hover an event to show its themed interaction state → click the branded theme and repeat.                                                   |
| Create an appointment | Move to an empty slot → press and hold → drag through the intended interval while its draft preview follows → release → click the title field → type the name visibly → move to Save and click → hold the saved card.         |
| Reschedule            | Move onto the appointment → press and hold → drag across time/resource boundaries while its snapped preview follows → release over the destination → hold the committed placement.                                            |

Use the same pattern for the other products: visibly drag picker endpoints and bands, place the input caret and
show typing/keys, scroll the time list and click a minute, or click parser settings while the same input remains
visible. Keep real controls accessible after playback so the visitor can repeat precisely what they watched.

A click pulse appears on press/release, a held-pointer cue lasts for the complete drag, and key/scroll cues last
only while that input is active. Use short action captions such as “Drag to 11:30” or “Click Dark”, alongside the
persistent scenario name. Avoid trails and decorative pointer wandering. Allow a brief pause over the target
before acting, and two or three seconds on the outcome; pace by completed interactions rather than timer ticks.

Playback must use the live control's interaction logic and produce its real intermediate states: pressed controls,
selection, draft previews, hover details, text edits, and commit feedback. Where the simulated pointer needs a demo
adapter, keep that adapter scoped to the demo and verify parity with manual interaction. Moving a visual cursor
does not itself activate browser hover, focus, scrolling, or drag behavior; each illustrated interaction needs an
explicit working implementation. The cursor tip must remain aligned with the target as layout and scroll change.

### Playback and presentation rules

1. Establish the starting state for about a second, perform one legible action, then hold the result for two or three
   seconds. Creation and editing may take longer. Advance when the action and resulting layout finish; avoid a
   fixed interval that changes scenes mid-action.
2. Move the slightly rounded, notched triangular pointer to the actual target. Use a click pulse for press/release and a held state for
   drags; use key badges for keyboard input. The cursor and label must stay inside the exposed canvas and must not
   intercept input or obscure the result. The gradient introduction remains over part of the calendar.
3. Drive live behavior and visible geometry. Infinite scroll must visibly scroll instead of jumping to a date;
   zoom must show an anchored scale change; overlap needs its own purposeful fixture. A moving pointer beside an
   unrelated state update is insufficient. Manual use and playback must produce equivalent results.
4. Stop immediately on visitor pointer-down, wheel, or keyboard interaction, including focus entering the working
   control. Real calendar hover takes over from the preview. Product changes and hidden tabs cancel pending actions;
   returning does not silently resume. Reduced motion starts with a static, usable scene and explicit Play.
5. Replay restores scene data, viewport, selection, editor state, and pointer before starting. Try it preserves the
   useful current result. Reset restores the scene without playing. Product switching must not leave timers or
   delayed actions that affect the next product.
6. Keep the demo and playback/Exit controls reachable in fullscreen. Recipe links stay under the inline explanation.
   Mobile previews sit below the intro and remain inert; only fullscreen enables interaction. Keep the title rail at the viewport bottom.
7. Announce meaningful scene/result changes without narrating every animation frame. Keep focus stable; the
   illustrative cursor never takes keyboard focus. Load only the active product and mount secondary exhibits lazily.

### Verification

Accept a scene only when its start and outcome are distinguishable, the shown interaction causes that outcome,
and the visitor can take over without a pending script changing their work. Assert intermediate states as well as
the final result: control press/selection, held drag and preview before release, hover detail under the cursor,
and text edits before commit. Compare playback outcomes with the equivalent manual gesture. Browser checks must verify
real scroll/date progression, zoom anchors, overlap separation, saved/moved event state, emitted values, pointer
alignment, clipping, cancellation, reset/replay, keyboard focus, reduced motion, and narrow-screen fit as applicable.
For the added scenarios, verify the reference appointment and date survive orientation changes, theme styles reach
headers/grid/cards/focus states without changing the data, and each density preset reports its actual fixture count
with bounded rendering and accessible event geometry. Run these checks in both orientations.
Use screenshots for visual review alongside those assertions. The original drifting-pointer prototype has been replaced by interaction-driven playback.

Overlap `hover` steps dispatch pointer movement on every animation frame, using the browser hit target and `buttons: 0`. The row/column hover resolver selects the appointment beneath the pointer, even when another expanded card covers it. These steps never dispatch press, release, or click events, and never open the editor.

Card text rows never wrap or shrink vertically. The title comes first, with an ellipsized clock below when height
allows. Below 38 px, a compact title row replaces the two-row layout. Hover reveals the clock and details, targeting
240 px width within the existing hover allowance and preserving wider events. Vertical hover uses the full resource
column. These styles stay in `playground.css`; calendar duration geometry and public styles are unchanged.

Navigation coverage checks screen containment, title-to-section scroll positions, intermediate smooth-scroll frames,
native touch swipes in both directions, inert mobile inputs, fullscreen state/focus restoration, and all existing
scenario outcomes. Scenario explanations and ordering remain JSON-controlled.
