import { useCallback, useEffect, useRef, useState } from "react";
import { catalog, products, scenarioDocument, type ProductId } from "./scenarioCatalog";
import type { Session } from "./usePlayback";

export type ConceptLocation = { product: ProductId; scene: string; intro: boolean };
export function readConceptLocation(): ConceptLocation {
  const query = new URLSearchParams(window.location.search);
  const product = products.find(({ id }) => id === query.get("product"))?.id ?? scenarioDocument.startProduct;
  const demo = query.get("demo");
  const scene = catalog[product].find(({ id }) => id === demo)?.id;
  return { product, scene: scene ?? catalog[product][0].id, intro: !scene };
}
export function conceptHref({
  product,
  scene,
  intro = false
}: {
  product: ProductId;
  scene?: string;
  intro?: boolean;
}) {
  return `/?product=${product}&demo=${intro || !scene ? "intro" : scene}`;
}
function playbackMode(): Session["mode"] {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "idle" : "scene";
}
export function useConceptNavigation() {
  const [initial] = useState(readConceptLocation);
  const [intro, setIntro] = useState(initial.intro);
  const [session, setSession] = useState<Session>(() => ({ ...initial, revision: 0, mode: playbackMode() }));
  const remembered = useRef(new Map<ProductId, ConceptLocation>([[initial.product, initial]]));
  const apply = useCallback((location: ConceptLocation) => {
    remembered.current.set(location.product, location);
    setIntro(location.intro);
    setSession((current) => ({ ...location, revision: current.revision + 1, mode: playbackMode() }));
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const canonical = new URL(conceptHref(initial), url);
    url.searchParams.set("product", canonical.searchParams.get("product")!);
    url.searchParams.set("demo", canonical.searchParams.get("demo")!);
    window.history.replaceState(window.history.state, "", url);
    const restore = () => apply(readConceptLocation());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initial, apply]);
  const navigate = (location: ConceptLocation) => {
    const url = new URL(window.location.href);
    url.searchParams.set("product", location.product);
    url.searchParams.set("demo", location.intro ? "intro" : location.scene);
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
    apply(location);
  };
  return {
    session,
    setSession,
    intro,
    select: (scene: string, introduction = false) => navigate({ product: session.product, scene, intro: introduction }),
    change: (product: ProductId) => {
      if (product === session.product) return;
      navigate(remembered.current.get(product) ?? { product, scene: catalog[product][0].id, intro: true });
    }
  };
}
