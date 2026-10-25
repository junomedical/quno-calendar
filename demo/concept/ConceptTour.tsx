import { Maximize2, Minimize2 } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { FloatingGuide } from "./FloatingGuide";
import { DemoNavigation } from "./DemoNavigation";
import type { PlaybackActions } from "./usePlayback";
import { tourIntroduction } from "./tourContent";
import { catalog, type ProductId } from "./scenarioCatalog";
import type { Scenario } from "./scenarioTypes";
import "./calendarNavigation.css";
export function ConceptTour({
  product,
  scenario,
  actions,
  select,
  intro,
  fullscreen,
  mobile,
  open,
  close,
  openButton,
  closeButton,
  feedback,
  children
}: {
  product: ProductId;
  scenario: Scenario;
  actions: PlaybackActions;
  select: (scene: string, intro?: boolean) => void;
  intro: boolean;
  fullscreen: boolean;
  mobile: boolean;
  open: () => void;
  close: () => void;
  openButton: RefObject<HTMLButtonElement>;
  closeButton: RefObject<HTMLButtonElement>;
  feedback: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [contents, setContents] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const scenes = catalog[product];
  const introduction = tourIntroduction(product);
  const choose = (scene: string) => {
    actions.stop();
    setCollapsed(false);
    setContents(false);
    select(scene);
  };
  const introduce = () => {
    actions.stop();
    setCollapsed(false);
    setContents(false);
    select(scenes[0].id, true);
  };
  return (
    <>
      <div
        ref={container}
        className="concept-content concept-tour-content"
        data-calendar={product === "infinite-calendar" || undefined}
        data-product={product}
        data-introduction={intro}
      >
        {children}
        <FloatingGuide
          {...{
            product,
            introduction,
            scenario,
            intro,
            introduce,
            actions,
            container,
            collapsed,
            setCollapsed,
            contents,
            setContents
          }}
          mobile={mobile}
          fullscreenControl={
            <button
              ref={fullscreen ? closeButton : openButton}
              className="concept-tour-fullscreen"
              onClick={fullscreen ? close : open}
              aria-label={fullscreen ? "Exit full screen" : `Full screen ${introduction.title.toLowerCase()}`}
              title={fullscreen ? "Exit full screen" : `Full screen ${introduction.title.toLowerCase()}`}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          }
          select={choose}
        >
          <DemoNavigation
            product={product}
            scene={scenario.id}
            {...{ intro, choose, introduce, contents }}
            showContents={() => {
              actions.stop();
              setContents(true);
              setCollapsed(false);
            }}
          />
        </FloatingGuide>
        <span className="concept-tour-status" role="status">
          {feedback}
        </span>
      </div>
    </>
  );
}
