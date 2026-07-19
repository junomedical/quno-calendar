/**
 * Domain: Interactions.
 * Responsibility: Provides the orientation hit-testing compatibility exports.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
/** Compatibility exports for projection-specific timeline hit testing. */
export { useHorizontalTimelineHitTesting } from "./useHorizontalTimelineHitTesting";
export { useVerticalTimelineHitTesting } from "./useVerticalTimelineHitTesting";
