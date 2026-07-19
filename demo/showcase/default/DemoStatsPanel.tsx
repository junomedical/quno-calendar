import { useEffect, useState } from "react";

type DemoStats = {
  frameMs: number;
  visibleEventNodes: number;
  totalCalendarNodes: number;
};

const emptyStats: DemoStats = { frameMs: 0, visibleEventNodes: 0, totalCalendarNodes: 0 };

function countVisibleEventNodes() {
  const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
  if (!viewport) {
    return 0;
  }
  const selector = '[data-testid="calendar-event"], [data-testid="availability-event"], [data-testid="draft-event"]';
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const box = element.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      box.right > viewport.left &&
      box.left < viewport.right &&
      box.bottom > viewport.top &&
      box.top < viewport.bottom
    );
  }).length;
}

function countTotalCalendarNodes() {
  const shell = document.querySelector(".ic-shell");
  return shell ? shell.querySelectorAll("*").length + 1 : 0;
}

export function DemoStatsPanel() {
  const [stats, setStats] = useState<DemoStats>(emptyStats);

  useEffect(() => {
    let animationFrame = 0;
    let previousFrameTime = performance.now();
    let previousStatsUpdate = previousFrameTime;
    const frameSamples: number[] = [];

    const sample = (frameTime: number) => {
      const frameMs = frameTime - previousFrameTime;
      previousFrameTime = frameTime;
      if (frameMs > 0 && frameMs < 250) {
        frameSamples.push(frameMs);
        if (frameSamples.length > 20) frameSamples.shift();
      }
      if (frameTime - previousStatsUpdate >= 500) {
        previousStatsUpdate = frameTime;
        const totalFrameMs = frameSamples.reduce((total, value) => total + value, 0);
        setStats({
          frameMs: Number((frameSamples.length ? totalFrameMs / frameSamples.length : 0).toFixed(1)),
          visibleEventNodes: countVisibleEventNodes(),
          totalCalendarNodes: countTotalCalendarNodes()
        });
      }
      animationFrame = window.requestAnimationFrame(sample);
    };

    animationFrame = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <dl className="demo-stats" aria-label="Calendar rendering stats">
      <div>
        <dt>Redraw frame</dt>
        <dd data-testid="stat-frame-ms">{stats.frameMs.toFixed(1)} ms</dd>
      </div>
      <div>
        <dt>Visible event nodes</dt>
        <dd data-testid="stat-visible-events">{stats.visibleEventNodes.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Total calendar nodes</dt>
        <dd data-testid="stat-total-calendar-nodes">{stats.totalCalendarNodes.toLocaleString()}</dd>
      </div>
    </dl>
  );
}
