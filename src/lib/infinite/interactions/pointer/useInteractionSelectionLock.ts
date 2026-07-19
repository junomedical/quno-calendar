/**
 * Domain: Interactions.
 * Responsibility: Temporarily disables text selection while drawing or dragging.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import { useEffect } from "react";

/** Prevents browser text selection while a calendar pointer gesture is active. */
export function useInteractionSelectionLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const bodyUserSelect = document.body.style.userSelect;
    const bodyWebkitUserSelect = document.body.style.webkitUserSelect;
    const documentUserSelect = document.documentElement.style.userSelect;
    const documentWebkitUserSelect = document.documentElement.style.webkitUserSelect;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.documentElement.style.userSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";
    document.getSelection()?.removeAllRanges();

    return () => {
      document.body.style.userSelect = bodyUserSelect;
      document.body.style.webkitUserSelect = bodyWebkitUserSelect;
      document.documentElement.style.userSelect = documentUserSelect;
      document.documentElement.style.webkitUserSelect = documentWebkitUserSelect;
      document.getSelection()?.removeAllRanges();
    };
  }, [active]);
}
