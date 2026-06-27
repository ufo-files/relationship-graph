const { test, expect } = require("@playwright/test");

test("graph is operable with keyboard and exposes accessible controls", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Transcript Relationship Graph" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search entity or category" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download data" })).toBeVisible();
  await expect(page.locator("#status")).toHaveAttribute("role", "status");
  await expect(page.locator("#review-status")).toHaveAttribute("aria-live", "polite");

  const graphButtons = page.locator(".html-graph-label[role='button']");
  await expect(graphButtons.first()).toBeVisible({ timeout: 15000 });
  await expect(graphButtons.first()).toHaveAttribute("tabindex", "0");

  await page.keyboard.press("Tab");
  await expect(graphButtons.first()).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#status")).toContainText("entities shown");

  const entityButton = page.locator(".html-graph-label[data-label-entity]").first();
  await expect(entityButton).toBeVisible();
  await entityButton.focus();
  await expect(entityButton).toBeFocused();

  await page.keyboard.press(" ");
  const details = page.locator("#node-card");
  await expect(details).toBeVisible();
  await expect(details).toBeFocused();
  await expect(details.locator("#card-title")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(details).not.toBeVisible();
  await expect(page.locator(".html-graph-label[aria-current='true']").first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator("#status")).toContainText("entities shown");

  await page.keyboard.press("Escape");
  await expect(page.locator("#status")).toContainText("select a group");
});

test("search submits without mouse and moves focus to a result", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search entity or category" });
  await search.fill("CIA");
  await search.press("Enter");

  await expect(page.locator("#status")).toContainText("direct relationship graph");
  await expect(page.locator(".html-graph-label[aria-current='true']")).toBeFocused();
});

test("direct relationship graph renders one label per entity", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search entity or category" });
  await search.fill("CIA");
  await search.press("Enter");

  await expect(page.locator("#status")).toContainText("direct relationship graph");
  const duplicates = await page.locator(".html-graph-label[data-label-entity]").evaluateAll((labels) => {
    const seen = new Set();
    const repeated = new Set();
    for (const label of labels) {
      const id = label.getAttribute("data-label-entity");
      if (!id) continue;
      if (seen.has(id)) repeated.add(id);
      seen.add(id);
    }
    return Array.from(repeated);
  });
  expect(duplicates).toEqual([]);
});

test("category drill-in renders every entity in the category", async ({ page }) => {
  await page.goto("/");

  const expectedPeopleCount = await page.evaluate(() => {
    const raw = window.TRANSCRIPT_INTELLIGENCE_DATA;
    return raw.entities.filter((entity) => (raw.categoryToTop[entity.category] || "needs_review") === "people").length;
  });
  expect(expectedPeopleCount).toBeGreaterThan(42);

  await page.getByRole("button", { name: /^Open category: People/ }).click();
  await expect(page.locator("#status")).toContainText(`${expectedPeopleCount.toLocaleString()} entities shown`);
  await expect.poll(async () => page.locator("g[data-entity]").count()).toBeGreaterThanOrEqual(expectedPeopleCount);
});

test("merge duplicate target is selected through search results", async ({ page }) => {
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search entity or category" });
  await search.fill("CIA");
  await search.press("Enter");

  const mergeSearch = page.getByRole("searchbox", { name: "Find entity to merge into" });
  await expect(mergeSearch).toBeVisible();
  await expect(page.getByRole("button", { name: "Merge" })).toBeDisabled();

  await mergeSearch.fill("Roswell");
  const roswell = page.locator("[data-merge-target='locations:roswell']");
  await expect(roswell).toBeVisible();
  await roswell.click();

  await expect(mergeSearch).toHaveValue("Roswell");
  await expect(roswell).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Merge" })).toBeEnabled();
});
