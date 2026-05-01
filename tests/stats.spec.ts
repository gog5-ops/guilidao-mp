import { test, expect } from "@playwright/test";

test.describe("数据统计", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/pages/stats/index");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示日期筛选Tab", async ({ page }) => {
    await page.goto("/pages/stats/index");
    await expect(page.locator("text=今天")).toBeVisible();
    await expect(page.locator("text=本周")).toBeVisible();
    await expect(page.locator("text=本月")).toBeVisible();
    await expect(page.locator("text=全部")).toBeVisible();
  });

  test("日期筛选Tab可切换", async ({ page }) => {
    await page.goto("/pages/stats/index");
    await page.locator("text=本月").click();
    await expect(page.locator("text=本月")).toBeVisible();
  });

  test("显示统计概览", async ({ page }) => {
    await page.goto("/pages/stats/index");
    await expect(page.locator("text=总订单")).toBeVisible();
    await expect(page.locator("text=总金额")).toBeVisible();
  });
});
