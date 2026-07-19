/**
 * Domain: Interactions.
 * Responsibility: Defines the supported controlled zoom interval.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
/** Supported controlled timeline zoom interval. */
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 8;
