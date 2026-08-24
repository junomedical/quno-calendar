import type { JSX } from "react";

type Props = {
  title: string;
  copy: string;
  code: string;
  language: string;
};

export const StoryHowTo = ({ title, copy, code, language }: Props): JSX.Element => (
  <aside className="story__howto" aria-label={`${title} how-to`}>
    <span>How to · {language}</span>
    <h3>{title}</h3>
    <p>{copy}</p>
    <pre>
      <code>{code}</code>
    </pre>
  </aside>
);
