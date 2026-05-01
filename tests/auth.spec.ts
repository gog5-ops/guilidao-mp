import { test, expect, type Page } from "@playwright/test";

/**
 * Returns a locator scoped to the currently active Taro page.
 * Taro H5 keeps a page stack in the DOM; the active one is the
 * .taro_page_show that is NOT shaded by a newer page on top.
 */
function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("Login and Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(activePage(page).locator(".brand-title")).toBeVisible({
      timeout: 10000,
    });
  });

  test("login page shows brand and auth form", async ({ page }) => {
    await expect(activePage(page).locator(".brand-sub")).toBeVisible();
    await expect(
      activePage(page).locator(".auth-tab").filter({ hasText: "登录" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".auth-tab").filter({ hasText: "注册" })
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="请输入手机号"]')
    ).toBeVisible();
  });

  test("login with guide phone number", async ({ page }) => {
    await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
      timeout: 10000,
    });
    await expect(activePage(page).locator(".section-title")).toContainText(
      "我的团次"
    );
  });

  test("login with supplier phone number redirects to orders", async ({
    page,
  }) => {
    await page.locator('input[placeholder="请输入手机号"]').fill("13800002222");
    await activePage(page).locator("taro-button-core.btn-primary").click();
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

  test("login with wrong phone shows error toast", async ({ page }) => {
    await page.locator('input[placeholder="请输入手机号"]').fill("19999999999");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(
      page.locator(".taro__toast p").filter({ hasText: "手机号未注册" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("register new user with name, phone, and role", async ({ page }) => {
    await activePage(page)
      .locator(".auth-tab")
      .filter({ hasText: "注册" })
      .click();
    await expect(
      page.locator('input[placeholder="请输入姓名"]')
    ).toBeVisible();
    await page.locator('input[placeholder="请输入姓名"]').fill("测试导游");
    await page.locator('input[placeholder="请输入手机号"]').fill("13900009999");
    await expect(
      activePage(page).locator(".role-chip.active")
    ).toContainText("导游");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(activePage(page).locator(".welcome")).toContainText(
      "测试导游",
      { timeout: 10000 }
    );
  });

  test("register with existing phone shows error toast", async ({ page }) => {
    await activePage(page)
      .locator(".auth-tab")
      .filter({ hasText: "注册" })
      .click();
    await page.locator('input[placeholder="请输入姓名"]').fill("重复用户");
    await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(
      page.locator(".taro__toast p").filter({ hasText: "该手机号已注册" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("logout and re-login", async ({ page }) => {
    await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
      timeout: 10000,
    });
    await activePage(page).locator(".btn-logout").click();
    await expect(activePage(page).locator(".brand-title")).toBeVisible({
      timeout: 5000,
    });
    await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
    await activePage(page).locator("taro-button-core.btn-primary").click();
    await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
      timeout: 10000,
    });
  });
});
