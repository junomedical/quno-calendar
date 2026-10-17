# Calendar runtime flows

These guides connect the [ownership map](../domains/README.md) with concrete execution order.

- [Loading and late layout](./async-loading-and-layout.md)
- [Native scrolling, navigation and recenter](./virtual-scroll-and-recenter.md)
- [Pointer interactions and zoom](./interactions-and-zoom.md)

Visual focus means keeping a semantic location at a viewport-relative point. It does not mean browser DOM focus.
Event arrival never transfers keyboard focus from a consumer's control.

Every path converges on one engine geometry revision and one browser commit adapter. Priority is explicit restoration,
gesture, navigation, automatic layout correction, then recenter. Manual input cancels eligible ownership. The model's
bounded-window center, a logical anchor target and an external editor's captured screen point are distinct concepts;
none is an event collision-lane index.
