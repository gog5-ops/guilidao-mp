import { test, expect } from "@playwright/test";

test.describe("首页", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示品牌名称", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=桂礼道")).toBeVisible();
  });

  test("显示角色选择按钮", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=我是导游")).toBeVisible();
    await expect(page.locator("text=我是供货商")).toBeVisible();
  });

  test("显示身份选择提示", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=请选择您的身份")).toBeVisible();
  });
});
