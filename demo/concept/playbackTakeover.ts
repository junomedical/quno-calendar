/** Moving the mobile explainer changes presentation without taking over the working demo. */
export function isMobileDrawerPresentation(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const drawer = target.closest('.concept-tour-guide[data-drawer="true"]');
  if (!drawer) return false;
  const toggle = target.closest(".concept-tour-toggle");
  if (event.type === "focusin") return Boolean(toggle) || target === drawer;
  if (event.type === "keydown") return Boolean(toggle) && ["Enter", " "].includes((event as KeyboardEvent).key);
  return (
    event.type === "pointerdown" &&
    Boolean(target.closest(".concept-tour-guide-top")) &&
    !target.closest("button:not(.concept-tour-toggle), a, input, select, textarea")
  );
}
