import type { JSX, ReactNode } from "react";
import { useMemo, useState } from "react";

type FieldGuideFeatureProps = {
  id: string;
  number: string;
  kicker: string;
  title: string;
  copy: ReactNode;
  instruction: ReactNode;
  implementation?: ReactNode;
  subsection?: boolean;
  children: ReactNode;
};

export function FieldGuideFeature({
  id,
  number,
  kicker,
  title,
  copy,
  instruction,
  implementation,
  subsection,
  children
}: FieldGuideFeatureProps): JSX.Element {
  const Heading = subsection ? "h3" : "h2";
  return (
    <section
      className={subsection ? "field-guide__subsection" : "field-guide__section"}
      id={id}
      data-field-guide-section={id}
      data-story-topic={id}
    >
      <p className="field-guide__section-number">{subsection ? kicker : `${number} · ${kicker}`}</p>
      <Heading>{title}</Heading>
      <div className="field-guide__copy">{copy}</div>
      <aside className="field-guide__try">
        <strong>Try it</strong>
        {instruction}
      </aside>
      <div className="field-guide__example">{children}</div>
      {implementation}
    </section>
  );
}

type FieldGuideRecipeProps = { title: string; copy: string; code: string; language: string };

export function FieldGuideRecipe({ title, copy, code, language }: FieldGuideRecipeProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const label = useMemo(() => (copied ? "Copied" : "Copy"), [copied]);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <details aria-label={`${title} implementation`} className="field-guide__recipe">
      <summary>Implementation · {title}</summary>
      <div>
        <p>{copy}</p>
        <button aria-label={`Copy ${title}`} onClick={() => void copyCode()} type="button">
          {label}
        </button>
        <pre>
          <code aria-label={`${title} ${language} source`}>{code}</code>
        </pre>
      </div>
    </details>
  );
}
