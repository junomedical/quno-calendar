/* global window, document, performance, requestAnimationFrame, PerformanceObserver */
import { chromium } from "@playwright/test";
import process from "node:process";
import { writeFile } from "node:fs/promises";
import os from "node:os";

// Serve identical production-built calendar-engine fixtures from the two revisions.
const urls = {
  before: process.env.QUNO_BEFORE_URL ?? "http://127.0.0.1:5192",
  after: process.env.QUNO_AFTER_URL ?? "http://127.0.0.1:5193"
};
if (process.env.QUNO_REFERENCE_URL) urls.reference = process.env.QUNO_REFERENCE_URL;
const rounds = Number(process.env.QUNO_COMPARE_ROUNDS ?? 3);
const output = process.env.QUNO_COMPARE_OUTPUT ?? "/tmp/quno-calendar-comparison.json";
const browser = await chromium.launch();
const results = [];
const quantile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
const summarize = (values) => ({
  samples: values.length,
  medianMs: quantile(values, 0.5),
  p95Ms: quantile(values, 0.95)
});

async function open({ label, view }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => {
    throw error;
  });
  const response = await page.goto(`${urls[label]}/e2e/fixtures/calendar-engine.html?view=${view}`);
  if (!response.ok()) throw new Error(`Fixture returned ${response.status()}`);
  await page.locator('[data-date="2026-10-08"] [data-testid="calendar-event"]').first().waitFor({ state: "attached" });
  await page.waitForTimeout(1500);
  return page;
}

async function profile({ label, view, operation }) {
  const page = await open({ label, view });
  const client = await page.context().newCDPSession(page);
  await client.send("Performance.enable");
  const read = async () => {
    const { metrics } = await client.send("Performance.getMetrics");
    return metrics
      .filter(({ name }) => ["ScriptDuration", "LayoutDuration", "RecalcStyleDuration"].includes(name))
      .reduce((sum, { value }) => sum + value, 0);
  };
  await page.evaluate(() => {
    window.__calendarLongTasks = [];
    new PerformanceObserver((list) =>
      window.__calendarLongTasks.push(...list.getEntries().map(({ duration }) => duration))
    ).observe({ type: "longtask" });
  });
  const viewport = page.locator(".quno-calendar-viewport");
  const box = await viewport.boundingBox();
  await page.mouse.move(box.x + 300, box.y + 200);
  if (operation === "zoom") await page.keyboard.down("Shift");
  let previous = await read();
  let maximumDOMNodes = 0;
  const samples = [];
  for (let step = 0; step < (operation === "scroll" ? 120 : 40); step++) {
    if (operation === "zoom") await page.mouse.wheel(0, step % 16 < 8 ? -100 : 100);
    const nodes = await page.evaluate(
      async ({ step, operation }) => {
        const viewport = document.querySelector(".quno-calendar-viewport");
        if (operation === "scroll") {
          viewport.scrollTop += step % 40 < 20 ? 43 : -43;
          viewport.scrollLeft += step % 40 < 20 ? 17 : -17;
        }
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        );
        return viewport.querySelectorAll("*").length;
      },
      { step, operation }
    );
    const next = await read();
    samples.push(1000 * (next - previous));
    previous = next;
    maximumDOMNodes = Math.max(maximumDOMNodes, nodes);
  }
  if (operation === "zoom") await page.keyboard.up("Shift");
  const longTasks = await page.evaluate(() => window.__calendarLongTasks);
  const zoom = await page.getByRole("slider", { name: "Zoom" }).inputValue();
  await page.close();
  return {
    label,
    view,
    operation,
    samples,
    maximumDOMNodes,
    maximumLongTaskMs: Math.max(0, ...longTasks),
    finalZoom: zoom
  };
}

async function navigation({ label, view }) {
  const page = await open({ label, view });
  const samples = [];
  for (let step = 0; step < 7; step++) {
    const date = step % 2 === 0 ? "2026-11-03" : "2026-10-08";
    const name = step % 2 === 0 ? "November 3" : "October 8";
    samples.push(
      await page.evaluate(
        async ({ date, name }) => {
          const start = performance.now();
          [...document.querySelectorAll("button")].find((button) => button.textContent === name).click();
          let stable = 0;
          while (performance.now() - start < 10000) {
            await new Promise(requestAnimationFrame);
            const viewport = document.querySelector(".quno-calendar-viewport");
            const day = viewport.querySelector(`[data-date="${date}"]`);
            const ready =
              day &&
              Math.abs(day.getBoundingClientRect().top - viewport.getBoundingClientRect().top) < 2 &&
              day.querySelector('[data-testid="calendar-event"]');
            stable = ready ? stable + 1 : 0;
            if (stable === 3) return performance.now() - start;
          }
          throw new Error(`Navigation to ${date} did not settle`);
        },
        { date, name }
      )
    );
    await page.waitForTimeout(200);
  }
  await page.close();
  return [
    { label, view, operation: "navigation-cold", samples: samples.slice(0, 1) },
    { label, view, operation: "navigation-warm", samples: samples.slice(1) }
  ];
}

try {
  for (let round = 0; round < rounds; round++) {
    const labels = Object.keys(urls);
    const order =
      labels.length === 2
        ? round % 2
          ? ["after", "before"]
          : ["before", "after"]
        : [...labels.slice(round % labels.length), ...labels.slice(0, round % labels.length)];
    for (const label of order) {
      for (const view of ["infinite-horizontal", "infinite-vertical"]) {
        for (const operation of ["scroll", "zoom"]) {
          const result = { round, ...(await profile({ label, view, operation })) };
          results.push(result);
          console.log(JSON.stringify({ ...result, samples: summarize(result.samples) }));
        }
        for (const result of await navigation({ label, view })) {
          results.push({ round, ...result });
          console.log(JSON.stringify({ round, ...result, samples: summarize(result.samples) }));
        }
      }
    }
  }
  const summary = [];
  for (const label of Object.keys(urls)) {
    for (const view of ["infinite-horizontal", "infinite-vertical"]) {
      for (const operation of ["scroll", "zoom", "navigation-cold", "navigation-warm"]) {
        const runs = results.filter(
          (result) => result.label === label && result.view === view && result.operation === operation
        );
        summary.push({
          label,
          view,
          operation,
          ...summarize(runs.flatMap(({ samples }) => samples)),
          runMediansMs: runs.map(({ samples }) => quantile(samples, 0.5)),
          runP95Ms: runs.map(({ samples }) => quantile(samples, 0.95))
        });
      }
    }
  }
  await writeFile(
    output,
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        browser: browser.version(),
        host: { platform: os.platform(), release: os.release(), architecture: os.arch(), cpu: os.cpus()[0].model },
        rounds,
        urls,
        summary,
        results
      },
      null,
      2
    ) + "\n"
  );
  console.log(JSON.stringify({ output, summary }, null, 2));
} finally {
  await browser.close();
}
