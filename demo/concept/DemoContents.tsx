import { contentsLabel, type Introduction } from "./tourContent";
import { catalog, type ProductId } from "./scenarioCatalog";
export function DemoContents({
  product,
  introduction,
  scene,
  select,
  intro,
  introduce
}: {
  product: ProductId;
  introduction: Introduction;
  scene: string;
  select: (scene: string) => void;
  intro: boolean;
  introduce: () => void;
}) {
  return (
    <nav className="concept-tour-contents" aria-label={contentsLabel(product)}>
      <button aria-current={intro ? "step" : undefined} onClick={introduce}>
        <span>01</span>
        {introduction.title}
      </button>
      {catalog[product].map((item, index) => (
        <button
          key={item.id}
          aria-current={!intro && scene === item.id ? "step" : undefined}
          onClick={() => select(item.id)}
        >
          <span>{String(index + 2).padStart(2, "0")}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
