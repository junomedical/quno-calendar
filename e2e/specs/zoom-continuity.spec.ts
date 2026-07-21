import { expect, test, type Page } from "@playwright/test";
import { firstViewportEventBox, goToWorkday, topVisibleDayDate, waitForDemoEvents } from "../helpers";

async function visibleTimelineCenterMinuteOffset(page: Page) {
  return page.locator(".ic-viewport").evaluate((viewport) => {
    const label = viewport.querySelector<HTMLElement>(".ic-row-label");
    const zoomText = document.querySelector<HTMLElement>('[data-testid="zoom-value"]')?.textContent;
    if (!label || !zoomText) throw new Error("Missing horizontal zoom geometry");
    const zoom = Number(zoomText);
    const timelineGutter = 8;
    const visibleTimelineWidth = Math.max(
      0,
      viewport.clientWidth - label.getBoundingClientRect().width - timelineGutter
    );
    return (viewport.scrollLeft + visibleTimelineWidth / 2) / zoom;
  });
}

test("coalesces a touchpad wheel burst into one anchored timeline projection", async ({ page }) => {
  await page.goto("/");
  await waitForDemoEvents(page);

  const result = await page.evaluate(async () => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const output = document.querySelector<HTMLElement>('[data-testid="zoom-value"]');
    const track = document.querySelector<HTMLElement>(".ic-time-tick-track");
    const controlPane = document.querySelector<HTMLElement>(".demo-control-pane");
    if (!viewport || !output || !track || !controlPane) throw new Error("Missing wheel zoom burst fixture");
    const viewportBox = viewport.getBoundingClientRect();
    const projectedWidths: string[] = [];
    const sidebarNodes = Array.from(controlPane.querySelectorAll("*"));
    let sidebarMutations = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.attributeName === "style") projectedWidths.push(track.style.width);
      }
    });
    const sidebarObserver = new MutationObserver((records) => {
      sidebarMutations += records.length;
    });
    observer.observe(track, { attributes: true, attributeFilter: ["style"] });
    sidebarObserver.observe(controlPane, { attributes: true, characterData: true, childList: true, subtree: true });
    for (let index = 0; index < 8; index += 1) {
      viewport.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          shiftKey: true,
          deltaY: -100,
          clientX: viewportBox.left + viewportBox.width * 0.7,
          clientY: viewportBox.top + viewportBox.height * 0.5
        })
      );
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    observer.disconnect();
    sidebarObserver.disconnect();
    return {
      output: output.textContent,
      projectedWidths,
      sidebarMutations,
      disconnectedSidebarNodes: sidebarNodes.filter((node) => !node.isConnected).length
    };
  });

  expect(result.output).toBe("1.20");
  expect(result.projectedWidths).toHaveLength(1);
  expect(result.sidebarMutations).toBe(0);
  expect(result.disconnectedSidebarNodes).toBe(0);
  await expect(page.getByTestId("zoom-value")).toHaveText("2.40");
});

test("keeps horizontal slider zoom continuous without replacing rendered content", async ({ page }) => {
  await page.goto("/");
  await goToWorkday(page);
  await waitForDemoEvents(page);
  await firstViewportEventBox(page);

  const viewport = page.locator(".ic-viewport");
  const zoom = page.getByTestId("zoom-slider");
  const controlPane = page.locator(".demo-control-pane");
  const zoomPaintBoundary = page.locator(".demo-zoom-paint-boundary");
  const statsPaintBoundary = page.locator(".demo-stats");
  const controlPaneBox = await controlPane.boundingBox();
  const brandBox = await page.locator(".demo-brand").boundingBox();
  await expect(page.locator(".ic-shell")).toHaveCSS("contain", "paint");
  await expect(controlPane).toHaveCSS("contain", "none");
  await expect(controlPane).toHaveCSS("will-change", "transform");
  expect(await controlPane.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await expect(zoomPaintBoundary).toHaveCSS("contain", "layout paint");
  await expect(zoomPaintBoundary).toHaveCSS("will-change", "transform");
  expect(await zoomPaintBoundary.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await expect(statsPaintBoundary).toHaveCSS("contain", "layout paint");
  await expect(statsPaintBoundary).toHaveCSS("will-change", "transform");
  expect(await statsPaintBoundary.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await zoom.fill("2");
  await expect(page.getByTestId("zoom-value")).toHaveText("2.00");
  await viewport.evaluate((element) => {
    element.scrollLeft = 360;
    const event = Array.from(element.querySelectorAll<HTMLElement>('[data-testid="calendar-event"]')).find(
      (candidate) => candidate.getBoundingClientRect().width > 0
    );
    const content = event?.firstElementChild;
    if (!event || !(content instanceof HTMLElement)) throw new Error("Missing event content to track");
    event.dataset.zoomStableShell = "true";
    content.dataset.zoomStableContent = "true";

    const virtualSpace = element.querySelector<HTMLElement>(".ic-virtual-space");
    if (!virtualSpace) throw new Error("Missing virtual space to observe");
    const state = window as typeof window & {
      zoomStableNodes?: Element[];
      zoomChildListMutations?: number;
      zoomMutationObserver?: MutationObserver;
    };
    state.zoomStableNodes = Array.from(
      virtualSpace.querySelectorAll(
        '[data-testid="calendar-day"], [data-testid="calendar-row"], [data-testid="calendar-event"], .ic-time-tick'
      )
    );
    state.zoomChildListMutations = 0;
    state.zoomMutationObserver = new MutationObserver((records) => {
      state.zoomChildListMutations =
        (state.zoomChildListMutations ?? 0) + records.filter((record) => record.type === "childList").length;
    });
    state.zoomMutationObserver.observe(virtualSpace, { childList: true, subtree: true });
  });

  const centerMinuteOffset = await visibleTimelineCenterMinuteOffset(page);
  for (const value of [2.6, 3.2, 2.4, 1.8]) {
    await zoom.fill(String(value));
    await expect(page.getByTestId("zoom-value")).toHaveText(value.toFixed(2));
    await expect
      .poll(async () => Math.abs((await visibleTimelineCenterMinuteOffset(page)) - centerMinuteOffset))
      .toBeLessThanOrEqual(1);
    await expect(page.locator('[data-zoom-stable-shell="true"]')).toHaveCount(1);
    await expect(page.locator('[data-zoom-stable-content="true"]')).toHaveCount(1);
    await expect(page.getByTestId("calendar-day")).not.toHaveCount(0);
    await expect(page.getByTestId("calendar-event")).not.toHaveCount(0);
    expect(await controlPane.boundingBox()).toEqual(controlPaneBox);
    expect(await page.locator(".demo-brand").boundingBox()).toEqual(brandBox);
  }

  expect(
    await page.evaluate(() => {
      const state = window as typeof window & {
        zoomStableNodes?: Element[];
        zoomChildListMutations?: number;
        zoomMutationObserver?: MutationObserver;
      };
      state.zoomMutationObserver?.disconnect();
      return {
        disconnectedNodes: state.zoomStableNodes?.filter((node) => !node.isConnected).length ?? -1,
        childListMutations: state.zoomChildListMutations ?? -1
      };
    })
  ).toEqual({ disconnectedNodes: 0, childListMutations: 0 });
});

test("keeps the vertical visible date mounted while zoom geometry settles", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-infinite-vertical").check();
  const visibleDate = await topVisibleDayDate(page);

  await page.evaluate((dateKey) => {
    const day = document.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
    const virtualSpace = document.querySelector<HTMLElement>(".ic-virtual-space");
    if (!day || !virtualSpace) throw new Error("Missing visible vertical date to observe");
    const stableNodes = [
      day,
      day.querySelector(".icv-date-label"),
      day.querySelector(".icv-time-tick"),
      day.querySelector('[data-testid="calendar-column"]')
    ].filter((node): node is Element => Boolean(node));
    const state = window as typeof window & {
      verticalStableNodes?: Element[];
      verticalStableDayRemoved?: number;
      verticalMutationObserver?: MutationObserver;
    };
    state.verticalStableNodes = stableNodes;
    state.verticalStableDayRemoved = 0;
    state.verticalMutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const removedNode of record.removedNodes) {
          if (removedNode === day || (removedNode instanceof Element && removedNode.contains(day))) {
            state.verticalStableDayRemoved = (state.verticalStableDayRemoved ?? 0) + 1;
          }
        }
      }
    });
    state.verticalMutationObserver.observe(virtualSpace, { childList: true, subtree: true });
  }, visibleDate);

  await page.getByTestId("zoom-slider").fill("2");
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );

  expect(await topVisibleDayDate(page)).toBe(visibleDate);
  expect(
    await page.evaluate(() => {
      const state = window as typeof window & {
        verticalStableNodes?: Element[];
        verticalStableDayRemoved?: number;
        verticalMutationObserver?: MutationObserver;
      };
      state.verticalMutationObserver?.disconnect();
      return {
        disconnectedNodes: state.verticalStableNodes?.filter((node) => !node.isConnected).length ?? -1,
        removedStableDay: state.verticalStableDayRemoved ?? -1
      };
    })
  ).toEqual({ disconnectedNodes: 0, removedStableDay: 0 });
  await expect(
    page.locator(`[data-testid="calendar-day"][data-date="${visibleDate}"] [data-testid="vertical-day-board"]`)
  ).not.toHaveCSS("height", "0px");
});
