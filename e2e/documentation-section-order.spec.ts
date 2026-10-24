import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`guides pair one bottom-aligned instruction with complete text and put recipes last at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    for (const product of ["infinite-calendar", "datepicker", "date-input", "timepicker", "date-parser"]) {
      await page.goto(`/docs/${product}`);
      await expect(page.locator(".field-guide h1")).toBeVisible();
      const sections = page.locator(
        ".calendar-article__section, .field-guide__section, .field-guide__subsection, .story__wide"
      );
      const checks = await sections.evaluateAll((elements) =>
        elements.map((section) => {
          const notes = section.querySelectorAll(".field-guide__try, .calendar-article__callout");
          const copy = section.querySelector(".field-guide__description > .field-guide__copy");
          const note = notes[0];
          const demo = section.querySelector(".field-guide__example, .calendar-article__breakout");
          const recipes = [...section.querySelectorAll(":scope > .article-code, :scope > .field-guide__recipe")];
          const copyBox = copy?.getBoundingClientRect();
          const noteBox = note?.getBoundingClientRect();
          const demoBox = demo?.getBoundingClientRect();
          return {
            id: section.id,
            notes: notes.length,
            copyBottom: copyBox?.bottom,
            noteBottom: noteBox?.bottom,
            demoTop: demoBox?.top,
            recipeOrder: recipes.every(
              (recipe) => !demo || !!(demo.compareDocumentPosition(recipe) & Node.DOCUMENT_POSITION_FOLLOWING)
            ),
            recipeGeometry: recipes.every((recipe) => !demoBox || recipe.getBoundingClientRect().top >= demoBox.bottom),
            copyParagraphs: copy?.querySelectorAll(":scope > p").length ?? 0
          };
        })
      );
      expect(checks.length).toBeGreaterThan(0);
      for (const check of checks) {
        expect(check.notes, `${product}/${check.id}: instruction count`).toBeLessThanOrEqual(1);
        if (width >= 1100 && check.notes) {
          expect(check.copyBottom, `${product}/${check.id}: full description`).toBeDefined();
          expect(check.noteBottom, `${product}/${check.id}: bottom alignment`).toBeCloseTo(check.copyBottom!, 1);
        }
        if (check.notes && check.demoTop !== undefined)
          expect(check.noteBottom!, `${product}/${check.id}: note above demo`).toBeLessThanOrEqual(check.demoTop);
        expect(check.recipeOrder, `${product}/${check.id}: DOM reading order`).toBe(true);
        expect(check.recipeGeometry, `${product}/${check.id}: implementation below demo`).toBe(true);
      }
      if (product === "infinite-calendar") {
        expect(checks.find(({ id }) => id === "css-native")?.copyParagraphs).toBe(2);
        expect(checks.find(({ id }) => id === "infinite-view")?.copyParagraphs).toBe(4);
        expect(checks.find(({ id }) => id === "performance")?.notes).toBe(1);
        expect(checks.find(({ id }) => id === "react-integration")?.notes).toBe(1);
      }
    }
  });
}

test("native CSS chapter keeps its complete copy, note, live demo and implementation in order", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/docs/infinite-calendar#css-native");
  const section = page.locator("#css-native");
  const copy = section.locator(".field-guide__description > .field-guide__copy");
  const note = section.locator(".calendar-article__callout");
  await expect(copy).toContainText("The browser already knows how to scroll");
  await expect(copy).toContainText("without a second stream of scroll-synchronization state");
  const copyBox = (await copy.boundingBox())!;
  const noteBox = (await note.boundingBox())!;
  expect(noteBox.y + noteBox.height).toBeCloseTo(copyBox.y + copyBox.height, 1);
  const demo = section.locator(".article-lazy-demo");
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute("data-mounted", "true");
  const implementation = section.locator(".article-code");
  expect((await implementation.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await demo.boundingBox())!.y + (await demo.boundingBox())!.height
  );
  await implementation
    .getByText("Implementation · Keep stable labels visible with native CSS", { exact: true })
    .click();
  await expect(implementation).toHaveAttribute("open", "");
  await expect(implementation.locator("code")).toContainText("position: sticky");
});
