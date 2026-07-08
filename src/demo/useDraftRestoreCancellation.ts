import { useEffect, type MutableRefObject } from "react";
import type { ActiveEventDraft } from "../lib";

export function useDraftRestoreCancellation(
  activeDraft: ActiveEventDraft | null,
  restoreTokenRef: MutableRefObject<number>,
  expectedProgrammaticScrollRef: MutableRefObject<{ top: number; left: number } | null>
) {
  useEffect(() => {
    if (!activeDraft) {
      return;
    }
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    if (!viewport) {
      return;
    }
    let hasUserScrollIntent = false;
    const markUserScrollIntent = () => {
      hasUserScrollIntent = true;
    };
    const markKeyboardScrollIntent = (event: KeyboardEvent) => {
      if (
        ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(
          event.key
        )
      ) {
        markUserScrollIntent();
      }
    };
    const cancelPendingRestores = () => {
      const expected = expectedProgrammaticScrollRef.current;
      if (
        expected &&
        Math.abs(viewport.scrollTop - expected.top) <= 1 &&
        Math.abs(viewport.scrollLeft - expected.left) <= 1
      ) {
        expectedProgrammaticScrollRef.current = null;
        return;
      }
      if (!hasUserScrollIntent) {
        return;
      }
      expectedProgrammaticScrollRef.current = null;
      restoreTokenRef.current += 1;
    };
    viewport.addEventListener("scroll", cancelPendingRestores, { passive: true });
    viewport.addEventListener("pointerdown", markUserScrollIntent, { passive: true });
    window.addEventListener("wheel", markUserScrollIntent, { passive: true, capture: true });
    window.addEventListener("touchmove", markUserScrollIntent, { passive: true, capture: true });
    window.addEventListener("keydown", markKeyboardScrollIntent);
    return () => {
      viewport.removeEventListener("scroll", cancelPendingRestores);
      viewport.removeEventListener("pointerdown", markUserScrollIntent);
      window.removeEventListener("wheel", markUserScrollIntent, true);
      window.removeEventListener("touchmove", markUserScrollIntent, true);
      window.removeEventListener("keydown", markKeyboardScrollIntent);
    };
  }, [activeDraft, expectedProgrammaticScrollRef, restoreTokenRef]);
}
