import { expect, test } from "@playwright/test";

test("invalid JSON is preserved and reported instead of silently erased", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("osc:daily-entries", "{unfinished"));
  await page.goto("/");
  await expect(page.getByRole("alert").filter({ hasText: "读取" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:daily-entries"))).toBe("{unfinished");
  await expect(page.getByRole("button", { name: "Fajr 晨礼", exact: false })).toBeDisabled();
});

test("structurally invalid stored settings cannot crash the application", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("osc:settings", "null"));
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "One Step Closer", exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "读取" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:settings"))).toBe("null");
});

test("nested invalid daily data is preserved without crashing weekly progress", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-22T12:00:00") });
  const invalid = '{"2026-10-22":{"date":"2026-10-22","foodStatus":"halal","salah":null,"quran":null,"reflection":"keep me"}}';
  await page.addInitScript((raw) => localStorage.setItem("osc:daily-entries", raw), invalid);
  await page.goto("/weekly");
  await expect(page.getByRole("alert").filter({ hasText: "读取" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:daily-entries"))).toBe(invalid);
});

test("a failed write is visible and does not pretend the new value was saved", async ({ page }) => {
  await page.goto("/settings");
  const name = page.getByPlaceholder("One Step Closer");
  await expect(name).toHaveValue("One Step Closer");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("osc:")) throw new DOMException("Storage full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await name.fill("Cannot persist");
  await expect(page.getByRole("alert").filter({ hasText: "保存失败" })).toBeVisible();
  await expect(name).toHaveValue("One Step Closer");
  await page.reload();
  await expect(name).toHaveValue("One Step Closer");
});

test("sequential updates in two tabs retain both saved places", async ({ page, context }) => {
  const second = await context.newPage();
  await page.goto("/places");
  await second.goto("/places");
  await expect(second.getByRole("heading", { name: "我的地点" })).toBeVisible();
  await page.getByPlaceholder("名称", { exact: true }).fill("First café");
  await page.getByRole("button", { name: "保存地点" }).click();
  await expect(page.getByRole("heading", { name: "First café", exact: true })).toBeVisible();
  await second.getByPlaceholder("名称", { exact: true }).fill("Second café");
  await second.getByRole("button", { name: "保存地点" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "First café", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Second café", exact: true })).toBeVisible();
  await second.close();
});

test("a failed place save keeps the draft available to retry", async ({ page }) => {
  await page.goto("/places");
  const name = page.getByPlaceholder("名称", { exact: true });
  const notes = page.getByPlaceholder("备注，例如招牌菜、停车、是否适合一起去");
  await name.fill("Keep this café");
  await notes.fill("Keep these notes");
  const originalSetItem = await page.evaluateHandle(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "osc:places") throw new DOMException("Storage full", "QuotaExceededError");
      original.call(this, key, value);
    };
    return original;
  });
  await page.getByRole("button", { name: "保存地点" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "保存失败" })).toBeVisible();
  await expect(name).toHaveValue("Keep this café");
  await expect(notes).toHaveValue("Keep these notes");
  expect(await page.evaluate(() => localStorage.getItem("osc:places"))).toBeNull();
  await page.evaluate((original) => { Storage.prototype.setItem = original; }, originalSetItem);
  await page.getByRole("button", { name: "保存地点" }).click();
  await expect(page.getByRole("heading", { name: "Keep this café", exact: true })).toBeVisible();
  await expect(name).toHaveValue("");
  await expect(notes).toHaveValue("");
});

test("existing valid data remains editable without changing storage keys", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("osc:settings", JSON.stringify({
    appName: "Existing name", mainFocus: "balanced", reminderText: "Hello", theme: "warm"
  })));
  await page.goto("/settings");
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Existing name");
  await page.getByPlaceholder("One Step Closer").fill("Updated name");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("osc:settings")!).appName)).toBe("Updated name");
});

test("server-rendered controls cannot be edited before local data is loaded", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/settings");
  await expect(page.getByPlaceholder("One Step Closer")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("读取");
  await context.close();
});
