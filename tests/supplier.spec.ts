import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("供货商订单列表", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/#/pages/supplier/orders/index");
    // Sub-pages have custom navigation titles (e.g., "订单管理")
    await expect(
      activePage(page).locator(".tab").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("显示状态筛选Tab", async ({ page }) => {
    await page.goto("/#/pages/supplier/orders/index");
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "待确认" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "待发货" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "已发货" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "已完成" })
    ).toBeVisible();
  });

  test("Tab 切换可点击", async ({ page }) => {
    await page.goto("/#/pages/supplier/orders/index");
    const tab = activePage(page).locator(".tab").filter({ hasText: "待发货" });
    await expect(tab).toBeVisible({ timeout: 10000 });
    await tab.click();
    await expect(tab).toBeVisible();
  });
});
