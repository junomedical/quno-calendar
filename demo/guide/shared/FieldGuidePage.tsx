import type { JSX, ReactNode } from "react";
import "./fieldGuide.css";
import "./guideNavigation.css";
import { GuideProduct } from "./GuideDemoLink";
import { guideProducts } from "./guideDemos";
import { products, catalog } from "#quno-demo/concept/scenarioCatalog";
import { conceptHref } from "#quno-demo/concept/useConceptNavigation";

export type FieldGuideContent = readonly [href: `#${string}`, number: string, title: string];

type FieldGuidePageProps = {
  product: string;
  title: string;
  intro: ReactNode;
  demoHref: string;
  contents: ReadonlyArray<FieldGuideContent>;
  meta: readonly [string, string, string];
  children: ReactNode;
  className?: string;
  embedded?: boolean;
  testId?: string;
};

export function FieldGuidePage({
  product,
  title,
  intro,
  demoHref,
  contents,
  meta,
  children,
  className,
  embedded = false,
  testId
}: FieldGuidePageProps): JSX.Element {
  const productId = guideProducts[product];
  const Root = embedded ? "div" : "main";
  return (
    <GuideProduct.Provider value={productId ?? null}>
      <Root
        className={`field-guide${className ? ` ${className}` : ""}`}
        data-field-guide={product}
        data-testid={testId}
      >
        <article className="field-guide__content">
          <nav className="guide-products" aria-label="Documentation products">
            {products.map(({ id, label, tabLabel }) => (
              <a key={id} href={`/docs/${id}`} aria-current={id === productId ? "page" : undefined}>
                {tabLabel ?? label}
              </a>
            ))}
            <a href={`/docs/archive/${productId ?? ""}`}>Archive</a>
          </nav>
          <header className="field-guide__hero">
            <div className="field-guide__topline">
              <p className="field-guide__eyebrow">{product} · Field guide</p>
              <div className="field-guide__links">
                <a href="/docs">All components</a>
                <a href={productId ? conceptHref({ product: productId, intro: true }) : demoHref}>
                  Demo <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <h1>{title}</h1>
            <div className="field-guide__intro">{intro}</div>
            <div className="field-guide__meta" aria-label="Guide details">
              {meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </header>
          {productId && (
            <nav className="guide-demos" aria-label="Live demos">
              <p>Explore the interactions</p>
              <div>
                {catalog[productId].map(({ id, label }) => (
                  <a key={id} href={conceptHref({ product: productId, scene: id })}>
                    {label} ↗
                  </a>
                ))}
              </div>
              <small>
                Continue below for integration details and copyable recipes, or{" "}
                <a href={demoHref}>open the focused sandbox ↗</a>.
              </small>
            </nav>
          )}
          <nav className="field-guide__toc" aria-label="Table of contents">
            <p>Contents</p>
            <ol>
              {contents.map(([href, number, label]) => (
                <li key={href}>
                  <a href={href}>
                    <span>{number}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {children}
        </article>
      </Root>
    </GuideProduct.Provider>
  );
}
