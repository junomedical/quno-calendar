import { useEffect, useRef } from "react";
import type { CalendarView } from "@quno/calendar/infinite-calendar";

type Request = { zoom: number; at: number; inputAt: number; commitAt: number | null };
type Probe = { requests: Request[]; commits: number; maximumOutstanding: number };
declare global {
  interface Window {
    zoomProbe: Probe;
  }
}

/** Test-only DOM commit observation, not a paint or GPU-completion signal. */
export function useZoomProbe({ view, setZoom }: { view: CalendarView; setZoom: (zoom: number) => void }) {
  const probe = useRef<Probe>({ requests: [], commits: 0, maximumOutstanding: 0 });
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const inputAt = useRef<number | null>(null);
  useEffect(() => {
    window.zoomProbe = probe.current;
    const viewport = document.querySelector<HTMLElement>(".quno-calendar-viewport")!;
    const input = () => {
      inputAt.current ??= performance.now();
    };
    viewport.addEventListener("wheel", input, true);
    let previous = Number(new URLSearchParams(location.search).get("zoomStart") ?? 1.5);
    const observer = new MutationObserver(() => {
      const track = viewport.querySelector<HTMLElement>(
        view === "infinite-horizontal" ? ".quno-calendar-time-tick-track" : '[data-testid="vertical-day-board"]'
      );
      if (!track) return;
      const zoom =
        view === "infinite-horizontal"
          ? parseFloat(track.style.width) / 600
          : (parseFloat(track.style.height) - 16) / 600;
      if (Math.abs(zoom - previous) < 0.001) return;
      previous = zoom;
      probe.current.commits += 1;
      const request = [...probe.current.requests]
        .reverse()
        .find((entry) => entry.commitAt === null && Math.abs(entry.zoom - zoom) < 0.001);
      if (request) request.commitAt = performance.now();
    });
    observer.observe(viewport, { attributes: true, attributeFilter: ["style"], childList: true, subtree: true });
    const pending = timers.current;
    return () => {
      observer.disconnect();
      viewport.removeEventListener("wheel", input, true);
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    };
  }, [view]);
  return ({ zoom }: { zoom: number }) => {
    const at = performance.now();
    probe.current.requests.push({ zoom, at, inputAt: inputAt.current ?? at, commitAt: null });
    inputAt.current = null;
    probe.current.maximumOutstanding = Math.max(
      probe.current.maximumOutstanding,
      probe.current.requests.filter((request) => request.commitAt === null).length
    );
    const query = new URLSearchParams(location.search);
    if (query.has("zoomReject")) return;
    const delay = Number(query.get("zoomDelay") ?? 0);
    if (!delay) {
      setZoom(zoom);
      return;
    }
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setZoom(zoom);
    }, delay);
    timers.current.add(timer);
  };
}
