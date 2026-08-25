import { FieldGuideFeature } from "#quno-demo/guide/shared/FieldGuideFeature";
import type { JSX, ReactNode } from "react";

type StoryFeatureProps = {
  id: string;
  number: string;
  kicker: string;
  title: string;
  copy: ReactNode;
  instruction: ReactNode;
  howTo?: ReactNode;
  subsection?: boolean;
  children: ReactNode;
};

export const StoryFeature = ({
  id,
  number,
  kicker,
  title,
  copy,
  instruction,
  howTo,
  subsection,
  children
}: StoryFeatureProps): JSX.Element => (
  <FieldGuideFeature
    id={id}
    number={number}
    kicker={kicker}
    title={title}
    copy={copy}
    instruction={instruction}
    implementation={howTo}
    subsection={subsection}
  >
    {children}
  </FieldGuideFeature>
);
