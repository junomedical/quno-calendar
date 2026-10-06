import { FieldGuidePage } from "#quno-demo/guide/shared/FieldGuidePage";
import { FieldGuideFeature, FieldGuideRecipe } from "#quno-demo/guide/shared/FieldGuideFeature";
import { FieldGuideProduction } from "#quno-demo/guide/shared/FieldGuideProduction";
import { timepickerProduction } from "#quno-demo/guide/shared/productionProfiles";
import { TimePickerExample, UncontrolledTimeExample, timePickerRecipe } from "./TimePickerExample";

export function TimePickerFieldGuide() {
  return (
    <FieldGuidePage
      product="Quno/Timepicker"
      title="Choose a time, at your own pace."
      intro={<p>Keep hours in view while choosing a minute. Use the clock on its own or beside a date control.</p>}
      demoHref="/demo/timepicker"
      contents={[
        ["#time-selection", "01", "Choose a clock"],
        ["#ownership", "02", "Own the value and presentation"],
        ["#production", "03", "Ship only the control"]
      ]}
      meta={["Interactive examples", "Copyable recipes", "React + Preact"]}
    >
      <FieldGuideFeature
        id="time-selection"
        number="01"
        kicker="Standalone clock"
        title="Hours stay put. Minutes stay readable."
        copy={
          <p>
            Each enabled hour has a larger, bold sticky heading beside a cadence-sized row: five choices for 1–4 or 6
            minutes, four for 15, six for 5 or 10, three for 20, and two for 30. Choose cadence from 1, 2, 3, 4, 5, 6,
            10, 15, 20, or 30 minutes. An omitted or empty hour list enables all 24 hours. Tab between buttons and press
            Enter or Space to select.
          </p>
        }
        instruction="Pick 10:45, switch to one-minute cadence, and scroll to another hour. Change enabled hours or disable the control. Clear the selection to start again."
        implementation={
          <FieldGuideRecipe
            title="Select a standalone time"
            language="TSX"
            copy="Control a separate HH:mm string and import the optional stylesheet."
            code={timePickerRecipe}
          />
        }
      >
        <TimePickerExample />
      </FieldGuideFeature>
      <FieldGuideFeature
        id="ownership"
        number="02"
        kicker="Value and presentation"
        title="A clock that belongs to your form."
        copy={
          <p>
            Use value and onChange for controlled state, or defaultValue for local state. Selection emits one HH:mm
            clock; Clear emits null. Settings changes preserve the existing clock even if it has no offered slot.
            Labels, formatter, class names, and scoped color tokens belong to the consumer.
          </p>
        }
        instruction="Choose a minute in the uncontrolled example, which formats its clock with Uhr, and use Reset time. In the first example, set 23:59 externally, then enable all hours and one-minute cadence to reveal its slot."
        implementation={
          <FieldGuideRecipe
            title="Use local time state"
            language="TSX"
            copy="The component stores its own clock and reports each change."
            code={
              '<QunoTimePicker defaultValue="13:15" minuteCadence={15}\n  enabledHours={[12, 13, 14]} labels={{ clear: "Reset time" }}\n  formatters={{ time: ({ time }) => `${time} Uhr` }}\n  onChange={({ value }) => console.log(value)} />'
            }
          />
        }
      >
        <UncontrolledTimeExample />
      </FieldGuideFeature>
      <FieldGuideFeature
        id="production"
        number="03"
        kicker="Independent package entry"
        title="Bring only the clock."
        copy={
          <p>
            The Timepicker entry imports no calendar, date input, parser, or virtualizer. Its optional stylesheet uses
            --quno-time-picker-* tokens. Datepicker’s optional time mode uses the same slot renderer while retaining its
            own date and navigation behavior.
          </p>
        }
        instruction="Copy the first recipe or open the focused demo from the guide header."
      >
        <FieldGuideProduction profile={timepickerProduction} />
      </FieldGuideFeature>
    </FieldGuidePage>
  );
}
