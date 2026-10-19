import { ArrowUpRight, Maximize2 } from "lucide-react";
import type { RefObject } from "react";
import type { Product, Scenario } from "./scenarioTypes";
import { PlaybackControls, type PlaybackActions } from "./PlaybackControls";
export function ConceptIntro({
  product,
  scenario,
  actions,
  open,
  button,
  locked,
  feedback
}: {
  product: Product;
  scenario: Scenario;
  actions: PlaybackActions;
  open: () => void;
  button?: RefObject<HTMLButtonElement>;
  locked: boolean;
  feedback: string;
}) {
  return (
    <div className="concept-intro">
      <span className="concept-eyebrow">QUNO / {product.label.toUpperCase()}</span>
      <h1>{scenario.label}</h1>
      <div className="concept-explanation">
        {scenario.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      <div className="concept-intro-actions">
        <button ref={button} className="concept-open" onClick={open}>
          <Maximize2 size={16} />
          Full screen demo
        </button>
        <a href={`/guide/${product.id}#${scenario.anchor}`}>
          Read the recipe <ArrowUpRight size={16} />
        </a>
      </div>
      {locked ? (
        <small className="concept-mobile-note">Open fullscreen to try the demo.</small>
      ) : (
        <PlaybackControls {...actions} />
      )}
      <div className="concept-statusbar" aria-live="polite">
        {feedback || (actions.playing ? `Showing · ${scenario.label}` : scenario.hint)}
      </div>
    </div>
  );
}
