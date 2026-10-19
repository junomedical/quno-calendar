# Interactive concept playground

`/concept` is an isolated demo application using public `@quno/calendar/*` entry points. All five products share a
live full-window canvas and a floating information guide. Existing focused demos and field guides retain their routes.

## Presentation and interaction

The guide begins with a product introduction. The contextual contents button opens a left-aligned contents list inside the guide;
previous/next navigation stays in its footer. Contents has no back action. Collapsing retains only the title and
34 px expand button at the same responsive width. Drag the whole guide except buttons and links, or focus it and
use arrows, Shift-arrows, and Home. The default left/bottom inset is 24 px, clamped on constrained displays.
Height changes grow upward from the retained left-bottom corner. Fullscreen/viewport changes clamp without
remounting the working component. The fullscreen button sits 16 px from bottom right; scene controls sit 8 px left
of it on the same bottom edge. Narrow Calendar chapters reserve clearance when their dock is present.

Non-calendar products sit right of the guide on wider screens. Below 720 px they use a scrollable region above it;
the guide reserves the fullscreen button's corner. This keeps the interactive control visible when copy is expanded.
There are no separate scenario pages, bottom title rail, launch buttons, inert previews or playback toolbar.

Chapter arrival starts playback unless reduced motion is enabled. Every chapter loops in place without clicking
chapter navigation. Revisiting restarts it. Manual pointerdown, wheel, keyboard, focus entering a working control,
hiding the tab, product changes and unmount cancel pending actions. Hover alone does not pause. Synthetic synchronous
focus is marked internal so real component navigation can run without cancelling its own script.

## Edit scenarios in JSON

- `demo.json` owns schema version, product order, startup selection and shared fixture dates.
- `scenarios/<product-id>.json` owns product metadata, explore links and ordered scene/preview IDs.
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
`durationMs` and `easing` (`linear` or `ease-in-out`). `key` optionally sets the caret. Calendar-only scroll-loop,
scroll-day, creation and movement actions use public controls and actual viewport/event geometry. Never branch
playback behavior on scene IDs or use recipe navigation as a simulation action.

## Scene catalog

There are 25 action scenes and five introductory presentation pages. Calendar has nine presentation pages,
Datepicker eight, Date Input five, Timepicker four and Date Parser four.

| Product     | Scene                 | Recipe                                      |
| ----------- | --------------------- | ------------------------------------------- |
| Calendar    | Infinite scroll       | `/guide/infinite-calendar#infinite-view`    |
| Calendar    | Zoom                  | `/guide/infinite-calendar#zoom`             |
| Calendar    | Overlapping events    | `/guide/infinite-calendar#overlap-lanes`    |
| Calendar    | Horizontal / vertical | `/guide/infinite-calendar#horizontal-first` |
| Calendar    | Theming               | `/guide/infinite-calendar#styling`          |
| Calendar    | Event density         | `/guide/infinite-calendar#performance`      |
| Calendar    | Create an appointment | `/guide/infinite-calendar#drag-create`      |
| Calendar    | Reschedule            | `/guide/infinite-calendar#drag-create`      |
| Datepicker  | Paint a range         | `/guide/datepicker#paint`                   |
| Datepicker  | Adjust the end        | `/guide/datepicker#paint`                   |
| Datepicker  | Move the range        | `/guide/datepicker#segment-drag`            |
| Datepicker  | Guess the intent      | `/guide/datepicker#wrong-guess`             |
| Datepicker  | Access months         | `/guide/datepicker#quick-jump`              |
| Datepicker  | Switch to start/end   | `/guide/datepicker#shortcuts`               |
| Datepicker  | Single day            | `/guide/datepicker#single-day`              |
| Date Input  | Format guessing       | `/guide/date-input#parser-configuration`    |
| Date Input  | Type naturally        | `/guide/date-input#controlled-state`        |
| Date Input  | Edit with keyboard    | `/guide/date-input#keyboard-controls`       |
| Date Input  | Works with datepicker | `/guide/date-input#picker-composition`      |
| Timepicker  | Choose a time         | `/guide/timepicker#time-selection`          |
| Timepicker  | Keep an existing time | `/guide/timepicker#ownership`               |
| Timepicker  | Works with datepicker | `/guide/timepicker#production`              |
| Date Parser | Resolve a phrase      | `/guide/date-parser#relative-dates`         |
| Date Parser | Resolve ambiguity     | `/guide/date-parser#preferred-date-order`   |
| Date Parser | Cross midnight        | `/guide/date-parser#time-parsing`           |

## Calendar choreography

One stable Calendar instance owns a cached fixture source and session edits across chapters and fullscreen. Initial
view/theme/density/zoom and starting navigation reset per chapter. The label pane is 238 px (167 px vertically).
There is no date/count status row or Saved/Moved corner message. Ordinary schedules have 22 appointments across the
working day, regular one-hour durations, 32 additional varied titles and 2× zoom. Density presets project 4/40/400
appointments from the same data. Compact titles and clocks stay on one line; hover reveals bounded details.

Scroll loops advance 900 px over one second with two-second pauses. Zoom quickly moves 8 → the effective minimum, explores 900 px, then
returns to 8 and scrolls back. Orientation changes include next-day pans and return to the initial day. Themes end
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
left/bottom offsets and publishes guide height for phone layout. `ConceptProducts` mounts only the active lazy
product and resets it on a scoped loop event. `usePlayback` owns repetition and cancellation; `PlaybackActor` and
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
configuration. Ambiguity types 04/13/2026 and returns to 03/04/2026; Cross midnight retains clock recognition.

Date Parser opens with `12/01 10:00` already typed and recognized, using clock-enabled parsing. Its first scene
opts into `chapterOnly`, so introduction arrival/restoration leaves the ready control idle and editable. Choosing
Resolve a phrase cycles next Friday, tomorrow 10:30, past 3 days, 22 July 1980, 12 Oct 2026 - 16 Oct 2026 and
next month, holding each complete example for 1700 ms. Loop reset restores the ready date/time before repeating.

Guide footers contain only Previous and Next, with no counter or duplicate title. The contextual All calendar demos
(or current product) action opens contents and matches the 34 px collapse control. Calendar docks omit small labels,
retain accessible group names and match the fullscreen control’s 40 px height. Controlled drafts use the public
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
