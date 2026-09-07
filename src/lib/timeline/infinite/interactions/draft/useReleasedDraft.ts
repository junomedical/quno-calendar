import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActiveDraftReleaseOptions,
  ActiveEventDraft,
  EventRenderStatus
} from "#quno-internal/timeline/core/types";

const DEFAULT_RELEASE_DURATION_MS = 220;

export type ReleasedDraft = {
  draft: ActiveEventDraft;
  status: EventRenderStatus;
  durationMs: number;
};

/** Retains a controlled draft just long enough to render its release animation. */
export function useReleasedDraft({ activeDraft }: { activeDraft?: ActiveEventDraft | null } = {}) {
  const [releasedDraft, setReleasedDraft] = useState<ReleasedDraft | null>(null);
  const activeDraftRef = useRef<ActiveEventDraft | null>(activeDraft ?? null);
  const timerRef = useRef<number | null>(null);
  activeDraftRef.current = activeDraft ?? null;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseActiveDraft = useCallback(
    (options: ActiveDraftReleaseOptions = {}) => {
      const draft = activeDraftRef.current;
      clearTimer();
      if (!draft || options.animation === "none") {
        setReleasedDraft(null);
        return;
      }

      const durationMs = options.durationMs ?? DEFAULT_RELEASE_DURATION_MS;
      setReleasedDraft({
        draft,
        status: draft.mode === "edit" ? "existing" : "new",
        durationMs
      });
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setReleasedDraft(null);
      }, durationMs);
    },
    [clearTimer]
  );

  useEffect(() => {
    if (activeDraft) {
      clearTimer();
      setReleasedDraft(null);
    }
  }, [activeDraft, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { releasedDraft, releaseActiveDraft };
}
