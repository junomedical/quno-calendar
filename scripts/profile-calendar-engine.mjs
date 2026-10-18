/* global window, document, PerformanceObserver, requestAnimationFrame */
import { chromium } from "@playwright/test";
import process from "node:process";

// Run against an otherwise idle development or preview server. Startup is warmed separately.
const baseURL = process.env.QUNO_PROFILE_URL ?? "http://127.0.0.1:5189";
const browser = await chromium.launch();
try {
  for (const view of ["infinite-horizontal", "infinite-vertical"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${baseURL}/e2e/fixtures/calendar-engine.html?view=${view}`);
    await page.getByTestId("calendar-event").first().waitFor();
    await page.waitForTimeout(1500);
    const client = await page.context().newCDPSession(page);
    await client.send("Performance.enable");
    await page.evaluate(() => {
      window.__calendarLongTasks = [];
      new PerformanceObserver((list) => {
        window.__calendarLongTasks.push(...list.getEntries().map((entry) => entry.duration));
      }).observe({ type: "longtask" });
    });
    const costs = [];
    const components = { ScriptDuration: [], LayoutDuration: [], RecalcStyleDuration: [] };
    const read = async () => {
      const { metrics } = await client.send("Performance.getMetrics");
      return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
    };
    let previous = await read();
    let nodes = 0;
    let events = 0;
    for (let frame = 0; frame < 120; frame++) {
      const counts = await page.evaluate(async (frame) => {
        const viewport = document.querySelector(".quno-calendar-viewport");
        viewport.scrollTop += frame % 40 < 20 ? 43 : -43;
        viewport.scrollLeft += frame % 40 < 20 ? 17 : -17;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return {
          nodes: viewport.querySelectorAll("*").length,
          events: viewport.querySelectorAll('[data-testid="calendar-event"]').length
        };
      }, frame);
      const next = await read();
      for (const key of Object.keys(components)) components[key].push(1000 * (next[key] - previous[key]));
      costs.push(
        1000 *
          ["ScriptDuration", "LayoutDuration", "RecalcStyleDuration"].reduce(
            (cost, key) => cost + next[key] - previous[key],
            0
          )
      );
      previous = next;
      nodes = Math.max(nodes, counts.nodes);
      events = Math.max(events, counts.events);
    }
    costs.sort((a, b) => a - b);
    const longTasks = await page.evaluate(() => window.__calendarLongTasks);
    const result = {
      view,
      resources: 50,
      annualEvents: 20000,
      samples: costs.length,
      p95ComponentsMs: Object.fromEntries(
        Object.entries(components).map(([key, values]) => [key, values.sort((a, b) => a - b)[113]])
      ),
      p95ScriptingStyleLayoutMs: costs[Math.ceil(costs.length * 0.95) - 1],
      maximumLongTaskMs: Math.max(0, ...longTasks),
      maximumDOMNodes: nodes,
      maximumEventNodes: events
    };
    console.log(JSON.stringify(result));
    if (
      result.p95ScriptingStyleLayoutMs >= 10 ||
      result.maximumLongTaskMs > 50 ||
      nodes >= (view === "infinite-horizontal" ? 5000 : 6500) ||
      events > 1000
    )
      process.exitCode = 1;
    await page.close();
  }
} finally {
  await browser.close();
}
