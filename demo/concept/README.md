# Interactive concept playground

Demo popups show chapter explanations without a recipe link. Open Documentation in the shared header for implementation recipes.

`/` is the main interactive homepage, also served at `/concept`, using public `@quno/calendar/*` entry points.
All five products share a live full-window canvas and a floating information guide. Current field guides are at
`/docs`; the previous guides are preserved at `/docs/archive`. Focused demos and legacy guide routes still work.

## Presentation and interaction

The guide begins with a product introduction. The contextual contents button opens a left-aligned contents list inside the guide;
previous/next navigation stays in its footer. Contents has no back action. Collapsing retains the title, fullscreen
and chevron at the same responsive width. Fullscreen sits immediately left of the chevron in every state, including
contents and fullscreen. Escape exits fullscreen and restores focus; from contents it first returns to the explanation.

Above 850 px, drag the whole guide except buttons and links, or focus it and use arrows, Shift-arrows, and Home.
Its default left/bottom inset is 24 px, clamped on constrained displays; height changes grow upward from that corner.
At 850 px and below, the guide becomes a full-width bottom drawer with safe-area padding. Tap its downward chevron
or swipe down more than 48 px from the header/chevron to collapse it; tap the upward chevron or swipe up to reopen.
Short and cancelled drags leave its state unchanged. Mobile header/chevron taps, swipes and Enter/Space disclosure
keep the current playback running without restarting or resuming an already paused demo. Text and contents scroll
natively without dragging the drawer.
Height changes animate over 240 ms unless reduced motion is enabled. Desktop controls are 34 px; mobile controls
have 44 px touch targets. Fullscreen/viewport changes preserve the working component and desktop guide position.

Non-calendar products sit right of the guide on wider screens. On mobile their top-aligned, scrollable stages fill
the entire canvas behind the drawer. No height is subtracted or space reserved for the explainer; collapse, contents
and explanation changes leave product position/size unchanged. Collapse the drawer to reveal covered controls.
Calendar scene controls sit at bottom right on desktop and above the drawer on mobile, clearing its current height.
There are no separate scenario pages, bottom title rail, launch buttons, inert previews or playback toolbar.

Chapter arrival starts playback unless reduced motion is enabled. Every chapter loops in place without clicking
chapter navigation. Revisiting restarts it. Manual pointerdown, wheel, keyboard, focus entering a working control,
hiding the tab, product changes and unmount cancel pending actions. Mobile drawer disclosure/header gestures and
associated focus are presentation-only; contents, fullscreen and desktop guide interactions still pause. Hover alone
does not pause. Synthetic synchronous
focus is marked internal so real component navigation can run without cancelling its own script.

## Edit scenarios in JSON

- `demo.json` owns schema version, product order, startup selection and shared fixture dates.
- `scenarios/<product-id>.json` owns product metadata, explore links and ordered scene/preview IDs. Optional
  `tabLabel` shortens only the top menu; `label` and `description` retain the full introduction. Parser uses the short
  tab with a Date parser heading and explains tokenization followed by meaningful date interpretation.
- `scenarios/<product-id>/<scenario-id>.json` owns one scene's `id`, `label`, `hint`, `anchor`, `paragraphs`, `initial`
  and ordered `steps`. Calendar allows one to three paragraphs; other products allow one or two.
  Optional `chapterOnly: true` keeps the reused introduction on its ready initial value until the chapter is chosen.
- `calendarIntroduction.json`, `datepickerIntroduction.json` and `dateInputIntroduction.json` own their product introductions. The other
  introductions use product descriptions.

Vite discovers scene files automatically. Add a file and reference its ID in the manifest; existing actions need no
player edits. Validation checks filenames, IDs, references, initial contracts and typed action fields. Captions remain
authoring metadata. `[shift-scroll]` in explanation text renders as a Shift + scroll keyboard tag.

Supported actions are `wait`, `find`, `aim`, `click`, `hover`, `cue`, `type`, `key`, `scroll`, `scroll-loop`, `scroll-to`,
`scroll-day`, `scroll-year`, `slider`, `wheel`, `drag-dates`, `draw-event` and `move-event`. Animated scroll/slider actions specify
`durationMs` and `easing` (`linear` or `ease-in-out`). `scroll-to` defaults to center alignment and accepts
`align: "start"` for a measured return to a day heading. `key` optionally sets the caret. Calendar-only scroll-loop,
scroll-day, creation and movement actions use public controls and actual viewport/event geometry. Never branch
playback behavior on scene IDs or use recipe navigation as a simulation action.

## Scene catalog

There are 25 action scenes and five introductory presentation pages. Calendar has nine presentation pages,
Datepicker eight, Date Input five, Timepicker four and Date Parser four.

| Product     | Scene                 | Recipe                                     |
| ----------- | --------------------- | ------------------------------------------ |
| Calendar    | Infinite scroll       | `/docs/infinite-calendar#infinite-view`    |
| Calendar    | Zoom                  | `/docs/infinite-calendar#zoom`             |
| Calendar    | Overlapping events    | `/docs/infinite-calendar#overlap-lanes`    |
| Calendar    | Horizontal / vertical | `/docs/infinite-calendar#horizontal-first` |
| Calendar    | Theming               | `/docs/infinite-calendar#styling`          |
| Calendar    | Event density         | `/docs/infinite-calendar#performance`      |
| Calendar    | Create an appointment | `/docs/infinite-calendar#drag-create`      |
| Calendar    | Reschedule            | `/docs/infinite-calendar#drag-create`      |
| Datepicker  | Paint a range         | `/docs/datepicker#paint`                   |
| Datepicker  | Adjust the end        | `/docs/datepicker#paint`                   |
| Datepicker  | Move the range        | `/docs/datepicker#segment-drag`            |
| Datepicker  | Guess the intent      | `/docs/datepicker#wrong-guess`             |
| Datepicker  | Access months         | `/docs/datepicker#quick-jump`              |
| Datepicker  | Switch to start/end   | `/docs/datepicker#shortcuts`               |
| Datepicker  | Single day            | `/docs/datepicker#single-day`              |
| Date Input  | Format guessing       | `/docs/date-input#parser-configuration`    |
| Date Input  | Type naturally        | `/docs/date-input#controlled-state`        |
| Date Input  | Edit with keyboard    | `/docs/date-input#keyboard-controls`       |
| Date Input  | Works with datepicker | `/docs/date-input#picker-composition`      |
| Timepicker  | Choose a time         | `/docs/timepicker#time-selection`          |
| Timepicker  | Keep an existing time | `/docs/timepicker#ownership`               |
| Timepicker  | Works with datepicker | `/docs/timepicker#production`              |
| Date Parser | Resolve a phrase      | `/docs/date-parser#relative-dates`         |
| Date Parser | Resolve ambiguity     | `/docs/date-parser#preferred-date-order`   |
| Date Parser | Cross midnight        | `/docs/date-parser#time-parsing`           |

## Calendar choreography

One stable Calendar instance owns a cached fixture source and session edits across chapters and fullscreen. Initial
view/theme/density/zoom and starting navigation reset per chapter. The public dateWindowRadius setting keeps seven
included dates per side (15 total), with idle recentering during the authored scroll pauses. Desktop uses a 238 px label pane (167 px vertically).
At widths up to 850 px, horizontal names use 30% of the measured viewport; names shrink from 16 to 12 px and dates
from 16 to 9.6 px. Real calendar geometry and the zoom floor share that width through resize and fullscreen.
There is no date/count status row or Saved/Moved corner message. Ordinary schedules have 22 appointments across the
working day, regular one-hour durations, 32 additional varied titles and 2× zoom. Density presets project 4/20/60
appointments from the same data. Compact titles and clocks stay on one line; hover reveals bounded details.

Scroll loops advance 900 px over one second with two-second pauses. Zoom quickly moves 8 → the effective minimum, explores 900 px, then
returns to 8 and scrolls back. Orientation changes include next-day pans and return to the initial day’s measured header, so an offscreen first
appointment is mounted before its final hover. Themes end
in Light. Density ends in Quiet/horizontal. Reschedule moves three different appointments forward, then back in
reverse order. Overlap hovers each underlying lane, moves outside all three and holds every card closed for 1500 ms.
Closed scenes declare `loop: "continue"`; creation restores its pre-run session checkpoint to bound automatic edits.

Creation's `initial.focusDraft: true` selects only the edited doctor while keeping all four `loadCalendarIds` stable.
Public viewport anchors retain the edited slot through Save/Cancel; both restore the normal participant selection.
Drafted and dragged cards keep their chrome, saving triggers an appearing glint, and Cancel releases a fading draft.
Saving/settled feedback in the explanation remains consumer-owned, with no invented public event status.

## Datepicker and Date Input choreography

Paint alternates October 12–16 and 19–23. Adjust extends the end from the 23rd to the 25th, pauses and restores it.
Move shifts the range forward one week, pauses and moves it back. All three use `loop: "continue"` to retain the
mounted picker and avoid a blank reset. Other Datepicker scenes retain initial-state restoration between passes.
Intent playback hovers after each of its first two clicks so the next interpretation appears before clicking again.
`PlaybackHover` emits mouse transitions and mirrors a day hover marker for demo-scoped preview CSS, since synthetic
pointer events cannot set native `:hover`. Manual takeover clears that marker; the public picker styles are unchanged.

Datepicker presents only the component: no single-day checkbox, hint underneath or raw result output. Selection mode
comes from scene JSON. Guess the intent clicks October 27 three times, extending October 19–23 to 19–27, changing
the other endpoint to 23–27, then keeping only October 27. Day pointerup already commits; the actor must not send an
additional keyboard-style click. Access months uses single-day mode, scrolls from October 2026 to 1980, chooses July
and selects 22 July 1980. The year scroll lasts 8840 ms, twice its previous duration. Its typed `scroll-year` action measures a mounted year group and derives the scroll distance
from the navigator’s first loaded year rather than assuming a pixel height. The target year must be in its loaded span.
Start/end shortcuts visit September and November without changing the range, then return to October. Single day
chooses several dates before returning to its initial date.

Date Input begins with first-person copy and Format guessing, which normalizes numeric dates using the preferred
order and valid alternatives. Type naturally enables ranges, including native typing after a dash. Works with
datepicker opens on field focus, keeps internal gestures open, follows typed endpoint months and closes on outside
focus or pointer interaction, without a toggle button.

Date Input omits the fixed reference date and raw result. The public input uses today's reference date and a rolling
expected period of twelve months either side. Natural typing cycles through tomorrow, yesterday, 22 July 1980 and
next Friday, waiting 1200 ms before each Enter and holding each formatted result for 1700 ms. Other authored Enter
actions retain 300 ms pauses. Keyboard editing
steps October 19 → 18 → 17 → 16, then November → December → January, before committing. The field itself shows the
formatted result. Parser keeps a fixed visible reference, semantic tokens and resolved endpoints as its teaching UI.
Timepicker uses 13 px regular minutes beside 16 px bold hours, top aligned in the concept's scoped styles.

## Ownership and verification

`ConceptTour`, `FloatingGuide`, `DemoContents` and `DemoNavigation` own presentation. `useFloatingGuide` stores
left/bottom offsets and publishes guide height for the phone Calendar control dock. `ConceptProducts` mounts only the active lazy
product and resets it on a scoped loop event. `useGuideDrawer` owns mobile height motion and header gestures; `usePlayback` owns repetition and cancellation; `PlaybackActor` and
typed action adapters drive actual controls. `playbackSurface` excludes the guide only during synchronous synthetic
hit testing, restoring native input immediately. The rounded, round-joined notched cursor rotates 15° CCW at its tip,
never intercepts input and renders no caption.

Browser coverage asserts geometry, layering, clipping, hit targets, bottom anchoring through disclosure and contents,
responsive separation, fullscreen state/focus, chapter looping, cancellation, intermediate interaction states and
manual parity. It checks every intent result, month/endpoint preservation, today's relative dates under multiple
browser clocks, the pre-Enter pause, repeated keyboard values, minute typography, saved glint and cancellation fade.
Fixture/schema tests verify exact counts, bounded data, stable anchors and independent JSON customization.
Run all repository checks listed in `AGENTS.md` before handoff. The only package behavior adjustment is range-prefix completion being limited to range-mode fields (QDI-007);
public contracts remain unchanged.

Works with datepicker hides the duplicate picker selection header through the public class override, leaving the
input as the range summary and retaining normal calendar navigation and selection.

Timepicker’s Works with datepicker chapter uses public single-day time mode, selecting October 21/10:45,
October 24/14:30 and October 19/09:00 so the loop returns to its start. Synthetic click handlers scope automatic
focus as internal; deliberate user input between actions still pauses playback. Parser shows token chips and resolved
endpoints directly beneath the phrase, keeping the actual recognition visible on desktop and phones.

Parser token chips show known English vocabulary in green, with month-name, weekday, relative and duration-unit
labels. Unknown words remain neutral. The same consumer-owned lexicon supplies the parser and chip meanings; raw
lexical types remain inspectable. A recognized word does not guarantee that the complete phrase is valid.

Standalone Timepicker places cadence below the control and omits its duplicate result and business-hours switch.

Parser chip labels also identify colon time separators and numeric years from 61–9999, preserving count/clock
context and neutral ambiguous numbers. This enriches demo presentation without changing the public token objects.

Date Parser has no Structured result, date-order controls or clock checkbox. JSON retains each chapter’s parsing
configuration. Ambiguity cycles 10-11-12, 01/02 and feb 11 80, holding each for 1700 ms before restoring 10-11-12.
Its day-first configuration resolves 2012-11-10, 2027-02-01 and 1980-02-11; Cross midnight retains clock recognition.

Date Parser opens with `12/01 10:00` already typed and recognized, using clock-enabled parsing. Its first scene
opts into `chapterOnly`, so introduction arrival/restoration leaves the ready control idle and editable. Choosing
Resolve a phrase cycles next Friday, tomorrow 10:30, past 3 days, 22 July 1980, 12 Oct 2026 - 16 Oct 2026 and
next month, holding each complete example for 1700 ms. Loop reset restores the ready date/time before repeating.

Guide footers contain only Previous and Next, with no counter or duplicate title. The contextual All calendar demos
(or current product) action opens contents and matches collapse height: 34 px desktop, 44 px mobile. Calendar docks
omit small labels, retain accessible group names and keep their independent 40 px height. Controlled drafts use the public
active-draft move callback; their editor follows dragging, Save commits the new slot and Cancel discards it.

## Appearance and zoom bounds

The shell and surrounding canvas follow the system color scheme on mount and live changes. Keep the explainer and
Datepicker, Date Input, Timepicker and Date Parser controls in their original light styles on bright panels. Ordinary
Calendar scene JSON uses theme: system; Theming retains its explicit Light cycle. Theme updates retain mounted state.

useCalendarZoom shares configured hours/label geometry with the calendar and observes viewport width. Horizontal
minimum fills the visible time axis, rounded up to 0.01 and bounded below by 0.5; vertical minimum is 0.5, maximum 8.
Slider playback reads those bounds. Native buttons disable at each limit, and out-of-range wheel requests release
pending intent so reversing remains responsive. No package or other route styles change.

Dark Calendar creation drafts use a dark green surface and light dashed border, keeping light title/clock text
readable. Light drafts retain their existing fill, and saved glints and cancellation fades remain in place.

The demo source cache retains the ordinary 22-event choreography and a separate 60-event density schedule per
loaded date, while loadEvents returns the ordinary 22-event baseline. Synchronous density projection reads only already-loaded full source dates and overlays session
edits. This prevents unprojected cached packed days outside the render range from distorting the scroll extent.
The guide’s embedded density exhibit opts out of concept-page grid rows and mobile preview control hiding.

Quiet/Busy/Packed use 4/20/60 events, with one/five/fifteen per person. densityFixtures seeds shuffled start times by
date across four bands of the working day; nested prefixes preserve the same appointment identities through toggles.
This separate fixture leaves the ordinary reference appointments and deliberate overlap/creation tours unchanged.

Standalone Timepicker uses a Cadence fieldset with 5 min, 15 min and 20 min buttons at least 80×44 px, 14 px text and
8 px gaps. The larger hit targets are scoped to timeCadence.css; public minute choices keep their own styling.
The Calendar introduction names navigation mouse travel and loss of focus during interactions explicitly.

## Homepage navigation

The concept is the main `/` page. `useConceptNavigation` reads validated product/chapter path segments. Calendar
chapters use `/calendar/zoom` and the Calendar introduction stays at `/`. Other product introductions are
`/datepicker`, `/date-input`, `/timepicker` and `/parser`; add a scene ID for a chapter, such as `/datepicker/paint`.
Explicit navigation pushes browser history; reload, recipient links and back/forward restore it. Each product
remembers its last chapter during the mounted visit. Playback, disclosure, theme and fullscreen do not modify the
URL. `/concept` and earlier query URLs convert to directory paths. The existing server catch-all rewrite supports
direct visits and reloads. Documentation opens `/docs/{product}` without archive discovery links or loading text.

The product tabs and Documentation link share `app/SiteHeader` with current documentation. They sit together
on the left on desktop. Documentation changes the destination link to Demo for the matching product, retains
active product navigation and follows the same browser light/dark preference.

Current documentation returns to the product playground through Demo in the shared header. It omits the extra
interaction-link panel and per-section Watch demo links; concept chapter routes and guide recipe anchors remain.

The guided main demo has no 320 px body floor. Its canvas/content and product grid can shrink to the available
mobile width without expanding the page; Calendar’s larger content remains scrollable inside its viewport. Keep
product mounts/cards shrinkable, and check portrait/landscape rotation, month navigation, drawer states and
fullscreen at 280, 320, 360, 390 and 844 px. Header tabs scroll internally when their labels do not fit.

The main Timepicker demo also constrains its inner card grid. At 320 px, compact side gutters keep the clock
inside the card and all three cadence buttons on one row without reducing their touch targets.
