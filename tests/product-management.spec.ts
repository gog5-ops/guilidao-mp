import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

test.describe("Product management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/pages/product/index");
    await expect(activePage(page).locator(".page-title")).toBeVisible({
      timeout: 10000,
    });
  });

  test("view product list", async ({ page }) => {
    await expect(activePage(page).getByText("+ 添加商品")).toBeVisible();
    await expect(activePage(page).getByText("罗汉果")).toBeVisible();
    await expect(activePage(page).getByText("桂圆肉")).toBeVisible();
  });

  test("product cards show spec, unit, and price", async ({ page }) => {
    const firstCard = activePage(page).locator(".product-card").first();
    await expect(firstCard.locator(".info-label").first()).toBeVisible();
    await expect(firstCard.locator(".price-value")).toBeVisible();
  });

  test("product cards show active badge", async ({ page }) => {
    expect(
      await activePage(page).locator(".badge-active").count()
    ).toBeGreaterThan(0);
  });

  test("open add product form", async ({ page }) => {
    await activePage(page).getByText("+ 添加商品").click();
    await expect(activePage(page).locator(".form-title")).toContainText("添加商品");
    await expect(activePage(page).getByText("商品名称")).toBeVisible();
    await expect(
      activePage(page).locator('input[placeholder="如：罗汉果"]')
    ).toBeVisible();
    await expect(activePage(page).locator(".btn-save")).toBeVisible();
    await expect(activePage(page).locator(".btn-cancel")).toBeVisible();
  });

  test("add new product", async ({ page }) => {
    await activePage(page).getByText("+ 添加商品").click();
    await expect(activePage(page).locator(".form-title")).toContainText("添加商品");

    await activePage(page)
      .locator('input[placeholder="如：罗汉果"]')
      .fill("新测试商品");
    await activePage(page)
      .locator('input[placeholder="如：38克/盒"]')
      .fill("100克/包");
    await activePage(page)
      .locator('input[placeholder="如：4盒/套"]')
      .fill("2包/套");
    await activePage(page)
      .locator('input[placeholder="如：120"]')
      .fill("88");
    await activePage(page)
      .locator('input[placeholder="如：1"]')
      .fill("99");

    await activePage(page).locator(".btn-save").click();
    await expect(activePage(page).getByText("新测试商品")).toBeVisible({
      timeout: 5000,
    });
  });

  test("edit existing product", async ({ page }) => {
    await activePage(page).locator(".btn-edit").first().click();
    await expect(activePage(page).locator(".form-title")).toContainText("编辑商品");
    await expect(activePage(page).locator(".btn-save")).toBeVisible();
    await expect(activePage(page).locator(".btn-cancel")).toBeVisible();
  });

  test("cancel add product form", async ({ page }) => {
    await activePage(page).getByText("+ 添加商品").click();
    await expect(activePage(page).locator(".form-title")).toContainText("添加商品");
    await activePage(page).locator(".btn-cancel").click();
    await expect(activePage(page).getByText("+ 添加商品")).toBeVisible();
  });

  test("toggle product active/inactive", async ({ page }) => {
    const firstToggle = activePage(page).locator(".btn-toggle").first();
    const toggleText = await firstToggle.textContent();

    await firstToggle.click();
    if (toggleText?.includes("下架")) {
      await expect(
        page.locator(".taro__toast p").filter({ hasText: "已下架" })
      ).toBeVisible({ timeout: 5000 });
    } else {
      await expect(
        page.locator(".taro__toast p").filter({ hasText: "已上架" })
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
