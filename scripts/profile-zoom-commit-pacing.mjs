/* global window, document, requestAnimationFrame, PerformanceObserver, WheelEvent, setTimeout */
import { chromium } from "@playwright/test";
import process from "node:process";
import { writeFile } from "node:fs/promises";
import os from "node:os";

const urls = {
  before: process.env.QUNO_BEFORE_URL ?? "http://127.0.0.1:5192",
  after: process.env.QUNO_AFTER_URL ?? "http://127.0.0.1:5193"
};
const rounds = Number(process.env.QUNO_COMPARE_ROUNDS ?? 3);
const output = process.env.QUNO_COMPARE_OUTPUT ?? "/tmp/quno-zoom-pacing/comparison.json";
const browser = await chromium.launch();
const results = [];
const quantile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1] ?? 0;
async function run({ label, view, delay, round }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${urls[label]}/e2e/fixtures/calendar-engine.html?view=${view}&zoomDelay=${delay}&zoomStart=3`);
  await page.locator('[data-date="2026-10-08"] [data-testid="calendar-event"]').first().waitFor({ state: "attached" });
  await page.waitForTimeout(1200);
  const client = await page.context().newCDPSession(page);
  await client.send("Performance.enable");
  const read = async () => {
    const { metrics } = await client.send("Performance.getMetrics");
    return metrics
      .filter(({ name }) => ["ScriptDuration", "LayoutDuration", "RecalcStyleDuration"].includes(name))
      .reduce((sum, { value }) => sum + value, 0);
  };
  await page.evaluate(() => {
    window.zoomLongTasks = [];
    new PerformanceObserver((list) =>
      window.zoomLongTasks.push(...list.getEntries().map(({ duration }) => duration))
    ).observe({ type: "longtask" });
  });
  const box = await page.locator(".quno-calendar-viewport").boundingBox();
  await page.mouse.move(box.x + 300, box.y + 150);
  await page.keyboard.down("Shift");
  const costs = [];
  let nodes = 0;
  let events = 0;
  let previous = await read();
  for (let step = 0; step < (delay ? 8 : 40); step++) {
    if (!delay) await page.mouse.wheel(0, step % 16 < 8 ? -100 : 100);
    const counts = await page.evaluate(
      async ({ step, delay }) => {
        const viewport = document.querySelector(".quno-calendar-viewport");
        if (delay) {
          const box = viewport.getBoundingClientRect();
          for (let sample = 0; sample < 8; sample++) {
            viewport.dispatchEvent(
              new WheelEvent("wheel", {
                bubbles: true,
                cancelable: true,
                shiftKey: true,
                deltaY: step % 2 ? 20 : -20,
                clientX: box.x + 300,
                clientY: box.y + 150
              })
            );
            await new Promise(requestAnimationFrame);
          }
          await new Promise((resolve) => setTimeout(resolve, 450));
        } else
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          );
        return {
          nodes: viewport.querySelectorAll("*").length,
          events: viewport.querySelectorAll('[data-testid="calendar-event"]').length
        };
      },
      { step, delay }
    );
    const next = await read();
    costs.push(1000 * (next - previous));
    previous = next;
    nodes = Math.max(nodes, counts.nodes);
    events = Math.max(events, counts.events);
  }
  await page.keyboard.up("Shift");
  const probe = await page.evaluate(() => ({ ...window.zoomProbe, longTasks: window.zoomLongTasks }));
  const latency = probe.requests
    .filter(({ commitAt }) => commitAt !== null)
    .map(({ commitAt, inputAt }) => commitAt - inputAt);
  const finalZoom = await page.getByRole("slider", { name: "Zoom" }).inputValue();
  await page.close();
  return {
    label,
    view,
    delay,
    round,
    costs,
    latency,
    requests: probe.requests.length,
    commits: probe.commits,
    maximumOutstanding: probe.maximumOutstanding,
    uncommitted: probe.requests.filter(({ commitAt }) => commitAt === null).length,
    maximumDOMNodes: nodes,
    maximumEventNodes: events,
    maximumLongTaskMs: Math.max(0, ...probe.longTasks),
    finalZoom
  };
}
try {
  for (let round = 0; round < rounds; round++) {
    for (const label of round % 2 ? ["after", "before"] : ["before", "after"]) {
      for (const view of ["infinite-horizontal", "infinite-vertical"]) {
        for (const delay of [0, 180]) {
          const result = await run({ label, view, delay, round });
          results.push(result);
          console.log(
            JSON.stringify({
              ...result,
              costs: undefined,
              latency: undefined,
              p95CpuMs: quantile(result.costs, 0.95),
              p95InputToCommitMs: quantile(result.latency, 0.95)
            })
          );
        }
      }
    }
  }
  const summary = [];
  for (const label of Object.keys(urls))
    for (const view of ["infinite-horizontal", "infinite-vertical"])
      for (const delay of [0, 180]) {
        const runs = results.filter((r) => r.label === label && r.view === view && r.delay === delay);
        summary.push({
          label,
          view,
          delay,
          p95CpuMs: quantile(
            runs.flatMap((r) => r.costs),
            0.95
          ),
          medianCpuMs: quantile(
            runs.flatMap((r) => r.costs),
            0.5
          ),
          p95InputToCommitMs: quantile(
            runs.flatMap((r) => r.latency),
            0.95
          ),
          requests: runs.map((r) => r.requests),
          commits: runs.map((r) => r.commits),
          maximumOutstanding: Math.max(...runs.map((r) => r.maximumOutstanding)),
          maximumLongTaskMs: Math.max(...runs.map((r) => r.maximumLongTaskMs)),
          maximumDOMNodes: Math.max(...runs.map((r) => r.maximumDOMNodes)),
          maximumEventNodes: Math.max(...runs.map((r) => r.maximumEventNodes))
        });
      }
  const gates = summary
    .filter((r) => r.label === "after" && r.delay === 0)
    .map((r) => ({
      view: r.view,
      cpuRegression:
        r.p95CpuMs / summary.find((b) => b.label === "before" && b.view === r.view && b.delay === 0).p95CpuMs - 1,
      budgetPass:
        r.p95CpuMs < 10 &&
        r.maximumLongTaskMs <= 50 &&
        r.maximumEventNodes <= 1000 &&
        r.maximumDOMNodes < (r.view === "infinite-horizontal" ? 5000 : 6500)
    }));
  await writeFile(
    output,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        browser: browser.version(),
        host: { cpu: os.cpus()[0].model, platform: os.platform(), release: os.release() },
        rounds,
        urls,
        summary,
        gates,
        results
      },
      null,
      2
    ) + "\n"
  );
  console.log(JSON.stringify({ output, summary, gates }, null, 2));
} finally {
  await browser.close();
}
