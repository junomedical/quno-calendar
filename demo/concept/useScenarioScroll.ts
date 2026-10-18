import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { catalog, type ProductId } from "./scenarioCatalog";
import type { Session } from "./usePlayback";

export function useScenarioScroll(
  product: ProductId,
  scene: string,
  fullscreen: boolean,
  activate: (scene: string, mode: Session["mode"]) => void
) {
  const pages = useRef<HTMLDivElement>(null);
  const pending = useRef<{ scene: string; mode: Session["mode"] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const settle = useCallback(() => {
    const element = pages.current;
    if (!element || fullscreen) return;
    const index = Math.min(
      catalog[product].length - 1,
      Math.max(0, Math.round(element.scrollTop / element.clientHeight))
    );
    const next = catalog[product][index].id;
    const request = pending.current;
    pending.current = null;
    if (next !== scene || request) activate(next, request?.scene === next ? request.mode : "idle");
  }, [product, scene, fullscreen, activate]);
  const onScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 160);
  };
  const navigate = useCallback(
    (next: string, mode: Session["mode"]) => {
      const element = pages.current;
      if (!element) return;
      const top = catalog[product].findIndex((item) => item.id === next) * element.clientHeight;
      if (fullscreen || Math.abs(element.scrollTop - top) < 1) {
        activate(next, mode);
        return;
      }
      pending.current = { scene: next, mode };
      element.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
      });
    },
    [product, fullscreen, activate]
  );
  useLayoutEffect(() => {
    const element = pages.current;
    if (!element) return;
    pending.current = null;
    const index = catalog[product].findIndex((item) => item.id === scene);
    element.scrollTo({ top: fullscreen ? 0 : index * element.clientHeight, behavior: "instant" });
    // Product/fullscreen changes restore the current section without replaying it.
  }, [product, scene, fullscreen]);
  useEffect(() => {
    const element = pages.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (!pending.current)
        element.scrollTop = fullscreen
          ? 0
          : catalog[product].findIndex((item) => item.id === scene) * element.clientHeight;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer.current);
    };
  }, [product, scene, fullscreen]);
  return {
    pages,
    onScroll,
    navigate,
    interrupt: () => {
      pending.current = null;
    }
  };
}
