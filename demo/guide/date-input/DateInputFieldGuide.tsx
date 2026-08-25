import { DateInputGuideBasics } from "./DateInputGuideBasics";
import { DateInputGuideIntegration } from "./DateInputGuideIntegration";
import { FieldGuidePage } from "#quno-demo/guide/shared/FieldGuidePage";
import "#quno-demo/guide/date-picker/story-topics.css";
import "#quno-demo/guide/date-picker/type-to-edit.css";
import "./dateInputGuide.css";

const contents = [
  ["#selection-mode", "01", "Choose one date or a range"],
  ["#controlled-state", "02", "Control recognition and state"],
  ["#keyboard-controls", "03", "Edit with the keyboard"],
  ["#localization", "04", "Localize the field"],
  ["#parser-configuration", "05", "Use Date Parser semantics"],
  ["#picker-composition", "06", "Compose with Datepicker"],
  ["#accessibility", "07", "Preserve native field contracts"],
  ["#library-size", "08", "Ship the field independently"]
] as const;

export function DateInputFieldGuide() {
  return (
    <FieldGuidePage
      className="date-input-guide"
      product="Quno/Date Input"
      title="A date field that stays useful while people type."
      intro={<p>Keep one native field while people type, spin, localize, and commit timezone-free dates and ranges.</p>}
      demoHref="/demo/date-input"
      contents={contents}
      meta={["Interactive examples", "Copyable recipes", "React + Preact"]}
    >
      <DateInputGuideBasics />
      <DateInputGuideIntegration />
    </FieldGuidePage>
  );
}
