import { ArrowLeft, ArrowRight } from "lucide-react";
import { catalog, type ProductId } from "./scenarioCatalog";
export function DemoNavigation({
  product,
  intro,
  scene,
  choose,
  introduce
}: {
  product: ProductId;
  intro: boolean;
  scene: string;
  choose: (scene: string) => void;
  introduce: () => void;
}) {
  const scenes = catalog[product];
  const index = scenes.findIndex((item) => item.id === scene);
  return (
    <nav className="concept-tour-pagination" aria-label="Demo navigation">
      <button
        aria-label="Previous demo"
        disabled={intro}
        onClick={() => (index === 0 ? introduce() : choose(scenes[index - 1].id))}
      >
        <ArrowLeft size={18} />
        <span>Previous</span>
      </button>
      <button
        aria-label="Next demo"
        disabled={!intro && index === scenes.length - 1}
        onClick={() => choose(scenes[intro ? 0 : index + 1].id)}
      >
        <span>Next</span>
        <ArrowRight size={18} />
      </button>
    </nav>
  );
}
