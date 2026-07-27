/** Delay before a settled scroll recenters the bounded date window. */
export const SCROLL_RECENTER_DELAY_MS = 1200;

/** Edge recenter uses 20% of the ordinary delay so bounded content extends sooner. */
export const SCROLL_EDGE_RECENTER_DELAY_MS = SCROLL_RECENTER_DELAY_MS * 0.2;

const SCROLL_EDGE_TOLERANCE_PX = 1;

export function scrollRecenterDelayMs({
  scrollTop,
  scrollHeight,
  clientHeight
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}) {
  const maximumScrollTop = Math.max(0, scrollHeight - clientHeight);
  const isAtTop = scrollTop <= SCROLL_EDGE_TOLERANCE_PX;
  const isAtBottom = maximumScrollTop - scrollTop <= SCROLL_EDGE_TOLERANCE_PX;
  return isAtTop || isAtBottom ? SCROLL_EDGE_RECENTER_DELAY_MS : SCROLL_RECENTER_DELAY_MS;
}

/** Maximum date sections mounted outside the visible virtual range. */
export const VIRTUAL_DAY_NODE_OVERSCAN = 5;
