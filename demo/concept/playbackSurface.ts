/** The informational guide does not participate in synthetic calendar gestures. Native input is unchanged. */
export function onPlaybackSurface<T>(element: Element, perform: () => T): T {
  const guide = element.closest(".concept-tour-content")?.querySelector<HTMLElement>(".concept-tour-guide");
  if (!guide) return perform();
  const previous = guide.style.pointerEvents;
  guide.style.pointerEvents = "none";
  try {
    return perform();
  } finally {
    guide.style.pointerEvents = previous;
  }
}
