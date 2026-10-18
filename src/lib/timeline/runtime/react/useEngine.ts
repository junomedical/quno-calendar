import { RenderSnapshotReader } from "#quno-internal/timeline/runtime/viewport/renderSnapshot";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarEngine, type EngineLayout } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { ViewportAdapter } from "#quno-internal/timeline/runtime/browser/ViewportAdapter";

export function useEngine({ layout }: { layout: EngineLayout }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine] = useState(() => new CalendarEngine({ layout, viewport: { top: 0, left: 0, width: 0, height: 800 } }));
  const [adapter] = useState(() => new ViewportAdapter(engine));
  const [reader] = useState(() => new RenderSnapshotReader({ engine }));
  const snapshot = useSyncExternalStore((listener) => engine.subscribe({ listener }), reader.read, reader.read);
  useLayoutEffect(() => {
    const now = performance.now();
    if (engine.expectsZoom({ zoom: layout.settings.zoom, now })) adapter.flushPending();
    else adapter.flush();
    engine.updateLayout({ layout, now });
  }, [adapter, engine, layout]);
  useLayoutEffect(() => {
    const viewport = containerRef.current;
    if (viewport) return adapter.attach({ viewport });
  }, [adapter]);
  useLayoutEffect(() => {
    if (reader.read() === snapshot) adapter.commit({ snapshot: engine.read() });
  }, [adapter, engine, reader, snapshot]);
  return { engine, adapter, snapshot, containerRef };
}
