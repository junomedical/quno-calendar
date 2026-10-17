import { expect, test } from "@playwright/test";
import { firstViewportEventBox, goToWorkday, openDrawnExternalDraft, waitForDemoEvents } from "#quno-e2e/helpers";

for (const timezoneId of ["Europe/Berlin", "America/New_York"]) {
  test.describe(`server event queries in ${timezoneId}`, () => {
    test.use({ timezoneId });
    test("sends dates and resource IDs and displays consistent local working hours", async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-10-08T10:00:00Z"));
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes("/api/demo-events") && response.status() === 200
      );
      await page.goto("/demo/infinite-calendar");
      const response = await responsePromise;
      const query = response.request().postDataJSON();
      expect(Object.keys(query).sort()).toEqual(["calendarIds", "endDate", "eventsPerYear", "startDate"]);
      expect(query.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(query.endDate >= query.startDate).toBe(true);
      expect(query.eventsPerYear).toBe(1000);
      expect(query.calendarIds).toEqual([
        "dr-kirillov",
        "dr-thakker",
        "marco-eggens",
        "room-201",
        "room-202",
        "room-203"
      ]);
      const { events } = await response.json();
      expect(events.length).toBeGreaterThan(0);
      for (const event of events) {
        expect(event.start.slice(0, 10) >= query.startDate && event.start.slice(0, 10) <= query.endDate).toBe(true);
        expect(event.calendarIds.some((id: string) => query.calendarIds.includes(id))).toBe(true);
      }
      await goToWorkday(page, "2026-10-08");
      await page.getByRole("spinbutton", { name: "Start", exact: true }).fill("8");
      await page.getByRole("spinbutton", { name: "End", exact: true }).fill("18");
      for (const [calendarId, startHour, endHour] of [
        ["dr-kirillov", 8, 14],
        ["dr-thakker", 10, 17],
        ["marco-eggens", 12, 18]
      ] as const) {
        const availability = events.find(
          (event: { kind: string; calendarId: string; start: string }) =>
            event.kind === "availability" && event.calendarId === calendarId && event.start.startsWith("2026-10-08")
        );
        expect(availability).toBeTruthy();
        const hours = await page.evaluate(
          ({ start, end }) => [new Date(start).getHours(), new Date(end).getHours()],
          availability
        );
        expect(hours).toEqual([startHour, endHour]);
        const row = page.locator(
          `[data-date="2026-10-08"] [data-testid="calendar-row"][data-calendar-id="${calendarId}"]`
        );
        const shell = row.getByTestId("availability-event");
        await expect(shell).toBeVisible();
        await expect
          .poll(async () =>
            shell.evaluate(
              (element, { startHour, endHour }) => {
                const grid = element.closest(".quno-calendar-row-grid")!.getBoundingClientRect();
                const box = element.getBoundingClientRect();
                const hourWidth = (grid.width - 8) / 10;
                return Math.max(
                  Math.abs(box.left - grid.left - 8 - (startHour - 8) * hourWidth),
                  Math.abs(box.width - (endHour - startHour) * hourWidth)
                );
              },
              { startHour, endHour }
            )
          )
          .toBeLessThanOrEqual(1);
      }
    });
  });
}

test("session edits and creates survive server refetches without reappearing at their old location", async ({
  page
}) => {
  await page.goto("/demo/infinite-calendar");
  await goToWorkday(page, "2026-10-08");
  await waitForDemoEvents(page);
  const box = await firstViewportEventBox(page);
  await page.mouse.click(box.x + Math.min(12, box.width / 2), box.y + box.height / 2);
  await expect(page.getByTestId("external-event-popup")).toBeVisible();
  const draft = page.getByTestId("draft-event").first();
  const sourceId = await draft.getAttribute("data-event-id");
  await page.getByTestId("draft-title-input").fill("Session edit survives reload");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await page.getByTestId("api-latency-select").selectOption("250");
  await expect(page.getByTestId("api-loading-status")).toHaveText("API idle");
  await expect(page.locator(`[data-testid="calendar-event"][data-event-id="${sourceId}"]`).first()).toContainText(
    "Session edit survives reload"
  );
  await goToWorkday(page, "2026-10-17");
  await openDrawnExternalDraft(page, { dateKey: "2026-10-17", calendarId: "marco-eggens" });
  await page.getByTestId("draft-title-input").fill("Session create survives reload");
  await page.getByTestId("draft-save-button").click();
  await expect(page.getByTestId("external-event-popup")).toHaveCount(0);
  await page.getByTestId("api-latency-select").selectOption("0");
  await expect(page.getByTestId("api-loading-status")).toHaveText("API idle");
  const created = page.getByTestId("calendar-event").filter({ hasText: "Session create survives reload" });
  await expect(created).toHaveCount(1);
  await expect(created).toBeVisible();
});
