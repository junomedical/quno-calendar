/**
 * Domain: Scroll.
 * Responsibility: Defines the pending date-local target retained across model rebuilds.
 * Preserves: the visible date and local pixel offset across bounded-window maintenance.
 * Does not own: event fetching and semantic layout-focus policy.
 * Failure/cancellation: missing geometry retains the newest valid snapshot for the next settled pass.
 *
 * @see docs/domains/scroll.md#source-map
 */
/** Date-local position retained while a bounded date window is rebuilt. */
export type PendingScrollTarget = {
  dateKey: string;
  offsetWithinDate: number;
};
