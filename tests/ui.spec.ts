import { expect, test, type Locator } from "@playwright/test";

const routes = [
  { label: "今日", path: "/", heading: "今天只需要一步" },
  { label: "本周", path: "/weekly", heading: "本周的温柔进度" },
  { label: "地点", path: "/places", heading: "我的地点" },
  { label: "同行", path: "/partner", heading: "Partner Mode" },
  { label: "设置", path: "/settings", heading: "应用名称" }
];

async function visibleInputColors(input: Locator) {
  return input.evaluate(async (element) => {
    // Wait for a theme's color transitions before comparing the rendered result.
    await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, text: style.color };
  });
}

test("all three themes change rendered colors and persist after reload", async ({ page }) => {
  await page.goto("/settings");
  const name = page.getByPlaceholder("One Step Closer");
  await name.fill("Theme demo");
  const colors = [];

  for (const label of ["温暖", "绿意", "极简"]) {
    const theme = page.getByRole("button", { name: new RegExp(`^${label}`) });
    await theme.click();
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    const beforeReload = await visibleInputColors(name);
    expect(beforeReload.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(beforeReload.text).not.toBe(beforeReload.background);

    await page.reload();
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    await expect(name).toHaveValue("Theme demo");
    await expect.poll(() => visibleInputColors(name)).toEqual(beforeReload);
    colors.push(beforeReload.background);
  }

  // A selected state alone would miss a broken stylesheet with identical themes.
  expect(new Set(colors).size).toBe(3);
});

for (const width of [390, 1280]) {
  test(`all five routes fit a ${width}px viewport and navigation remains usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");

    for (const route of routes) {
      const link = page.getByRole("link", { name: route.label, exact: true }).filter({ visible: true });
      await expect(link).toHaveCount(1);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${route.path === "/" ? "/" : route.path}/?$`));
      await expect(page.getByRole("heading", { name: route.heading, exact: true })).toBeVisible();
      await expect(link).toHaveAttribute("aria-current", "page");

      await expect.poll(() => page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - viewport;
      }), { message: `${route.path} should not require horizontal scrolling at ${width}px` }).toBeLessThanOrEqual(1);

      const bounds = await link.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      expect(bounds!.height).toBeGreaterThanOrEqual(40);
    }
  });

  test(`place controls retain visible styling and work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/places");
    const name = page.getByPlaceholder("名称", { exact: true });
    const notes = page.getByPlaceholder("备注，例如招牌菜、停车、是否适合一起去");
    const save = page.getByRole("button", { name: "保存地点", exact: true });
    await expect(save).toBeDisabled();
    await expect.poll(() => save.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeLessThan(1);

    for (const control of [name, save]) {
      await expect(control).toBeVisible();
      const style = await control.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          radius: Number.parseFloat(computed.borderTopLeftRadius),
          background: computed.backgroundColor,
          text: computed.color
        };
      });
      expect(style.height).toBeGreaterThanOrEqual(40);
      expect(style.radius).toBeGreaterThan(0);
      expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
      expect(style.text).not.toBe(style.background);
    }

    await name.focus();
    await expect(name).toBeFocused();
    await expect.poll(() => name.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
    await name.fill("Demo market");
    await page.getByRole("combobox", { name: "地点类型" }).selectOption({ label: "超市 / 食材" });
    await notes.fill("Fictional place for a browser test");
    await expect(save).toBeEnabled();
    await expect(save).toHaveCSS("opacity", "1");

    // Keyboard focus must remain visible on the primary action after the CSS upgrade.
    const unfocusedShadow = await save.evaluate((element) => getComputedStyle(element).boxShadow);
    await page.keyboard.press("Tab");
    await save.focus();
    await expect(save).toBeFocused();
    await expect.poll(() => save.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(unfocusedShadow);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Demo market", exact: true })).toBeVisible();
    await expect(page.getByText("Fictional place for a browser test", { exact: true })).toBeVisible();
    await expect(name).toHaveValue("");
    await expect(save).toBeDisabled();
  });
}
