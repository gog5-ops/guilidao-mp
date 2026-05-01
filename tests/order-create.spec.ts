import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("填写白单", () => {
  test("页面显示商品选择标题", async ({ page }) => {
    await page.goto("/#/pages/order/create/index");
    await expect(activePage(page).getByText("选择商品和数量")).toBeVisible({
      timeout: 10000,
    });
  });

  test("显示合计信息", async ({ page }) => {
    await page.goto("/#/pages/order/create/index");
    await expect(activePage(page).getByText("合计")).toBeVisible({
      timeout: 10000,
    });
  });
});
