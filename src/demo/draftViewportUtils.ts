export type DraftScreenSnapshot = {
  top: number;
  left: number;
};

export function findRenderedDraftBox(eventId?: string, calendarId?: string): DraftScreenSnapshot | null {
  const viewport = document.querySelector<HTMLElement>(".ic-viewport");
  const draftElement = eventId
    ? Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]')).find(
        (element) => element.dataset.eventId === eventId && (!calendarId || element.dataset.calendarId === calendarId)
      )
    : document.querySelector<HTMLElement>('[data-testid="draft-event"]');
  if (!viewport || !draftElement) {
    return null;
  }
  const viewportBox = viewport.getBoundingClientRect();
  const draftBox = draftElement.getBoundingClientRect();
  return {
    top: draftBox.top - viewportBox.top,
    left: draftBox.left - viewportBox.left
  };
}

export function findVisibleRenderedDraftBox(eventId?: string, calendarId?: string): DraftScreenSnapshot | null {
  const viewport = document.querySelector<HTMLElement>(".ic-viewport");
  const draftElements = eventId
    ? Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]')).filter(
        (element) => element.dataset.eventId === eventId && (!calendarId || element.dataset.calendarId === calendarId)
      )
    : Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]'));
  if (!viewport || draftElements.length === 0) {
    return null;
  }
  const viewportBox = viewport.getBoundingClientRect();
  for (const draftElement of draftElements) {
    const draftBox = draftElement.getBoundingClientRect();
    const isVisible =
      draftBox.width > 0 &&
      draftBox.height > 0 &&
      draftBox.right > viewportBox.left &&
      draftBox.left < viewportBox.right &&
      draftBox.bottom > viewportBox.top &&
      draftBox.top < viewportBox.bottom;
    if (!isVisible) {
      continue;
    }
    return {
      top: draftBox.top - viewportBox.top,
      left: draftBox.left - viewportBox.left
    };
  }
  return null;
}
