import { ArrowUpRight } from "lucide-react";
import { products } from "./scenarioCatalog";
import type { ProductId } from "./scenarioCatalog";
export function ConceptHeader({ product, change }: { product: ProductId; change: (id: ProductId) => void }) {
  return (
    <header className="concept-nav">
      <a className="concept-logo" href="/concept" aria-label="Quno concept home">
        quno<span>®</span>
      </a>
      <nav aria-label="Products">
        {products.map(({ id, label, tabLabel }) => (
          <button key={id} aria-pressed={id === product} onClick={() => change(id as ProductId)}>
            {tabLabel ?? label}
          </button>
        ))}
      </nav>
      <a className="concept-docs" href={`/guide/${product}`}>
        Documentation <ArrowUpRight size={16} />
      </a>
    </header>
  );
}
