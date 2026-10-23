import { test, expect } from "@playwright/test";

test("first online visit supports offline reloads of all five pages and saved edits", async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "今天只需要一步" })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.clearBrowserCache");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  const fajr = page.getByRole("button", { name: "Fajr 晨礼" });
  await fajr.click();
  await expect(fajr).toHaveAttribute("aria-pressed", "true");
  for (const [label, heading] of [["本周", "本周的温柔进度"], ["地点", "我的地点"], ["同行", "Partner Mode"], ["设置", "应用名称"]]) {
    await page.getByRole("link", { name: label, exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    // A client-side transition can reuse memory; reload verifies the page itself is cached.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();

    if (label === "地点") {
      await page.getByPlaceholder("名称", { exact: true }).fill("Offline café");
      await page.getByRole("button", { name: "保存地点", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "正在保存" })).toHaveCount(0);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Offline café", exact: true })).toBeVisible();
    }

    if (label === "同行") {
      const goal = page.getByRole("button", { name: /一起做一顿清真饭/ });
      const complete = page.getByRole("button", { name: /这周已经一起完成/ });
      await goal.click();
      await complete.click();
      await expect(page.getByRole("status").filter({ hasText: "正在保存" })).toHaveCount(0);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(goal).toHaveAttribute("aria-pressed", "true");
      await expect(complete).toHaveAttribute("aria-pressed", "true");
    }
  }
  const name = page.getByPlaceholder("One Step Closer");
  await name.fill("Offline demo");
  await expect(page.getByRole("status").filter({ hasText: "正在保存" })).toHaveCount(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Offline demo", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "今日", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "今天只需要一步", exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(fajr).toHaveAttribute("aria-pressed", "true");
});
