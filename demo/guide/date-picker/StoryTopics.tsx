import type { JSX } from "react";
import { BestGuessExample, PaintExample, SegmentMoveExample, WrongGuessExample } from "./InteractionExamples";
import { RangeInputExample } from "./RangeInputExample";
import { SingleDayExample } from "./SingleDayExample";
import {
  HiddenRowExample,
  MotionExample,
  QuickJumpExample,
  ShortcutExample,
  StableViewExample
} from "./NavigationExamples";
import { DayHandlerExample, LocalizationExample, ThemeExample, WeekStartExample } from "./CustomizationExamples";
import { StoryFeature } from "./StoryFeature";
import { StoryHowTo } from "./StoryHowTo";
import {
  basicUsageSnippet,
  customDaysSnippet,
  localizationSnippet,
  rangeInputSnippet,
  singleDaySnippet,
  themingSnippet,
  weekStartSnippet
} from "./storySnippets";

export const StoryTopics = (): JSX.Element => (
  <>
    <StoryFeature
      id="paint"
      number="01"
      kicker="Primary interaction"
      title="Paint first. Drag everything."
      copy="Press an empty date with a pointer or finger and drag to paint a period. Start, End, and the selected band are direct manipulation targets; the public value changes only when the gesture is released."
      instruction="Drag from 4 to 9 with a pointer or finger. Then grab either blue endpoint to resize it."
      howTo={
        <StoryHowTo
          title="Basic usage"
          language="TSX"
          copy="Import behavior and optional styles, then give the picker one range value and one change handler."
          code={basicUsageSnippet}
        />
      }
    >
      <PaintExample />
    </StoryFeature>
    <StoryFeature
      id="stable-view"
      number="02"
      kicker="Stable view"
      title="Six weeks, every month."
      copy="Every month uses the same 42-cell body and one reserved line for its title. Dates and the month name change, but the calendar height does not, so surrounding forms and popovers stay still."
      instruction="Use both chevrons and watch the bottom edge remain fixed."
    >
      <StableViewExample />
    </StoryFeature>
    <StoryFeature
      id="quick-jump"
      subsection
      number="03"
      kicker="Quick navigation"
      title="Jump years without leaving the calendar."
      copy="The month-and-year title opens an in-place navigator with a 100-year runway in either direction. Compact sticky-year blocks place a left rail beside month grids containing only their labeled year: January and February lead, complete rows run through November, and December closes on its own row. Year labels and month names share a distinct, theme-coordinated alternating text tone. Virtualization keeps the mounted page small and settled edge loading prevents iPhone momentum from cascading. A month, chevron, or Start/End jump restores the same six-week date view without changing the selected period."
      instruction="Click August 2026, flick or scroll through years, then choose a month. Open it again and click the title to close without jumping."
    >
      <QuickJumpExample />
    </StoryFeature>
    <StoryFeature
      id="hidden-row"
      subsection
      number="04"
      kicker="Hidden week"
      title="Day names become another row of dates."
      copy="During painting or endpoint dragging, the weekday strip becomes a progressive hidden previous week. Only dates reached by the selected segment appear, and the header keeps exactly the same height."
      instruction="With a pointer or finger, drag Start upward into MON–SUN, move across the labels, then leave the strip."
    >
      <HiddenRowExample />
    </StoryFeature>
    <StoryFeature
      id="segment-drag"
      subsection
      number="05"
      kicker="Segment movement"
      title="Move the whole period by days or weeks."
      copy="The highlighted band is draggable. Movement snaps to dates and preserves inclusive duration, whether the destination is three days away or several calendar rows away."
      instruction="Grab the pale middle of the range—not an endpoint—and drag it to another week."
    >
      <SegmentMoveExample />
    </StoryFeature>
    <StoryFeature
      id="best-guess"
      number="06"
      kicker="Click construction"
      title="Click once, extend, then edit by best guess."
      copy="From empty, the first click creates one day. A click before or after it extends the period. Once a range exists, another date moves the nearest endpoint, with outside clicks naturally extending Start or End."
      instruction="Click 8, then 16, then 20. Clear and try the same sequence backward."
    >
      <BestGuessExample />
    </StoryFeature>
    <StoryFeature
      id="wrong-guess"
      subsection
      number="07"
      kicker="Inline correction"
      title="Wrong guess? Stay on the date."
      copy="The first click applies the contextual guess. Hover that same clicked date to outline the next interpretation; click again for the opposite endpoint, then once more to keep only that day."
      instruction="Click 15, keep hovering it to see the outline, then click it twice more."
    >
      <WrongGuessExample />
    </StoryFeature>
    <StoryFeature
      id="shortcuts"
      subsection
      number="08"
      kicker="Range context"
      title="Start and End remain one click away."
      copy="When an endpoint is outside the visible month, a full-size shortcut slides from beneath the calendar on the correct side. It names the endpoint and its direction without changing selection."
      instruction="Use Start and End to jump across this July–September period."
    >
      <ShortcutExample />
    </StoryFeature>
    <StoryFeature
      id="motion"
      number="09"
      kicker="Micro-animation"
      title="Motion explains direction, then gets out of the way."
      copy="Month names and day numbers move vertically just enough to show travel direction. Endpoint shortcuts reveal from the calendar edge. The operating-system reduced-motion preference removes those animations automatically."
      instruction="Switch the demo mode, then use the month chevrons in each mode."
    >
      <MotionExample />
    </StoryFeature>
    <StoryFeature
      id="day-handler"
      number="10"
      kicker="Day handler"
      title="Mark the dates that matter to your product."
      copy="Give the component one function that runs for every date. It can add a class, color, or tooltip for Today, weekends, non-working days, holidays, or availability. The datepicker still owns clicks, dragging, focus, and screen-reader labels, so styling a date cannot break selection."
      instruction="Today has an orange ring, weekends are brown, every Wednesday is crossed out, and 27 August is marked by its exact date. The calendar remains fully interactive."
      howTo={
        <StoryHowTo
          title="Custom day attributes"
          language="TSX"
          copy="Return presentation-only props from typed date context; the component keeps every interaction handler."
          code={customDaysSnippet}
        />
      }
    >
      <DayHandlerExample />
    </StoryFeature>
    <StoryFeature
      id="localization"
      number="11"
      kicker="Internationalization"
      title="Locale is more than a translated month name."
      copy="Locale-aware month, date, day-label, and weekday formatting work together with translated interface labels and a configurable first day of the week. Products can replace any formatter without changing timezone-free values."
      instruction="Navigate months, inspect the French date summary and weekday labels, then use Effacer. Monday remains the first column."
      howTo={
        <StoryHowTo
          title="Localization"
          language="TSX"
          copy="Set the locale and week start, then translate every visible control label your product uses."
          code={localizationSnippet}
        />
      }
    >
      <LocalizationExample />
    </StoryFeature>
    <StoryFeature
      id="week-starts"
      subsection
      number="12"
      kicker="Different week starts"
      title="Start the week where your product does."
      copy="Week order is an explicit layout choice. Sunday-, Monday-, and Saturday-first calendars use the same timezone-free dates and six-week frame while aligning every weekday label and date cell to the chosen first day."
      instruction="Switch between Sunday, Monday, and Saturday. The selection stays put while its weekday columns realign."
      howTo={
        <StoryHowTo
          title="Choose the first weekday"
          language="TSX"
          copy="Pass a weekday index from 0 (Sunday) through 6 (Saturday), or control it from product settings."
          code={weekStartSnippet}
        />
      }
    >
      <WeekStartExample />
    </StoryFeature>
    <StoryFeature
      id="theming"
      number="13"
      kicker="Design tokens"
      title="Fixed contracts, flexible skin."
      copy="Component-scoped tokens control geometry as well as color, radii, surfaces, shadows, endpoint pills, and motion. Acid compresses the calendar into 300px; Candy enlarges its day tracks inside 390px and carries its pink selected-day fill into the period summary."
      instruction="Switch to Acid or Candy. Click 15 and hover it for the next-click outline, then use a month chevron once to reveal the themed Start and End pills."
      howTo={
        <StoryHowTo
          title="Theme with tokens"
          language="CSS + TSX"
          copy="Set scoped custom properties on the component class; no global theme selector is required."
          code={themingSnippet}
        />
      }
    >
      <ThemeExample />
    </StoryFeature>
    <StoryFeature
      id="single-day"
      number="14"
      kicker="Single-day mode"
      title="Configure the picker for one day."
      copy="Set selectionMode to single on QunoDatePicker to keep every committed value to one calendar day. The public DateRange shape stays unchanged, with matching start and end dates."
      instruction="Click another date, then drag from 10 to 18. Only the day where the pointer is released stays selected."
      howTo={
        <StoryHowTo
          title="Single-day selection"
          language="TSX"
          copy="Set the Datepicker mode directly; it always emits identical start and end dates."
          code={singleDaySnippet}
        />
      }
    >
      <SingleDayExample />
    </StoryFeature>
    <StoryFeature
      id="date-input-composition"
      number="15"
      kicker="Date Input composition"
      title="Combines with Date Input beautifully."
      copy="Replace the Datepicker’s selected-period summary and Clear action with QunoDateInput. The picker appears only while focus remains in the composed control, and both public components share one controlled range."
      instruction="Focus the date input to reveal the picker. Type 12 juni – 18 juni or paint a range, then click elsewhere to close it."
      howTo={
        <StoryHowTo
          title="Use Date Input as the range surface"
          language="TSX + CSS"
          copy="Open the range picker on focus and hide its duplicate selection header."
          code={rangeInputSnippet}
        />
      }
    >
      <RangeInputExample />
    </StoryFeature>
  </>
);
