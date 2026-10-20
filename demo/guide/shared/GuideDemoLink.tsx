import { useContext, createContext } from "react";
import { conceptHref } from "#quno-demo/concept/useConceptNavigation";
import { catalog, type ProductId } from "#quno-demo/concept/scenarioCatalog";
import { guideDemos } from "./guideDemos";
export const GuideProduct = createContext<ProductId | null>(null);
export function GuideDemoLink({ id, product: explicitProduct }: { id: string; product?: ProductId }) {
  const context = useContext(GuideProduct);
  const product = explicitProduct ?? context;
  const scenes = product && guideDemos[product][id];
  if (!product || !scenes) return null;
  return (
    <div>
      {scenes.map((scene) => {
        const demo = catalog[product].find(({ id }) => id === scene)!;
        return (
          <a key={scene} className="field-guide__demo-link" href={conceptHref({ product, scene })}>
            Watch demo · {demo.label} <span aria-hidden="true">↗</span>
          </a>
        );
      })}
    </div>
  );
}
