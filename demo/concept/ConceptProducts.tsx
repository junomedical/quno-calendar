import { lazy, Suspense } from "react";
import type { ProductId } from "./scenarioCatalog";
const Picker = lazy(() => import("./PickerScenes").then((module) => ({ default: module.PickerScenes })));
const Input = lazy(() => import("./InputScenes").then((module) => ({ default: module.InputScenes })));
const Time = lazy(() => import("./TimeScenes").then((module) => ({ default: module.TimeScenes })));
const Parser = lazy(() => import("./ParserScenes").then((module) => ({ default: module.ParserScenes })));
export function ConceptProducts({ product, scenario }: { product: ProductId; scenario: string }) {
  return (
    <div className="concept-product-stage">
      <Suspense fallback={<p>Opening playground…</p>}>
        {product === "datepicker" && <Picker scenario={scenario} />}
        {product === "date-input" && <Input scenario={scenario} />}
        {product === "timepicker" && <Time scenario={scenario} />}
        {product === "date-parser" && <Parser scenario={scenario} />}
      </Suspense>
    </div>
  );
}
