import { test, expect } from "@playwright/test";

test.describe("供货商订单列表", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/pages/supplier/orders/index");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示状态筛选Tab", async ({ page }) => {
    await page.goto("/pages/supplier/orders/index");
    await expect(page.locator("text=待确认")).toBeVisible();
    await expect(page.locator("text=待发货")).toBeVisible();
    await expect(page.locator("text=已发货")).toBeVisible();
    await expect(page.locator("text=已完成")).toBeVisible();
  });

  test("Tab 切换可点击", async ({ page }) => {
    await page.goto("/pages/supplier/orders/index");
    const tab = page.locator("text=待发货");
    await tab.click();
    await expect(tab).toBeVisible();
  });
});
