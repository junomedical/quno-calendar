import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { Page } from "@playwright/test";
import type { InitialByProduct } from "#quno-demo/concept/scenarioTypes";

// Exercise the supported JSON configuration without exposing unrelated controls in the UI.
export async function calendarInitial(page: Page, initial: Partial<InitialByProduct["infinite-calendar"]>) {
  await page.route("**/demo/concept/scenarios/infinite-calendar/*.json*", async (route) => {
    const filename = basename(new URL(route.request().url()).pathname);
    const scene = JSON.parse(await readFile(resolve("demo/concept/scenarios/infinite-calendar", filename), "utf8"));
    Object.assign(scene.initial, initial);
    await route.fulfill({ contentType: "application/javascript", body: `export default ${JSON.stringify(scene)};` });
  });
}
