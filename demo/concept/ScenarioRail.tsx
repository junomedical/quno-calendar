import { useEffect, useRef } from "react";
import { catalog, type ProductId } from "./scenarioCatalog";
export function ScenarioRail({
  product,
  scene,
  select
}: {
  product: ProductId;
  scene: string;
  select: (scene: string) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rail.current;
    const active = element?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!element || !active) return;
    const box = active.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    if (box.left < bounds.left || box.right > bounds.right)
      element.scrollTo({
        left: active.offsetLeft - element.clientWidth / 2 + active.clientWidth / 2,
        behavior: "smooth"
      });
  }, [product, scene]);
  return (
    <nav className="concept-scenarios" aria-label="Demo scenarios">
      <span className="concept-eyebrow">EXPLORE THE DEMOS</span>
      <div className="concept-scenario-grid" ref={rail}>
        {catalog[product].map((item, index) => (
          <div className="concept-scenario" data-active={scene === item.id} key={item.id}>
            <button
              aria-current={scene === item.id ? "step" : undefined}
              aria-pressed={scene === item.id}
              onClick={() => select(item.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
}
