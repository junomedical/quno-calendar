import { DateInputGuideBasics } from "./DateInputGuideBasics";
import { DateInputGuideIntegration } from "./DateInputGuideIntegration";
import "../date-picker/story.css";
import "../date-picker/story-howto.css";
import "../date-picker/story-topics.css";
import "../date-picker/type-to-edit.css";
import "./dateInputGuide.css";

const contents = [
  ["#selection-mode", "01", "Single date or range"],
  ["#date-formats", "02", "Date formats"],
  ["#preferred-date-order", "03", "Preferred date order"],
  ["#relative-dates", "04", "Relative dates"],
  ["#keyboard-controls", "05", "Keyboard controls"],
  ["#range-input", "06", "Range input"],
  ["#expected-period", "07", "Expected period"],
  ["#localization", "08", "Localization"],
  ["#multiple-languages", "09", "Multiple languages"],
  ["#picker-composition", "10", "Date range picker"],
  ["#library-size", "11", "Library size"],
  ["#dependencies", "12", "Dependencies"]
] as const;

export function DateInputFieldGuide() {
  return (
    <main className="story date-input-guide">
      <header className="story__hero">
        <div className="story__hero-topline">
          <span className="story__kicker">Quno Date Input · Field guide</span>
          <div className="story__hero-links">
            <a className="story__demo-link" href="/">
              All components
            </a>
            <a className="story__demo-link" href="/demo/date-input-field">
              Demo <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <h1>Dates, written the way people think.</h1>
        <p>Start with the value contract, then move from recognition and keyboard editing to production integration.</p>
        <nav className="story__toc" aria-labelledby="date-input-toc-title">
          <div>
            <span>On this page</span>
            <h2 id="date-input-toc-title">Explore the field guide</h2>
            <p>Twelve focused contracts, each with a live public-entry-point example and a copyable recipe.</p>
          </div>
          <div className="story__toc-links">
            {contents.map(([href, number, title]) => (
              <a href={href} key={href}>
                <small>{number}</small>
                <strong>{title}</strong>
              </a>
            ))}
          </div>
        </nav>
      </header>
      <DateInputGuideBasics />
      <DateInputGuideIntegration />
    </main>
  );
}
