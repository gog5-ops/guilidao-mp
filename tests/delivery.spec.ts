import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("配送地址修改", () => {
  test("页面加载成功", async ({ page }) => {
    await page.goto("/#/pages/delivery/index");
    // Sub-pages have their own title
    await expect(activePage(page).getByText("送货上门")).toBeVisible({
      timeout: 10000,
    });
  });

  test("显示配送方式选项", async ({ page }) => {
    await page.goto("/#/pages/delivery/index");
    await expect(activePage(page).getByText("送货上门")).toBeVisible({
      timeout: 10000,
    });
    await expect(activePage(page).getByText("快递到家")).toBeVisible();
  });

  test("配送方式可切换", async ({ page }) => {
    await page.goto("/#/pages/delivery/index");
    await expect(activePage(page).getByText("送货上门")).toBeVisible({
      timeout: 10000,
    });
    await activePage(page).getByText("快递到家").click();
    // Form labels remain visible
    await expect(activePage(page).getByText("期望送达时间")).toBeVisible();
  });

  test("显示保存按钮", async ({ page }) => {
    await page.goto("/#/pages/delivery/index");
    await expect(
      activePage(page).locator("taro-button-core.btn-save")
    ).toBeVisible({ timeout: 10000 });
  });

  test("显示送达时间输入", async ({ page }) => {
    await page.goto("/#/pages/delivery/index");
    await expect(activePage(page).getByText("期望送达时间")).toBeVisible({
      timeout: 10000,
    });
  });
});
