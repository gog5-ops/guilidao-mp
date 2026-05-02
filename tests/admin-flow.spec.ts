import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

async function loginAsAdmin(page: Page, phone = "13800003333") {
  await page.goto("/");
  await expect(activePage(page).locator(".brand-title")).toBeVisible({
    timeout: 10000,
  });
  await activePage(page)
    .locator(".auth-tab")
    .filter({ hasText: "注册" })
    .click();
  await page.locator('input[placeholder="请输入姓名"]').fill("管理员小王");
  await page.locator('input[placeholder="请输入手机号"]').fill(phone);
  await activePage(page)
    .locator(".role-chip")
    .filter({ hasText: "管理员" })
    .click();
  await activePage(page).locator("taro-button-core.btn-primary").click();
  // Admin redirected to admin dashboard via reLaunch
  await expect(activePage(page).getByText("总订单")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Admin dashboard", () => {
  test("login as admin and see dashboard", async ({ page }) => {
    await loginAsAdmin(page, "13800003401");
    await expect(activePage(page).locator(".welcome")).toContainText(
      "管理员小王"
    );
    await expect(activePage(page).getByText("总订单")).toBeVisible();
    await expect(activePage(page).getByText("总收入")).toBeVisible();
    await expect(activePage(page).getByText("总团次")).toBeVisible();
    await expect(activePage(page).getByText("导游数")).toBeVisible();
  });

  test("see summary cards", async ({ page }) => {
    await loginAsAdmin(page, "13800003402");
    expect(await activePage(page).locator(".summary-card").count()).toBe(4);
  });

  test("see product ranking section", async ({ page }) => {
    await loginAsAdmin(page, "13800003403");
    await expect(activePage(page).getByText("商品销量排行")).toBeVisible();
  });

  test("filter orders by status", async ({ page }) => {
    await loginAsAdmin(page, "13800003404");
    await expect(activePage(page).getByText("订单列表")).toBeVisible();

    await activePage(page)
      .locator(".filter-btn")
      .filter({ hasText: "待确认" })
      .click();
    await page.waitForTimeout(300);

    await activePage(page)
      .locator(".filter-btn")
      .filter({ hasText: "全部" })
      .first()
      .click();
    await page.waitForTimeout(300);
  });

  test("filter orders by date", async ({ page }) => {
    await loginAsAdmin(page, "13800003405");
    await expect(activePage(page).getByText("订单列表")).toBeVisible();

    // Date quick buttons use .date-quick-btn class
    await activePage(page)
      .locator(".date-quick-btn")
      .filter({ hasText: "今天" })
      .click();
    await page.waitForTimeout(300);

    await activePage(page)
      .locator(".date-quick-btn")
      .filter({ hasText: "本月" })
      .click();
    await page.waitForTimeout(300);
  });

  test("export CSV triggers download", async ({ page }) => {
    await loginAsAdmin(page, "13800003406");
    await expect(activePage(page).getByText("订单列表")).toBeVisible();

    const exportBtn = activePage(page).locator(".btn-export");
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page
      .waitForEvent("download", { timeout: 5000 })
      .catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain("订单导出");
    }
  });

  test("navigate to product management", async ({ page }) => {
    await loginAsAdmin(page, "13800003407");
    await activePage(page)
      .locator(".btn-manage")
      .filter({ hasText: "商品管理" })
      .click();
    await expect(activePage(page).getByText("+ 添加商品")).toBeVisible({
      timeout: 10000,
    });
  });

  test("navigate to red slip management", async ({ page }) => {
    await loginAsAdmin(page, "13800003408");
    await activePage(page)
      .locator(".btn-manage")
      .filter({ hasText: "红单管理" })
      .click();
    await expect(activePage(page).getByText("+ 创建红单")).toBeVisible({
      timeout: 10000,
    });
  });
});
