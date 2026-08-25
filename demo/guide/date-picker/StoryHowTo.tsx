import { FieldGuideRecipe } from "#quno-demo/guide/shared/FieldGuideFeature";
import type { JSX } from "react";

type Props = {
  title: string;
  copy: string;
  code: string;
  language: string;
};

export const StoryHowTo = (props: Props): JSX.Element => <FieldGuideRecipe {...props} />;
