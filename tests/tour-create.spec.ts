import { test, expect } from "@playwright/test";

test.describe("创建团次", () => {
  test("页面显示表单元素", async ({ page }) => {
    await page.goto("/pages/tour/create/index");
    await expect(page.locator("text=团号")).toBeVisible();
    await expect(page.locator("text=出团日期")).toBeVisible();
    await expect(page.locator("text=创建团次")).toBeVisible();
  });

  test("团号输入框有默认值", async ({ page }) => {
    await page.goto("/pages/tour/create/index");
    const input = page.locator("input").first();
    const value = await input.inputValue();
    expect(value).toMatch(/^GL\d{8}-\d{2}$/);
  });

  test("日期选择器显示今天日期", async ({ page }) => {
    await page.goto("/pages/tour/create/index");
    const today = new Date().toISOString().slice(0, 10);
    await expect(page.locator(`text=${today}`)).toBeVisible();
  });
});
