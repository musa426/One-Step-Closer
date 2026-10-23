import { expect, test, type Page } from "@playwright/test";

const settings = { appName: "Before restore", mainFocus: "balanced", reminderText: "Keep my words", theme: "warm" };
const backup = {
  app: "one-step-closer", formatVersion: 1, exportedAt: "2026-10-22T12:00:00.000Z",
  data: {
    entries: {}, places: [],
    partner: { personOne: "Example A", personTwo: "Example B", weeklyGoal: null, completedThisWeek: false, note: "", updatedAt: null },
    settings: { ...settings, appName: "Restored journal", theme: "green" }
  }
};

async function initialize(page: Page) {
  await page.goto("/settings");
  await expect(page.getByPlaceholder("One Step Closer")).toBeVisible();
  await page.getByPlaceholder("One Step Closer").fill("Before restore");
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("osc:state");
    return raw ? JSON.parse(raw).data.settings.appName : null;
  })).toBe("Before restore");
}

async function preview(page: Page) {
  await page.getByLabel("选择备份文件").setInputFiles({ name: "example.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByRole("button", { name: "确认恢复", exact: true })).toBeVisible();
  await page.getByLabel("我了解恢复会替换当前记录").check();
}

test("first edit migrates legacy records without changing their original bytes", async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem("osc:settings", value), JSON.stringify(settings));
  await page.goto("/settings");
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Before restore");
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBeNull();
  await page.getByPlaceholder("One Step Closer").fill("Edited journal");
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("osc:state");
    return raw ? JSON.parse(raw).data.settings.appName : null;
  })).toBe("Edited journal");
  expect(await page.evaluate(() => localStorage.getItem("osc:settings"))).toBe(JSON.stringify(settings));
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Edited journal");
});

test("failed restore commit leaves the previous snapshot intact after reload", async ({ page }) => {
  await initialize(page);
  await preview(page);
  const before = await page.evaluate(() => localStorage.getItem("osc:state"));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "osc:state") throw new DOMException("Full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /保存|恢复/ }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBe(before);
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Before restore");
});

test("an edit in another tab invalidates a restore preview without losing the edit", async ({ page, context }) => {
  await initialize(page);
  await preview(page);
  const second = await context.newPage();
  await second.goto("/settings");
  await expect(second.getByPlaceholder("One Step Closer")).toHaveValue("Before restore");
  await second.getByPlaceholder("One Step Closer").fill("Another tab's edit");
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Another tab's edit");
  const before = await page.evaluate(() => localStorage.getItem("osc:state"));
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /变化|重新|更新/ }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBe(before);
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Another tab's edit");
});

test("simultaneous new-version place saves retain both records", async ({ page, context }) => {
  await initialize(page);
  const second = await context.newPage();
  await Promise.all([page.goto("/places"), second.goto("/places")]);
  await page.getByPlaceholder("名称", { exact: true }).fill("First fictional café");
  await second.getByPlaceholder("名称", { exact: true }).fill("Second fictional café");
  await Promise.all([
    page.getByRole("button", { name: "保存地点", exact: true }).click(),
    second.getByRole("button", { name: "保存地点", exact: true }).click()
  ]);
  await expect(page.getByRole("heading", { name: "First fictional café", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Second fictional café", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "First fictional café", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Second fictional café", exact: true })).toBeVisible();
});

test("old-version writes after migration are preserved and block further edits", async ({ page, context }) => {
  await initialize(page);
  const before = await page.evaluate(() => localStorage.getItem("osc:state"));
  const second = await context.newPage();
  await second.goto("/settings");
  await second.evaluate((value) => localStorage.setItem("osc:settings", JSON.stringify(value)), { ...settings, appName: "Old window edit" });
  await expect(page.getByRole("alert").filter({ hasText: /旧版|旧窗口/ })).toBeVisible();
  await expect(page.getByPlaceholder("One Step Closer")).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBe(before);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("osc:settings")!).appName)).toBe("Old window edit");
});

test("an edit queued behind a restore cannot overwrite the restored generation", async ({ page, context }) => {
  await initialize(page);
  await preview(page);
  const editor = await context.newPage();
  await editor.goto("/settings");
  await expect(editor.getByPlaceholder("One Step Closer")).toHaveValue("Before restore");
  const blocker = await context.newPage();
  await blocker.goto("/settings");
  await blocker.evaluate(() => new Promise<void>((acquired) => {
    void navigator.locks.request("osc:state-write", () => new Promise<void>((release) => {
      (window as unknown as { releaseLock: () => void }).releaseLock = release;
      acquired();
    }));
  }));
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect.poll(() => blocker.evaluate(async () => (await navigator.locks.query()).pending?.length ?? 0)).toBeGreaterThanOrEqual(1);
  await editor.getByPlaceholder("One Step Closer").fill("Queued old edit");
  await expect.poll(() => blocker.evaluate(async () => (await navigator.locks.query()).pending?.length ?? 0)).toBeGreaterThanOrEqual(2);
  await blocker.evaluate(() => (window as unknown as { releaseLock: () => void }).releaseLock());
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Restored journal");
  await expect(editor.getByRole("alert").filter({ hasText: /恢复|重新/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Restored journal");
});

test("browsers without Web Locks can export but cannot edit or restore", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined }));
  await page.goto("/settings");
  await expect(page.getByRole("alert").filter({ hasText: "Web Locks" })).toBeVisible();
  await expect(page.getByPlaceholder("One Step Closer")).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("one-step-closer-backup");
  await preview(page);
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Web Locks" }).last()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBeNull();
});

test("unknown internal versions stay intact and cannot be exported as empty data", async ({ page }) => {
  const raw = '{"schemaVersion":99,"data":{"private":"fictional"}}';
  await page.addInitScript((value) => localStorage.setItem("osc:state", value), raw);
  await page.goto("/settings");
  await expect(page.getByRole("alert").filter({ hasText: "读取" })).toBeVisible();
  await expect(page.getByPlaceholder("One Step Closer")).toBeDisabled();
  const downloads: string[] = [];
  page.on("download", (download) => downloads.push(download.suggestedFilename()));
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "读取" })).toHaveCount(2);
  expect(downloads).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem("osc:state"))).toBe(raw);
});

test("backup export and restore work offline after a production cache is ready", async ({ page, context }) => {
  await initialize(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("one-step-closer-backup");
  await preview(page);
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Restored journal");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Restored journal");
});

test("pending edits show saving status and warn before a reload can discard them", async ({ page, context }) => {
  await initialize(page);
  const blocker = await context.newPage();
  await blocker.goto("/settings");
  await blocker.evaluate(() => new Promise<void>((acquired) => {
    void navigator.locks.request("osc:state-write", () => new Promise<void>((release) => {
      (window as unknown as { releaseLock: () => void }).releaseLock = release;
      acquired();
    }));
  }));
  await page.getByPlaceholder("One Step Closer").fill("Wait for persistence");
  await expect(page.getByRole("status").filter({ hasText: "正在保存" })).toBeVisible();
  const dialog = page.waitForEvent("dialog");
  // Trigger a real browser reload without awaiting a navigation we intend to cancel.
  await page.evaluate(() => { window.setTimeout(() => window.location.reload(), 0); });
  const warning = await dialog;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Wait for persistence");
  await blocker.evaluate(() => (window as unknown as { releaseLock: () => void }).releaseLock());
  await expect(page.getByRole("status").filter({ hasText: "正在保存" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByPlaceholder("One Step Closer")).toHaveValue("Wait for persistence");
});

test("closing a window before its queued restore commits leaves the dataset unchanged", async ({ page, context }) => {
  await initialize(page);
  await preview(page);
  const blocker = await context.newPage();
  await blocker.goto("/settings");
  const before = await blocker.evaluate(() => localStorage.getItem("osc:state"));
  await blocker.evaluate(() => new Promise<void>((acquired) => {
    void navigator.locks.request("osc:state-write", () => new Promise<void>((release) => {
      (window as unknown as { releaseLock: () => void }).releaseLock = release;
      acquired();
    }));
  }));
  await page.getByRole("button", { name: "确认恢复", exact: true }).click();
  await expect.poll(() => blocker.evaluate(async () => (await navigator.locks.query()).pending?.length ?? 0)).toBeGreaterThanOrEqual(1);
  await page.close();
  await blocker.evaluate(() => (window as unknown as { releaseLock: () => void }).releaseLock());
  await blocker.evaluate(() => navigator.locks.request("osc:state-write", () => undefined));
  expect(await blocker.evaluate(() => localStorage.getItem("osc:state"))).toBe(before);
  await blocker.reload();
  await expect(blocker.getByPlaceholder("One Step Closer")).toHaveValue("Before restore");
});
