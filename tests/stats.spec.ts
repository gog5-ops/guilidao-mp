import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("数据统计", () => {
  test.beforeEach(async ({ page }) => {
    // Stats page needs login to display data
    await page.goto("/");
    await expect(
      activePage(page).locator(".brand-title")
    ).toBeVisible({ timeout: 10000 });
    await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
      timeout: 10000,
    });
  });

  test("页面加载成功", async ({ page }) => {
    await page.goto("/#/pages/stats/index");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示日期筛选Tab", async ({ page }) => {
    await page.goto("/#/pages/stats/index");
    await expect(activePage(page).getByText("今日")).toBeVisible({
      timeout: 10000,
    });
    await expect(activePage(page).getByText("本周")).toBeVisible();
    await expect(activePage(page).getByText("本月")).toBeVisible();
    await expect(
      activePage(page).getByText("全部", { exact: true })
    ).toBeVisible();
  });

  test("日期筛选Tab可切换", async ({ page }) => {
    await page.goto("/#/pages/stats/index");
    await expect(activePage(page).getByText("本月")).toBeVisible({
      timeout: 10000,
    });
    await activePage(page).getByText("本月").click();
    await expect(activePage(page).getByText("本月")).toBeVisible();
  });

  test("显示统计概览", async ({ page }) => {
    await page.goto("/#/pages/stats/index");
    await expect(activePage(page).getByText("总订单数")).toBeVisible({
      timeout: 10000,
    });
    await expect(activePage(page).getByText("总收入")).toBeVisible();
  });
});
