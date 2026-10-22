import { expect, test, type Page } from "@playwright/test";

const sundayNight = new Date("2026-10-25T23:59:50-04:00");

test.use({ timezoneId: "America/New_York" });

async function openAtSundayNight(page: Page, path = "/") {
  await page.clock.install({ time: sundayNight });
  await page.clock.pauseAt(sundayNight);
  await page.goto(path);
}

test("an open daily page writes the new day after local midnight", async ({ page }) => {
  await openAtSundayNight(page);
  const reflection = page.getByPlaceholder("今天有什么让你更靠近、更平静，或只是想记下来的事？");
  await reflection.fill("Sunday reflection");
  await page.clock.runFor(11_000);
  await expect(reflection).toHaveValue("");
  await reflection.fill("Monday reflection");

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("osc:daily-entries") ?? "{}")))
    .toMatchObject({
      "2026-10-25": { reflection: "Sunday reflection" },
      "2026-10-26": { reflection: "Monday reflection" }
    });
});

test("returning to the foreground refreshes the daily entry without waiting for a timer", async ({ page }) => {
  await openAtSundayNight(page);
  const reflection = page.getByPlaceholder("今天有什么让你更靠近、更平静，或只是想记下来的事？");
  await reflection.fill("Before sleeping");
  await page.clock.setSystemTime(new Date("2026-10-26T09:00:00-04:00"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(reflection).toHaveValue("");
  await reflection.fill("After returning");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("osc:daily-entries") ?? "{}")["2026-10-26"]?.reflection))
    .toBe("After returning");
});

test("an open weekly page starts a new local week on Monday", async ({ page }) => {
  await openAtSundayNight(page, "/weekly");
  await expect(page.getByText("10/19 - 10/25", { exact: true })).toBeVisible();
  await page.clock.runFor(11_000);
  await expect(page.getByText("10/26 - 11/1", { exact: true })).toBeVisible();
});

test("a partner goal persists across weeks but its completion does not", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("osc:partner", JSON.stringify({
      personOne: "我",
      personTwo: "同行的人",
      weeklyGoal: "cook_halal_meal",
      completedThisWeek: true,
      note: "Keep this goal",
      updatedAt: "2026-10-25T12:00:00-04:00"
    }));
  });
  await openAtSundayNight(page, "/partner");
  const completion = page.getByRole("button", { name: /这周已经一起完成/ });
  await expect(completion).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(11_000);
  await expect(completion).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: /一起做一顿清真饭/ })).toHaveAttribute("aria-pressed", "true");
  await completion.click();
  await expect(completion).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("osc:partner") ?? "{}")))
    .toMatchObject({ completedThisWeek: true, updatedAt: "2026-10-26T04:00:01.000Z" });
});
