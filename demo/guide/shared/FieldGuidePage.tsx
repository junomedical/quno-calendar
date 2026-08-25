import type { JSX, ReactNode } from "react";
import "./fieldGuide.css";

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
  const Root = embedded ? "div" : "main";
  return (
    <Root className={`field-guide${className ? ` ${className}` : ""}`} data-field-guide={product} data-testid={testId}>
      <article className="field-guide__content">
        <header className="field-guide__hero">
          <div className="field-guide__topline">
            <p className="field-guide__eyebrow">{product} · Field guide</p>
            <div className="field-guide__links">
              <a href="/">All components</a>
              <a href={demoHref}>
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
  );
}
