import { FieldGuidePage } from "#quno-demo/guide/shared/FieldGuidePage";
import type { JSX } from "react";
import { ArchitectureStory, DifferenceStory, FootprintStory } from "./StoryDetails";
import { StoryTopics } from "./StoryTopics";
import "./story-details.css";
import "./story-topics.css";
import "./story-themes.css";
import "./type-to-edit.css";

const contents = [
  ["#difference", "01", "Understand the range model"],
  ["#paint", "02", "Paint, resize, and move"],
  ["#stable-view", "03", "Navigate stable months"],
  ["#best-guess", "04", "Build and correct by click"],
  ["#motion", "05", "Use motion with purpose"],
  ["#day-handler", "06", "Customize meaningful dates"],
  ["#localization", "07", "Localize dates and weeks"],
  ["#theming", "08", "Theme with scoped tokens"],
  ["#single-day", "09", "Choose one day"],
  ["#idea", "10", "Understand and ship the model"]
] as const;

export const DatePickerStory = ({ embedded = false }: { embedded?: boolean }): JSX.Element => {
  return (
    <FieldGuidePage
      product="Quno/Datepicker"
      title="Shape a date range as directly as you point to it."
      intro={<p>Paint, resize, move, and correct a range without restarting a forced From–To sequence.</p>}
      demoHref="/demo/datepicker"
      contents={contents}
      meta={["Interactive examples", "Copyable recipes", "React + Preact"]}
      embedded={embedded}
    >
      <DifferenceStory />

      <StoryTopics />

      <ArchitectureStory />

      <FootprintStory />

      <section className="story__integration" id="reference">
        <span>Complete reference</span>
        <h3>Keep the full API contract nearby</h3>
        <p>
          Controlled and uncontrolled state, localization, forms, every public slot, and the deferred V1 scope are
          documented in <strong>docs/shared/usage.md</strong>.
        </p>
      </section>
    </FieldGuidePage>
  );
};
