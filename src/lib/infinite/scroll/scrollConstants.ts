/**
 * Domain: Scroll.
 * Responsibility: Defines scroll settlement delay and date-node overscan policy.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
/** Delay before a settled scroll recenters the bounded date window. */
export const SCROLL_RECENTER_DELAY_MS = 1200;

/** Maximum date sections mounted outside the visible virtual range. */
export const VIRTUAL_DAY_NODE_OVERSCAN = 5;
