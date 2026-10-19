import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ProductId } from "./scenarioCatalog";
const Picker = lazy(() => import("./PickerScenes").then((module) => ({ default: module.PickerScenes })));
const Input = lazy(() => import("./InputScenes").then((module) => ({ default: module.InputScenes })));
const Time = lazy(() => import("./TimeScenes").then((module) => ({ default: module.TimeScenes })));
const Parser = lazy(() => import("./ParserScenes").then((module) => ({ default: module.ParserScenes })));
export function ConceptProducts({ product, scenario }: { product: ProductId; scenario: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const element = root.current;
    const repeat = () => setRevision((value) => value + 1);
    element?.addEventListener("concept-loop", repeat);
    return () => element?.removeEventListener("concept-loop", repeat);
  }, []);
  return (
    <div className="concept-product-stage" ref={root}>
      <div className="concept-product-mount" key={revision}>
        <Suspense fallback={<p>Opening playground…</p>}>
          {product === "datepicker" && <Picker scenario={scenario} />}
          {product === "date-input" && <Input scenario={scenario} />}
          {product === "timepicker" && <Time scenario={scenario} />}
          {product === "date-parser" && <Parser scenario={scenario} />}
        </Suspense>
      </div>
    </div>
  );
}
