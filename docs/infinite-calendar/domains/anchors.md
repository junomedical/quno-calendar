# Semantic anchors

`runtime/model/projection.ts` maps logical targets to content coordinates and back.
`anchors.ts` captures the current date/resource position. `runtime/viewport/zoomAnchor.ts` captures pointer time,
current-time, center/origin or vertical day-fraction anchors. `ownership.ts` arbitrates intent; `navigation.ts`
builds navigation targets. `runtime/react/useRuntimeHandle.ts` defers public commands until parent layout commits.

The DOM registry in `infinite/anchors/parent/viewportGeometryRegistry.ts` records mounted participant instances.
It determines actual visibility and captured card coordinates; it cannot independently move the viewport.
`useRuntimeCapture.ts` resolves public event/resource/date/time requests into engine targets.

An anchor contains semantic identity, a screen point, and affected axes. Restore computes a new content point from the
latest geometry and subtracts the screen point. Date-only anchors preserve horizontal scrolling. Resource centering
uses a fraction of the current resource extent. Event anchors retain participant identity rather than a collision lane.
Required visible events never silently become resource slots.

Priority: explicit restore, gesture, navigation, automatic layout correction, idle recenter. New equal-priority intents
supersede old ones; obsolete cancellation cannot cancel a successor. Manual input cancels opted-in ownership.
Network replies cannot claim navigation. All corrections reach the single browser commit adapter.
