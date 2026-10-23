import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

// Fictional records. Expectations below do not use the production backup codec.
const savedData = {
  entries: {
    "2026-10-20": {
      date: "2026-10-20", foodStatus: "halal",
      salah: { fajr: true, dhuhr: false, asr: false, maghrib: true, isha: false },
      quran: "translation", reflection: "A fictional note for a restore test."
    }
  },
  places: [{
    id: "fictional-place", name: "Example kitchen", type: "restaurant",
    location: "Example street", notes: "Fictional place", favorite: true,
    createdAt: "2026-10-20T12:00:00.000Z"
  }],
  partner: {
    personOne: "Example A", personTwo: "Example B", weeklyGoal: "cook_halal_meal",
    completedThisWeek: false, note: "A fictional goal", updatedAt: "2026-10-20T12:00:00.000Z"
  },
  settings: {
    appName: "Restore example", mainFocus: "balanced", reminderText: "A gentle example", theme: "warm"
  }
};

const backupText = JSON.stringify({
  app: "one-step-closer", formatVersion: 1, exportedAt: "2026-10-22T12:00:00.000Z", data: savedData
});

async function seedRecords(page: Page) {
  await page.goto("/settings");
  await page.evaluate((data) => {
    localStorage.setItem("osc:daily-entries", JSON.stringify(data.entries));
    localStorage.setItem("osc:places", JSON.stringify(data.places));
    localStorage.setItem("osc:partner", JSON.stringify(data.partner));
    localStorage.setItem("osc:settings", JSON.stringify(data.settings));
  }, savedData);
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Restore example");
}

async function storedRecords(page: Page) {
  return page.evaluate(() => Object.fromEntries(
    Object.keys(localStorage).filter((key) => key.startsWith("osc:")).sort()
      .map((key) => [key, localStorage.getItem(key)])
  ));
}

test("downloaded backup restores all four data groups only after explicit confirmation", async ({ page, browser, baseURL }) => {
  // Catches a missing export group, automatic import on selection, or a confirmation that never restores.
  await seedRecords(page);
  await expect(page.getByRole("heading", { name: "数据备份与恢复" })).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^one-step-closer-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await readFile((await download.path())!, "utf8");
  const backup = JSON.parse(text);
  expect(backup.app).toBe("one-step-closer");
  expect(backup.formatVersion).toBe(1);
  expect(backup.data).toEqual(savedData);

  // A separate browser profile has none of the exported records. This catches
  // a restore that copies settings but accidentally skips the other groups.
  const targetContext = await browser.newContext({ baseURL });
  try {
    const target = await targetContext.newPage();
    await target.goto("/settings");
    await expect(target.getByPlaceholder("One Step Closer")).toHaveValue("One Step Closer");
    const beforeRestore = await storedRecords(target);
    await target.getByLabel("选择备份文件").setInputFiles({
      name: "saved.json", mimeType: "application/json", buffer: Buffer.from(text)
    });
    await expect(target.getByRole("heading", { name: "恢复预览" })).toBeVisible();
    await expect(target.getByRole("button", { name: "确认恢复", exact: true })).toBeDisabled();
    expect(await storedRecords(target)).toEqual(beforeRestore);
    await target.getByLabel("我了解恢复会替换当前记录").check();
    await target.getByRole("button", { name: "确认恢复", exact: true }).click();
    await expect(target.getByRole("status").filter({ hasText: "恢复完成" })).toBeVisible();
    await target.reload();
    await expect(target.getByPlaceholder("One Step Closer")).toHaveValue("Restore example");

    const secondDownloadEvent = target.waitForEvent("download");
    await target.getByRole("button", { name: "导出备份", exact: true }).click();
    const secondDownload = await secondDownloadEvent;
    expect(JSON.parse(await readFile((await secondDownload.path())!, "utf8")).data).toEqual(savedData);
  } finally {
    await targetContext.close();
  }
});

test("canceling a restore preview makes no changes and returns keyboard focus to the file input", async ({ page }) => {
  // Catches accidental writes before confirmation and focus lost when the preview is removed.
  await seedRecords(page);
  const before = await storedRecords(page);
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "example.json", mimeType: "application/json", buffer: Buffer.from(backupText)
  });
  await expect(page.getByRole("heading", { name: "恢复预览" })).toBeVisible();
  await page.getByRole("button", { name: "取消恢复" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "恢复预览" })).toHaveCount(0);
  await expect(page.getByLabel("选择备份文件")).toBeFocused();
  expect(await storedRecords(page)).toEqual(before);
});

test("a malformed or oversized backup is rejected without writing browser records", async ({ page }) => {
  // Catches accepting invalid JSON or reading/accepting an unbounded file before restore preview.
  await seedRecords(page);
  const before = await storedRecords(page);
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{unfinished")
  });
  await expect(page.getByRole("alert").filter({ hasText: "备份文件" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "恢复预览" })).toHaveCount(0);
  expect(await storedRecords(page)).toEqual(before);
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "too-large.json", mimeType: "application/json", buffer: Buffer.alloc(2 * 1024 * 1024 + 1, " ")
  });
  await expect(page.getByRole("alert").filter({ hasText: "备份文件" })).toContainText("2 MiB");
  await expect(page.getByRole("heading", { name: "恢复预览" })).toHaveCount(0);
  expect(await storedRecords(page)).toEqual(before);
});

test("backup preview fits a narrow screen and confirmation works with the keyboard", async ({ page }) => {
  // Catches horizontal overflow and a confirmation control that cannot be operated without a pointer.
  await page.setViewportSize({ width: 375, height: 812 });
  await seedRecords(page);
  await page.getByLabel("选择备份文件").setInputFiles({
    name: "example.json", mimeType: "application/json", buffer: Buffer.from(backupText)
  });
  const checkbox = page.getByLabel("我了解恢复会替换当前记录");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  await page.keyboard.press("Tab");
  const restoreButton = page.getByRole("button", { name: "确认恢复", exact: true });
  await expect(restoreButton).toBeFocused();
  await expect.poll(() => restoreButton.evaluate((button) => {
    const target = button.getBoundingClientRect();
    const navigation = document.querySelector("nav")!.getBoundingClientRect();
    return target.top >= 0 && target.bottom <= navigation.top;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "恢复完成" })).toBeVisible();
});
