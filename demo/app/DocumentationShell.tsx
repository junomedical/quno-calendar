import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { products } from "#quno-demo/concept/scenarioCatalog";
import "./documentationShell.css";
import "#quno-demo/guide/shared/fieldGuideLayout.css";
import "#quno-demo/guide/shared/fieldGuideAppearance.css";

export function DocumentationShell({ product, children }: { product?: string; children: ReactNode }) {
  const active = products.find(({ id }) => id === product)?.id;
  return (
    <div className="documentation-shell">
      <SiteHeader product={active} />
      <div className="documentation-shell__page">{children}</div>
    </div>
  );
}
