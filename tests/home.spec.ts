import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("首页", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示品牌名称", async ({ page }) => {
    await page.goto("/");
    await expect(activePage(page).locator(".brand-title")).toBeVisible({
      timeout: 10000,
    });
  });

  test("显示登录注册Tab", async ({ page }) => {
    await page.goto("/");
    await expect(
      activePage(page).locator(".auth-tab").filter({ hasText: "登录" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      activePage(page).locator(".auth-tab").filter({ hasText: "注册" })
    ).toBeVisible();
  });

  test("显示手机号输入框", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('input[placeholder="请输入手机号"]')
    ).toBeVisible({ timeout: 10000 });
  });
});
