import { ArrowUpRight } from "lucide-react";
import { products, type ProductId } from "#quno-demo/concept/scenarioCatalog";
import { conceptHref } from "#quno-demo/concept/useConceptNavigation";
import "./siteHeader.css";

type SiteHeaderProps = {
  product?: ProductId;
  change?: (id: ProductId) => void;
};

export function SiteHeader({ product, change }: SiteHeaderProps) {
  const documentation = !change;
  return (
    <header className="site-header concept-nav">
      <nav aria-label={documentation ? "Documentation products" : "Products"}>
        {products.map(({ id, label, tabLabel }) =>
          change ? (
            <button key={id} aria-pressed={id === product} onClick={() => change(id)}>
              {tabLabel ?? label}
            </button>
          ) : (
            <a key={id} href={`/docs/${id}`} aria-current={id === product ? "page" : undefined}>
              {tabLabel ?? label}
            </a>
          )
        )}
      </nav>
      <a
        className="concept-docs"
        href={documentation ? (product ? conceptHref({ product, intro: true }) : "/") : `/docs/${product}`}
      >
        {documentation ? "Demo" : "Documentation"} <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </header>
  );
}
