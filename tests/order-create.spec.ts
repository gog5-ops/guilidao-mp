import { test, expect } from "@playwright/test";

test.describe("填写白单", () => {
  test("页面显示商品选择标题", async ({ page }) => {
    await page.goto("/pages/order/create/index");
    await expect(page.locator("text=选择商品和数量")).toBeVisible();
  });

  test("显示下一步按钮", async ({ page }) => {
    await page.goto("/pages/order/create/index");
    await expect(page.locator("text=下一步")).toBeVisible();
  });

  test("显示合计信息", async ({ page }) => {
    await page.goto("/pages/order/create/index");
    await expect(page.locator("text=合计")).toBeVisible();
  });
});
