import type { JSX } from "react";
import { ArchitectureStory, DifferenceStory, FootprintStory } from "./StoryDetails";
import { StoryTopics } from "./StoryTopics";
import "./story.css";
import "./story-details.css";
import "./story-howto.css";
import "./story-topics.css";
import "./story-themes.css";
import "./type-to-edit.css";

const contents = [
  ["#difference", "Overview", "Range editing explained"],
  ["#paint", "01", "Paint and resize"],
  ["#stable-view", "02", "Stable six-week view"],
  ["#quick-jump", "03", "Jump across years"],
  ["#hidden-row", "04", "Hidden-week drag"],
  ["#segment-drag", "05", "Move a period"],
  ["#best-guess", "06", "Build a range by click"],
  ["#wrong-guess", "07", "Correct a click guess"],
  ["#shortcuts", "08", "Off-screen endpoints"],
  ["#motion", "09", "Motion and reduced motion"],
  ["#day-handler", "10", "Custom day styling"],
  ["#localization", "11", "Internationalization"],
  ["#week-starts", "12", "Different week starts"],
  ["#theming", "13", "Theme and size tokens"],
  ["#natural-input", "14", "Natural date input"],
  ["#single-day", "15", "Single-day mode"],
  ["#idea", "Model", "Interaction architecture"],
  ["#footprint", "Build", "Production footprint"],
  ["#reference", "Docs", "Complete API reference"]
] as const;

export const DatePickerStory = ({ embedded = false }: { embedded?: boolean }): JSX.Element => {
  const Root = embedded ? "div" : "main";
  return (
    <Root className="story">
      <header className="story__hero">
        <div className="story__hero-topline">
          <span className="story__kicker">Quno Date Picker · Field guide</span>
          <a className="story__demo-link" href={embedded ? "#timeline-guide" : "/guide"}>
            Explore the complete guide <span aria-hidden="true">→</span>
          </a>
        </div>
        <h1>One range model. Every calendar interaction.</h1>
        <p>Try each interaction, understand why it exists, and copy the relevant integration recipe beside it.</p>
        <nav className="story__toc" aria-labelledby="story-toc-title">
          <div>
            <span>On this page</span>
            <h2 id="story-toc-title">Explore the field guide</h2>
            <p>Read in order or jump directly to a behavior or implementation contract.</p>
          </div>
          <div className="story__toc-links">
            {contents.map(([href, label, title]) => (
              <a href={href} key={href}>
                <small>{label}</small>
                <strong>{title}</strong>
              </a>
            ))}
          </div>
        </nav>
      </header>

      <DifferenceStory />

      <StoryTopics />

      <ArchitectureStory />

      <FootprintStory />

      <section className="story__integration" id="reference">
        <span>Complete reference</span>
        <h2>Keep the full API contract nearby</h2>
        <p>
          Controlled and uncontrolled state, localization, forms, every public slot, and the deferred V1 scope are
          documented in <strong>docs/usage.md</strong>.
        </p>
      </section>
    </Root>
  );
};
