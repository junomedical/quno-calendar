/**
 * Domain: Interactions.
 * Responsibility: Provides orientation zoom compatibility exports.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
/** Compatibility barrel for the two orientation-specific controlled zoom hooks. */
export { useHorizontalShiftWheelZoom } from "./useHorizontalShiftWheelZoom";
export { useVerticalShiftWheelZoom } from "./useVerticalShiftWheelZoom";
