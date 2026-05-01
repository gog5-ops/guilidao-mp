import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("创建团次", () => {
  test("页面显示表单元素", async ({ page }) => {
    await page.goto("/#/pages/tour/create/index");
    await expect(activePage(page).getByText("团号")).toBeVisible({
      timeout: 10000,
    });
    await expect(activePage(page).getByText("出团日期")).toBeVisible();
    await expect(
      activePage(page).locator("taro-button-core.btn-submit")
    ).toBeVisible();
  });

  test("团号输入框有默认值", async ({ page }) => {
    await page.goto("/#/pages/tour/create/index");
    await expect(activePage(page).getByText("团号")).toBeVisible({
      timeout: 10000,
    });
    const input = activePage(page).locator("input").first();
    const value = await input.inputValue();
    expect(value).toMatch(/^GL\d{8}-\d{2}$/);
  });

  test("日期选择器显示今天日期", async ({ page }) => {
    await page.goto("/#/pages/tour/create/index");
    const today = new Date().toISOString().slice(0, 10);
    await expect(activePage(page).getByText(today)).toBeVisible({
      timeout: 10000,
    });
  });
});
