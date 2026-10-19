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

const calendarScenes = [
  ["scroll", "Infinite scroll"],
  ["zoom", "Zoom"],
  ["overlap", "Overlapping events"],
  ["views", "Horizontal / vertical"],
  ["theme", "Theming"],
  ["density", "Event density"],
  ["create", "Create an appointment"],
  ["move", "Reschedule"]
];

export async function selectCalendarScene(page: Page, label: string, play = true) {
  await page.emulateMedia({ reducedMotion: play ? "no-preference" : "reduce" });
  await page.getByRole("button", { name: /^All .+ demos$/ }).click();
  await page
    .getByRole("navigation", { name: /^All .* demos$/ })
    .getByRole("button", { name: new RegExp(label) })
    .click();
  if (play)
    await page.waitForFunction(
      () =>
        document.querySelector(".concept")?.getAttribute("data-playing") === "true" &&
        document.querySelector(".concept-canvas")?.getAttribute("data-playback-cycle") === "0"
    );
}

export async function restartCalendarScene(page: Page, play = true) {
  const active = await page.locator(".concept").getAttribute("data-scene");
  const scene = calendarScenes.find(([id]) => id === active);
  if (!scene) throw new Error(`Unknown calendar scene: ${active}`);
  await selectCalendarScene(page, scene[1], play);
}

export async function pauseCalendarScene(page: Page) {
  await page.keyboard.press("Shift");
  await page.waitForFunction(() => document.querySelector(".concept")?.getAttribute("data-playing") === "false");
}

export async function playbackAction(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}
