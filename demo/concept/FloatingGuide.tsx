import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useLayoutEffect, type ReactNode, type RefObject } from "react";
import type { PlaybackActions } from "./usePlayback";
import { DemoContents } from "./DemoContents";
import type { ProductId, Scenario } from "./scenarioTypes";
import { useFloatingGuide } from "./useFloatingGuide";
import { contentsLabel, type Introduction } from "./tourContent";
import { ConceptParagraphs } from "./ConceptParagraphs";
export function FloatingGuide({
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
  setContents,
  select,
  children
}: {
  product: ProductId;
  introduction: Introduction;
  scenario: Scenario;
  intro: boolean;
  introduce: () => void;
  actions: PlaybackActions;
  container: RefObject<HTMLDivElement>;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  contents: boolean;
  setContents: (value: boolean) => void;
  select: (scene: string) => void;
  children: ReactNode;
}) {
  const title = contents ? `${introduction.title} demos` : intro ? introduction.title : scenario.label;
  const floating = useFloatingGuide(container, actions.stop);
  useLayoutEffect(() => {
    if (contents) floating.card.current?.focus({ preventScroll: true });
  }, [contents, floating.card]);
  return (
    <aside
      ref={floating.card}
      className="concept-tour-guide"
      data-collapsed={collapsed}
      tabIndex={0}
      style={{ left: floating.position.left, bottom: floating.position.bottom }}
      aria-label={`${title} guide`}
      data-page={contents ? "contents" : intro ? "intro" : "scene"}
      {...floating.handle}
      onKeyDown={(event) => {
        if (event.key === "Escape" && contents) {
          event.preventDefault();
          event.stopPropagation();
          setContents(false);
        } else floating.handle.onKeyDown(event);
      }}
    >
      <div className="concept-tour-guide-top">
        {!contents && !collapsed && (
          <button
            className="concept-tour-back"
            aria-label={contentsLabel(product)}
            onClick={() => {
              actions.stop();
              setContents(true);
              setCollapsed(false);
            }}
          >
            <ArrowLeft size={16} />
            <span>{contentsLabel(product)}</span>
          </button>
        )}
        <h1>{title}</h1>
        <button
          className="concept-tour-toggle"
          aria-label={collapsed ? "Expand description" : "Collapse description"}
          title={collapsed ? "Expand description" : "Collapse description"}
          aria-expanded={!collapsed}
          aria-controls="concept-tour-body"
          onClick={() => {
            actions.stop();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>
      <div id="concept-tour-body" className="concept-tour-body" hidden={collapsed}>
        {contents ? (
          <DemoContents
            product={product}
            introduction={introduction}
            scene={scenario.id}
            select={select}
            intro={intro}
            introduce={introduce}
          />
        ) : intro ? (
          <ConceptParagraphs paragraphs={introduction.paragraphs} />
        ) : (
          <>
            <ConceptParagraphs paragraphs={scenario.paragraphs} />
            <a href={`/guide/${product}#${scenario.anchor}`}>
              Read the recipe <ArrowUpRight size={14} />
            </a>
          </>
        )}
      </div>
      {!collapsed && children}
    </aside>
  );
}
