import { test, expect } from "@playwright/test";

test.describe("配送地址修改", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/pages/delivery/index");
    await expect(page).toHaveTitle(/桂礼道/);
  });

  test("显示三种配送方式", async ({ page }) => {
    await page.goto("/pages/delivery/index");
    await expect(page.locator("text=酒店送货")).toBeVisible();
    await expect(page.locator("text=景点自提")).toBeVisible();
    await expect(page.locator("text=快递到家")).toBeVisible();
  });

  test("配送方式可切换", async ({ page }) => {
    await page.goto("/pages/delivery/index");
    await page.locator("text=快递到家").click();
    await expect(page.locator("text=收货地址")).toBeVisible();
  });

  test("显示保存按钮", async ({ page }) => {
    await page.goto("/pages/delivery/index");
    await expect(page.locator("text=保存修改")).toBeVisible();
  });

  test("显示送达时间输入", async ({ page }) => {
    await page.goto("/pages/delivery/index");
    await expect(page.locator("text=期望送达时间")).toBeVisible();
  });
});
