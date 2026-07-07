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
    const cancelPendingRestores = () => {
      const expected = expectedProgrammaticScrollRef.current;
      if (expected && Math.abs(viewport.scrollTop - expected.top) <= 1 && Math.abs(viewport.scrollLeft - expected.left) <= 1) {
        expectedProgrammaticScrollRef.current = null;
        return;
      }
      expectedProgrammaticScrollRef.current = null;
      restoreTokenRef.current += 1;
    };
    viewport.addEventListener("scroll", cancelPendingRestores, { passive: true });
    return () => viewport.removeEventListener("scroll", cancelPendingRestores);
  }, [activeDraft, expectedProgrammaticScrollRef, restoreTokenRef]);
}
